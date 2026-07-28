import { useState, useEffect } from "react";
import { Wifi, WifiOff, Smartphone, Zap, Play, Square, RefreshCw, Usb, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface DeviceInfo {
  id: string;
  name: string;
  reads: number;
  last_seen: string;
}

interface ScannerInfo {
  running: boolean;
  ip: string;
  port: number;
  token: string;
  url: string;
  qr_svg: string;
  devices: DeviceInfo[];
  last_barcode: string | null;
  total_reads: number;
}

type Mode = "wifi" | "usb";
type UsbStatus = "idle" | "trying" | "ok" | "error";

export default function Scanner() {
  const [info, setInfo] = useState<ScannerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState("");
  const [mode, setMode] = useState<Mode>("wifi");
  const [usbStatus, setUsbStatus] = useState<UsbStatus>("idle");
  const [usbError, setUsbError] = useState("");
  const [usbQr, setUsbQr] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadInfo() {
    const i = await invoke<ScannerInfo>("scanner_info").catch(() => null);
    if (i) setInfo(i);
  }

  useEffect(() => {
    loadInfo();
    const unsub = listen("barcode-received", () => loadInfo());
    const interval = setInterval(loadInfo, 2000);
    return () => {
      unsub.then((fn) => fn());
      clearInterval(interval);
    };
  }, []);

  async function start() {
    setLoading(true);
    setStartError("");
    const result = await invoke<ScannerInfo>("scanner_start").catch((e) => {
      setStartError(String(e));
      return null;
    });
    if (result) setInfo(result);
    setLoading(false);
  }

  async function stop() {
    await invoke("scanner_stop").catch(() => {});
    setUsbStatus("idle");
    setUsbQr("");
    setTimeout(loadInfo, 300);
  }

  async function setupUsb() {
    setUsbStatus("trying");
    setUsbError("");
    const qr = await invoke<string>("scanner_usb_qr").catch(() => "");
    setUsbQr(qr);
    const result = await invoke<string>("scanner_setup_usb").catch((e) => String(e));
    if (result === "ok") {
      setUsbStatus("ok");
    } else {
      setUsbStatus("error");
      setUsbError(result);
    }
  }

  function copyAdbCommand() {
    const port = info?.port ?? 8765;
    navigator.clipboard.writeText(`adb reverse tcp:${port} tcp:${port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const running = info?.running ?? false;
  const port = info?.port ?? 8765;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Scanner</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Transforme seu celular em um leitor de código de barras
        </p>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5 max-w-4xl">
        {/* Coluna esquerda */}
        <div className="space-y-4">

          {/* Servidor */}
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {running ? <Wifi size={17} className="text-green-500" /> : <WifiOff size={17} className="text-[#94A3B8]" />}
              <span className="text-sm font-semibold text-[#1E293B]">Servidor local</span>
              <span className={[
                "ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                running ? "bg-green-50 text-green-700" : "bg-slate-100 text-[#64748B]",
              ].join(" ")}>
                <span className={["w-1.5 h-1.5 rounded-full", running ? "bg-green-500" : "bg-[#94A3B8]"].join(" ")} />
                {running ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="px-5 py-4 space-y-3">
              {running && info ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">IP local</span>
                    <code className="text-sm font-mono font-semibold text-[#1E293B]">{info.ip}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Porta</span>
                    <code className="text-sm font-mono text-[#1E293B]">{info.port}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Leituras totais</span>
                    <span className="text-sm font-semibold text-[#1E293B]">{info.total_reads}</span>
                  </div>
                  {info.last_barcode && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <p className="text-xs text-[#64748B] mb-1">Último código recebido</p>
                      <code className="text-lg font-mono font-bold text-[#1E293B] tracking-widest">{info.last_barcode}</code>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#94A3B8]">
                  Funciona na rede local — não precisa de internet.
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E2E8F0] flex items-center gap-3">
              {running ? (
                <button onClick={stop} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <Square size={14} />Parar servidor
                </button>
              ) : (
                <button onClick={start} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-50">
                  <Play size={14} />{loading ? "Iniciando..." : "Iniciar servidor"}
                </button>
              )}
              {startError && <p className="text-xs text-red-500">{startError}</p>}
            </div>
          </section>

          {/* Dispositivos */}
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <Smartphone size={17} className="text-[#3B9EFF]" />
              <span className="text-sm font-semibold text-[#1E293B]">Dispositivos conectados</span>
              {(info?.devices?.length ?? 0) > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-[#3B9EFF] text-white text-xs font-bold">
                  {info!.devices.length}
                </span>
              )}
            </div>
            {!(info?.devices?.length) ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#94A3B8]">
                <Smartphone size={28} className="mb-2 opacity-25" />
                <p className="text-sm">Nenhum dispositivo conectado</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {info!.devices.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{d.name}</p>
                      {d.last_seen && <p className="text-xs text-[#94A3B8]">Última leitura: {d.last_seen.slice(11, 19)}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] shrink-0">
                      <Zap size={12} className="text-amber-500" />
                      {d.reads} leit.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna direita — QR Code */}
        <div>
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden sticky top-0">
            {/* Abas Wi-Fi / USB */}
            <div className="flex border-b border-[#E2E8F0]">
              <button
                onClick={() => setMode("wifi")}
                className={["flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2",
                  mode === "wifi" ? "border-[#3B9EFF] text-[#3B9EFF]" : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                ].join(" ")}
              >
                <Wifi size={13} />Wi-Fi
              </button>
              <button
                onClick={() => { setMode("usb"); if (running && usbStatus === "idle") setupUsb(); }}
                className={["flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2",
                  mode === "usb" ? "border-[#3B9EFF] text-[#3B9EFF]" : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                ].join(" ")}
              >
                <Usb size={13} />USB
              </button>
            </div>

            {/* Conteúdo Wi-Fi */}
            {mode === "wifi" && (
              running && info?.qr_svg ? (
                <div className="p-5 flex flex-col items-center gap-4">
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0]"
                    dangerouslySetInnerHTML={{ __html: info.qr_svg }} />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-[#64748B]">Escaneie com a câmera do celular</p>
                    <p className="text-xs text-[#94A3B8]">Celular e computador devem estar<br />na mesma rede Wi-Fi</p>
                  </div>
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700">
                      Se não abrir, permita a porta {port} no Firewall do Windows quando solicitado.
                    </p>
                  </div>
                  <button onClick={loadInfo} className="flex items-center gap-1.5 text-xs text-[#3B9EFF] hover:text-[#1A6BC4] transition-colors">
                    <RefreshCw size={12} />Atualizar
                  </button>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center gap-3 py-12">
                  <div className="w-44 h-44 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-xl flex items-center justify-center">
                    <WifiOff size={32} className="text-[#E2E8F0]" />
                  </div>
                  <p className="text-sm text-[#94A3B8] text-center">Inicie o servidor para<br />gerar o QR Code</p>
                </div>
              )
            )}

            {/* Conteúdo USB */}
            {mode === "usb" && (
              <div className="p-5 space-y-4">
                {!running ? (
                  <p className="text-sm text-[#94A3B8] text-center py-6">Inicie o servidor primeiro.</p>
                ) : (
                  <>
                    {/* Passo 1 */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#1E293B]">1. Conecte o celular via USB</p>
                      <p className="text-xs text-[#64748B]">Ative "Depuração USB" nas opções de desenvolvedor do celular.</p>
                    </div>

                    {/* Passo 2 — ADB */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#1E293B]">2. Redirecionamento de porta</p>
                      {usbStatus === "ok" ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <CheckCircle size={13} />ADB configurado automaticamente
                        </div>
                      ) : usbStatus === "error" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <AlertCircle size={13} />Execute manualmente no terminal:
                          </div>
                          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                            <code className="text-xs font-mono text-[#1E293B] flex-1">adb reverse tcp:{port} tcp:{port}</code>
                            <button onClick={copyAdbCommand} className="text-[#3B9EFF] hover:text-[#1A6BC4] transition-colors shrink-0">
                              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                          <button onClick={setupUsb} className="text-xs text-[#3B9EFF] hover:text-[#1A6BC4] transition-colors">
                            Tentar novamente
                          </button>
                        </div>
                      ) : usbStatus === "trying" ? (
                        <p className="text-xs text-[#64748B]">Configurando adb...</p>
                      ) : null}
                    </div>

                    {/* Passo 3 — QR */}
                    {usbQr && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#1E293B]">3. Escaneie o QR com o celular</p>
                        <div className="rounded-xl overflow-hidden border border-[#E2E8F0]"
                          dangerouslySetInnerHTML={{ __html: usbQr }} />
                        <p className="text-xs text-[#94A3B8] text-center">Funciona sem Wi-Fi e sem internet</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
