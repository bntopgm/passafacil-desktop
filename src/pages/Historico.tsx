import { useState } from "react";
import { Clock } from "lucide-react";

type Filtro = "hoje" | "semana" | "mes";

export default function Historico() {
  const [filtro, setFiltro] = useState<Filtro>("hoje");

  const tabs: { key: Filtro; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
  ];

  return (
    <div className="h-full overflow-y-auto px-6 py-5 scrollbar-thin">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Histórico</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Acompanhe todas as vendas realizadas
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltro(tab.key)}
            className={[
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              filtro === tab.key
                ? "bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]"
                : "text-[#64748B] hover:text-[#1E293B]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBF5FF] mb-4">
          <Clock size={28} className="text-[#3B9EFF]" />
        </div>
        <h3 className="text-base font-semibold text-[#1E293B] mb-1">
          Nenhuma venda encontrada
        </h3>
        <p className="text-sm text-[#64748B] text-center max-w-xs">
          As vendas realizadas aparecerão aqui. Vá para{" "}
          <span className="font-medium text-[#3B9EFF]">Vender</span> para
          registrar a primeira venda.
        </p>
      </div>
    </div>
  );
}
