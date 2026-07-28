import { useEffect, useState } from "react";
import { Search, ShieldCheck, Store } from "lucide-react";
import { api } from "../../lib/tauri";

export default function TopBar() {
  const [nomeLoja, setNomeLoja] = useState("Minha loja");

  useEffect(() => {
    api.obterConfig("nome_empresa").then((v) => { if (v) setNomeLoja(v); }).catch(() => {});
  }, []);

  return (
    <header className="flex items-center gap-4 h-16 px-6 bg-white border-b border-[#E2E8F0] shrink-0">
      {/* Search — ocupa todo o espaço disponível */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Buscar produtos, vendas..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Store name */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-[#64748B] border border-[#E2E8F0]">
          <Store size={13} />
          {nomeLoja}
        </span>

        {/* License badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <ShieldCheck size={13} />
          Licença ativa
        </span>
      </div>
    </header>
  );
}
