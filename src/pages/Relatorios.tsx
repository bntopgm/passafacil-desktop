import { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, Receipt, Package } from "lucide-react";
import type { RelatorioStats, ProdutoMaisVendido } from "../types";
import { api, formatarMoeda, type Filtro } from "../lib/tauri";

export default function Relatorios() {
  const [filtro, setFiltro] = useState<Filtro>("hoje");
  const [stats, setStats] = useState<RelatorioStats | null>(null);
  const [top, setTop] = useState<ProdutoMaisVendido[]>([]);

  const tabs: { key: Filtro; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "7 dias" },
    { key: "mes", label: "30 dias" },
  ];

  async function carregar() {
    const [s, t] = await Promise.all([
      api.obterRelatorio(filtro).catch(() => null),
      api.produtosMaisVendidos(filtro).catch(() => []),
    ]);
    setStats(s);
    setTop(t);
  }

  useEffect(() => { carregar(); }, [filtro]);

  const cards = [
    { label: "Faturamento", value: formatarMoeda(stats?.faturamento ?? 0), icon: <TrendingUp size={20} />, color: "text-[#3B9EFF]", bg: "bg-[#EBF5FF]" },
    { label: "Total de vendas", value: String(stats?.total_vendas ?? 0), icon: <Receipt size={20} />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Ticket médio", value: formatarMoeda(stats?.ticket_medio ?? 0), icon: <ShoppingBag size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Itens vendidos", value: String(Math.round(stats?.total_itens_vendidos ?? 0)), icon: <Package size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const maxQtd = top.length > 0 ? top[0].quantidade : 1;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Relatórios</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Acompanhe o desempenho do seu negócio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltro(tab.key)}
            className={["px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              filtro === tab.key ? "bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]" : "text-[#64748B] hover:text-[#1E293B]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-[#E2E8F0]">
            <div className={`flex items-center justify-center w-11 h-11 rounded-lg ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">{card.label}</p>
              <p className="text-xl font-bold text-[#1E293B] mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Produtos mais vendidos */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-sm font-semibold text-[#1E293B]">Produtos mais vendidos</span>
        </div>
        {top.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#64748B]">
            <TrendingUp size={32} className="text-[#E2E8F0] mb-3" />
            <p className="text-sm">Nenhuma venda no período selecionado</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {top.map((p, i) => (
              <div key={p.nome} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xs font-bold text-[#94A3B8] w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{p.nome}</p>
                  <div className="mt-1.5 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B9EFF] rounded-full transition-all"
                      style={{ width: `${(p.quantidade / maxQtd) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#64748B]">{p.quantidade} un.</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{formatarMoeda(p.receita)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
