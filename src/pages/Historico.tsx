import { useState, useEffect } from "react";
import { Clock, ChevronDown, ChevronUp, Ban } from "lucide-react";
import type { VendaResumo, VendaCompleta } from "../types";
import { api, formatarMoeda, formatarData, type Filtro } from "../lib/tauri";

const formaLabel: Record<string, string> = {
  dinheiro: "💵 Dinheiro",
  pix: "📱 PIX",
  cartao: "💳 Cartão",
};

export default function Historico() {
  const [filtro, setFiltro] = useState<Filtro>("hoje");
  const [vendas, setVendas] = useState<VendaResumo[]>([]);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<VendaCompleta | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const tabs: { key: Filtro; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "7 dias" },
    { key: "mes", label: "30 dias" },
  ];

  async function carregar() {
    const lista = await api.listarVendas(filtro).catch(() => []);
    setVendas(lista);
    setExpandida(null);
    setDetalhe(null);
  }

  useEffect(() => { carregar(); }, [filtro]);

  async function expandir(id: number) {
    if (expandida === id) {
      setExpandida(null);
      setDetalhe(null);
      return;
    }
    const v = await api.obterVenda(id).catch(() => null);
    setDetalhe(v);
    setExpandida(id);
  }

  async function cancelar(id: number) {
    await api.cancelarVenda(id).catch(() => null);
    setConfirmCancel(null);
    carregar();
  }

  const concluidas = vendas.filter((v) => v.status === "concluida");
  const totalFaturado = concluidas.reduce((a, v) => a + v.total, 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Histórico</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Acompanhe todas as vendas realizadas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-fit">
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

      {/* Resumo rápido */}
      {vendas.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
            <p className="text-xs text-[#64748B]">Total de vendas</p>
            <p className="text-lg font-bold text-[#1E293B] mt-0.5">{concluidas.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
            <p className="text-xs text-[#64748B]">Faturamento</p>
            <p className="text-lg font-bold text-[#3B9EFF] mt-0.5">{formatarMoeda(totalFaturado)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
            <p className="text-xs text-[#64748B]">Ticket médio</p>
            <p className="text-lg font-bold text-[#1E293B] mt-0.5">
              {concluidas.length > 0 ? formatarMoeda(totalFaturado / concluidas.length) : formatarMoeda(0)}
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {vendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBF5FF] mb-4">
            <Clock size={28} className="text-[#3B9EFF]" />
          </div>
          <h3 className="text-base font-semibold text-[#1E293B] mb-1">Nenhuma venda encontrada</h3>
          <p className="text-sm text-[#64748B] text-center max-w-xs">
            As vendas realizadas neste período aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {vendas.map((v) => (
              <div key={v.id} className={v.status === "cancelada" ? "opacity-50" : ""}>
                <button
                  onClick={() => expandir(v.id)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 text-left hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E293B]">Venda #{v.id}</span>
                      {v.status === "cancelada" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Cancelada</span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {formatarData(v.criado_em)} · {v.qtd_itens} item{v.qtd_itens !== 1 ? "s" : ""} · {formaLabel[v.forma_pagamento] ?? v.forma_pagamento}
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#1E293B] shrink-0">{formatarMoeda(v.total)}</span>
                  {expandida === v.id ? <ChevronUp size={16} className="text-[#64748B] shrink-0" /> : <ChevronDown size={16} className="text-[#64748B] shrink-0" />}
                </button>

                {/* Detalhe expandido */}
                {expandida === v.id && detalhe && (
                  <div className="px-4 pb-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                    <div className="mt-3 space-y-2">
                      {detalhe.itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-[#1E293B]">
                            {item.nome_produto}
                            <span className="text-[#64748B]"> × {item.quantidade}</span>
                          </span>
                          <span className="font-medium text-[#1E293B]">{formatarMoeda(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    {v.status === "concluida" && (
                      <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                        {confirmCancel === v.id ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#64748B]">Cancelar esta venda?</span>
                            <button onClick={() => cancelar(v.id)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Confirmar</button>
                            <button onClick={() => setConfirmCancel(null)} className="text-xs text-[#64748B] hover:text-[#1E293B] transition-colors">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmCancel(v.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors">
                            <Ban size={12} />Cancelar venda
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
