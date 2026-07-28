import { useState, useEffect } from "react";
import { ShieldCheck, HardDrive, Monitor, Building2, Check, Save } from "lucide-react";
import { api } from "../lib/tauri";

export default function Configuracoes() {
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeOriginal, setNomeOriginal] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [nomeSalvo, setNomeSalvo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    api.obterConfig("nome_empresa").then((v) => {
      setNomeEmpresa(v);
      setNomeOriginal(v);
    }).catch(() => {});
  }, []);

  async function salvarNome() {
    if (!nomeEmpresa.trim()) return;
    setSalvandoNome(true);
    await api.salvarConfig("nome_empresa", nomeEmpresa.trim()).catch(() => {});
    setNomeOriginal(nomeEmpresa.trim());
    setSalvandoNome(false);
    setNomeSalvo(true);
    setTimeout(() => setNomeSalvo(false), 2000);
  }

  async function exportarCsv() {
    setExportando(true);
    const csv = await api.exportarCsv().catch(() => null);
    if (csv) {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produtos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg("Arquivo baixado com sucesso.");
      setTimeout(() => setExportMsg(""), 3000);
    }
    setExportando(false);
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Configurações</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Gerencie as preferências do sistema</p>
      </div>

      <div className="space-y-4 max-w-2xl">

        {/* Empresa */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <Building2 size={17} className="text-[#3B9EFF]" />
            <span className="text-sm font-semibold text-[#1E293B]">Minha loja</span>
          </div>
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Nome da loja</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
              />
              <button
                onClick={salvarNome}
                disabled={salvandoNome || nomeEmpresa.trim() === nomeOriginal}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {nomeSalvo ? <Check size={15} /> : <Save size={15} />}
                {nomeSalvo ? "Salvo!" : "Salvar"}
              </button>
            </div>
          </div>
        </section>

        {/* Licença */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <ShieldCheck size={17} className="text-[#3B9EFF]" />
            <span className="text-sm font-semibold text-[#1E293B]">Licença</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Plano atual</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#64748B]">
                Grátis
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ativa
              </span>
            </div>
            <div className="pt-1">
              <p className="text-xs text-[#64748B] mb-2">
                No plano Grátis você pode cadastrar até 300 produtos e registrar 500 vendas por mês.
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#3B9EFF] text-[#3B9EFF] text-sm font-medium rounded-lg hover:bg-[#EBF5FF] transition-colors">
                Fazer upgrade para Passa Fácil — R$ 49,90/mês
              </button>
            </div>
          </div>
        </section>

        {/* Backup */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <HardDrive size={17} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">Backup e exportação</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <p className="text-sm text-[#64748B] mb-1">Localização do banco de dados</p>
              <code className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded px-3 py-1.5 block font-mono text-[#1E293B]">
                %APPDATA%\PassaFacil\passafacil.db
              </code>
              <p className="text-xs text-[#94A3B8] mt-1">Copie este arquivo para fazer backup completo.</p>
            </div>
            <div className="pt-1">
              {exportMsg && (
                <p className="text-xs text-green-600 mb-2 flex items-center gap-1.5">
                  <Check size={13} />{exportMsg}
                </p>
              )}
              <button
                onClick={exportarCsv}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-50"
              >
                <HardDrive size={15} />
                {exportando ? "Exportando..." : "Exportar produtos como CSV"}
              </button>
            </div>
          </div>
        </section>

        {/* Sistema */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <Monitor size={17} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">Sistema</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Versão do aplicativo</span>
              <span className="text-sm font-mono text-[#1E293B]">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Banco de dados</span>
              <span className="text-sm text-[#1E293B]">SQLite (local)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Modo offline</span>
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ativo
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
