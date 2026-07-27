import { useState } from "react";
import { TrendingUp, ShoppingBag, Receipt, Package } from "lucide-react";

type Filtro = "hoje" | "semana" | "mes";

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const statCards: StatCard[] = [
  {
    label: "Faturamento",
    value: "R$ 0,00",
    icon: <TrendingUp size={20} />,
    color: "text-[#3B9EFF]",
    bg: "bg-[#EBF5FF]",
  },
  {
    label: "Total de vendas",
    value: "0",
    icon: <Receipt size={20} />,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Ticket médio",
    value: "R$ 0,00",
    icon: <ShoppingBag size={20} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Produtos vendidos",
    value: "0",
    icon: <Package size={20} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export default function Relatorios() {
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
        <h1 className="text-xl font-semibold text-[#1E293B]">Relatórios</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Acompanhe o desempenho do seu negócio
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-fit">
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-[#E2E8F0]"
          >
            <div
              className={`flex items-center justify-center w-11 h-11 rounded-lg ${card.bg} ${card.color}`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">{card.label}</p>
              <p className="text-xl font-bold text-[#1E293B] mt-0.5">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
        <TrendingUp size={36} className="text-[#E2E8F0] mb-3" />
        <p className="text-sm text-[#64748B]">
          Gráficos disponíveis após registrar vendas
        </p>
      </div>
    </div>
  );
}
