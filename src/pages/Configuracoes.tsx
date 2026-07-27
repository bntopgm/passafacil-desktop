import {
  ShieldCheck,
  Printer,
  HardDrive,
  Monitor,
  ChevronRight,
} from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 scrollbar-thin">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Configurações</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Gerencie as preferências do sistema
        </p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Licença */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <ShieldCheck size={17} className="text-[#3B9EFF]" />
            <span className="text-sm font-semibold text-[#1E293B]">
              Licença
            </span>
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
            <button className="w-full mt-1 flex items-center justify-between px-4 py-2.5 border border-[#3B9EFF] text-[#3B9EFF] text-sm font-medium rounded-lg hover:bg-[#EBF5FF] transition-colors">
              Fazer upgrade para Profissional
              <ChevronRight size={15} />
            </button>
          </div>
        </section>

        {/* Impressora */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <Printer size={17} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">
              Impressora
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Impressora térmica</span>
              <span className="text-sm text-[#64748B]">Não configurada</span>
            </div>
            <button className="text-sm text-[#3B9EFF] hover:text-[#1A6BC4] font-medium transition-colors">
              Configurar impressora →
            </button>
          </div>
        </section>

        {/* Backup */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <HardDrive size={17} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">
              Backup
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Último backup</span>
              <span className="text-sm text-[#64748B]">Nunca realizado</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
              <HardDrive size={14} />
              Fazer backup agora
            </button>
          </div>
        </section>

        {/* Sistema */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <Monitor size={17} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">
              Sistema
            </span>
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
