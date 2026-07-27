import { Search, ShieldCheck } from "lucide-react";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E2E8F0] shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
        />
        <input
          type="text"
          placeholder="Buscar produtos, vendas, clientes..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF] focus:border-transparent transition"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-4">
        {/* Store badge */}
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-[#64748B] border border-[#E2E8F0]">
          🏠 Lar A
        </span>

        {/* License badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <ShieldCheck size={13} />
          Licença ativa
        </span>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B9EFF] text-white text-xs font-semibold select-none">
            JD
          </div>
          <span className="text-sm font-medium text-[#1E293B]">
            João da Silva
          </span>
        </div>
      </div>
    </header>
  );
}
