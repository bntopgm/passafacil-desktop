import { useState, useEffect } from "react";
import { Wifi, WifiOff, Smartphone, Zap, Play, Square, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
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

export default function Scanner() {
  const [info, setInfo] = useState<ScannerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState("");
  const [firewallMsg, setFirewallMsg] = useState("");

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
    setTimeout(loadInfo, 300);
  }

  async function abrirFirewall() {
    setFirewallMsg("Abrindo janela de permissão...");
    await invoke("scanner_abrir_firewall").catch(() => {});
    setFirewallMsg("Pronto! Tente conectar o celular novamente.");
    setTimeout(() => setFirewallMsg(""), 5000);
  }

  const running = info?.running ?? false;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Scanner</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Use a câmera do celular como leitor de código de barras
        </p>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5 max-w-4xl">
        {/* Coluna esquerda */}
        <div className="space-y-4">

          {/* Servidor */}
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {running
                ? <Wifi size={17} className="text-green-500" />
                : <WifiOff size={17} className="text-[#94A3B8]" />}
              <span className="text-sm font-semibold text-[#1E293B]">Servidor</span>
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
                    <span className="text-sm text-[#64748B]">IP do computador</span>
                    <code className="text-sm font-mono font-semibold text-[#1E293B]">{info.ip}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Total de leituras</span>
                    <span className="text-sm font-semibold text-[#1E293B]">{info.total_reads}</span>
                  </div>
                  {info.last_barcode && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <p className="text-xs text-[#64748B] mb-1">Último código lido</p>
                      <code className="text-lg font-mono font-bold text-[#1E293B] tracking-widest">
                        {info.last_barcode}
                      </code>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#94A3B8]">
                  Clique em "Iniciar" para gerar o QR Code.
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E2E8F0] flex items-center gap-3">
              {running ? (
                <button onClick={stop} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <Square size={14} />Parar
                </button>
              ) : (
                <button onClick={start} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-50">
                  <Play size={14} />{loading ? "Iniciando..." : "Iniciar"}
                </button>
              )}
              {startError && <p className="text-xs text-red-500">{startError}</p>}
            </div>
          </section>

          {/* Dispositivos conectados */}
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <Smartphone size={17} className="text-[#3B9EFF]" />
              <span className="text-sm font-semibold text-[#1E293B]">Celulares conectados</span>
              {(info?.devices?.length ?? 0) > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-[#3B9EFF] text-white text-xs font-bold">
                  {info!.devices.length}
                </span>
              )}
            </div>
            {!(info?.devices?.length) ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#94A3B8]">
                <Smartphone size={28} className="mb-2 opacity-25" />
                <p className="text-sm">Nenhum celular conectado</p>
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
                      {d.last_seen && (
                        <p className="text-xs text-[#94A3B8]">Última leitura: {d.last_seen.slice(11, 19)}</p>
                      )}
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

          {/* Se não conectar */}
          {running && (
            <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <AlertTriangle size={17} className="text-amber-500" />
                <span className="text-sm font-semibold text-[#1E293B]">Não consegue conectar?</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-[#64748B]">
                  Verifique se o celular está na <strong>mesma rede Wi-Fi</strong> que este computador. Se estiver e mesmo assim não funcionar, o Firewall do Windows pode estar bloqueando.
                </p>
                <button
                  onClick={abrirFirewall}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <ShieldCheck size={15} />
                  Liberar no Firewall do Windows
                </button>
                {firewallMsg && (
                  <p className="text-xs text-green-600 font-medium">{firewallMsg}</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Coluna direita — QR Code */}
        <div>
          <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden sticky top-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-sm font-semibold text-[#1E293B]">Como usar</span>
              {running && (
                <button onClick={loadInfo} className="text-[#64748B] hover:text-[#1E293B] transition-colors">
                  <RefreshCw size={14} />
                </button>
              )}
            </div>

            {running && info?.qr_svg ? (
              <div className="p-5 flex flex-col items-center gap-4">
                <div
                  className="rounded-xl overflow-hidden border border-[#E2E8F0]"
                  dangerouslySetInnerHTML={{ __html: info.qr_svg }}
                />
                <ol className="text-xs text-[#64748B] space-y-2 w-full">
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#3B9EFF] text-white font-bold shrink-0 mt-0.5 text-[10px]">1</span>
                    Conecte o celular no <strong className="text-[#1E293B]">mesmo Wi-Fi</strong> deste computador
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#3B9EFF] text-white font-bold shrink-0 mt-0.5 text-[10px]">2</span>
                    Abra a câmera e aponte para o QR Code acima
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#3B9EFF] text-white font-bold shrink-0 mt-0.5 text-[10px]">3</span>
                    Toque no link que aparecer para abrir o scanner
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#3B9EFF] text-white font-bold shrink-0 mt-0.5 text-[10px]">4</span>
                    Permita acesso à câmera e comece a ler produtos
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center gap-3 py-12">
                <div className="w-44 h-44 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-xl flex items-center justify-center">
                  <WifiOff size={32} className="text-[#E2E8F0]" />
                </div>
                <p className="text-sm text-[#94A3B8] text-center">
                  Clique em "Iniciar" para<br />gerar o QR Code
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
