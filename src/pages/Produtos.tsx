import { useState, useEffect } from "react";
import { Package, Plus, Search, Edit2, Trash2, X, Check } from "lucide-react";
import type { Produto } from "../types";
import { api, formatarMoeda, type NovoProduto } from "../lib/tauri";

const empty: NovoProduto = { nome: "", descricao: "", codigo_barras: "", codigo_interno: "", preco_venda: 0, preco_custo: undefined };

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<NovoProduto>(empty);
  const [salvando, setSalvando] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState<number | null>(null);

  async function carregar() {
    const lista = await api.listarProdutos().catch(() => []);
    setProdutos(lista);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(empty);
    setModalAberto(true);
  }

  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      codigo_barras: p.codigo_barras ?? "",
      codigo_interno: p.codigo_interno ?? "",
      preco_venda: p.preco_venda,
      preco_custo: p.preco_custo,
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.nome.trim() || form.preco_venda <= 0) return;
    setSalvando(true);
    const payload: NovoProduto = {
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || undefined,
      codigo_barras: form.codigo_barras?.trim() || undefined,
      codigo_interno: form.codigo_interno?.trim() || undefined,
      preco_venda: Number(form.preco_venda),
      preco_custo: form.preco_custo ? Number(form.preco_custo) : undefined,
    };
    if (editando) {
      await api.atualizarProduto(editando.id, payload).catch(() => null);
    } else {
      await api.criarProduto(payload).catch(() => null);
    }
    setSalvando(false);
    setModalAberto(false);
    carregar();
  }

  async function excluir(id: number) {
    await api.excluirProduto(id).catch(() => null);
    setConfirmExcluir(null);
    carregar();
  }

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigo_barras ?? "").includes(busca) ||
    (p.codigo_interno ?? "").includes(busca)
  );

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1E293B]">Produtos</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{produtos.length} produto{produtos.length !== 1 ? "s" : ""} cadastrado{produtos.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
          <Plus size={15} />Novo Produto
        </button>
      </div>

      {/* Busca */}
      {produtos.length > 0 && (
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código de barras ou código interno..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
          />
        </div>
      )}

      {/* Lista */}
      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBF5FF] mb-4">
            <Package size={28} className="text-[#3B9EFF]" />
          </div>
          <h3 className="text-base font-semibold text-[#1E293B] mb-1">Nenhum produto cadastrado</h3>
          <p className="text-sm text-[#64748B] text-center max-w-xs">Adicione seus produtos para começar a realizar vendas.</p>
          <button onClick={abrirNovo} className="flex items-center gap-2 mt-5 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
            <Plus size={15} />Adicionar primeiro produto
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <Search size={28} className="text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#64748B]">Nenhum produto encontrado para "{busca}"</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <span>Produto</span>
            <span className="w-28 text-right">Preço venda</span>
            <span className="w-28 text-right">Preço custo</span>
            <span className="w-20 text-right">Ações</span>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {filtrados.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{p.nome}</p>
                  <div className="flex gap-2 mt-0.5">
                    {p.codigo_barras && <span className="text-xs text-[#94A3B8]">CB: {p.codigo_barras}</span>}
                    {p.codigo_interno && <span className="text-xs text-[#94A3B8]">CI: {p.codigo_interno}</span>}
                    {p.descricao && <span className="text-xs text-[#94A3B8] truncate">{p.descricao}</span>}
                  </div>
                </div>
                <span className="w-28 text-right text-sm font-semibold text-[#1E293B]">{formatarMoeda(p.preco_venda)}</span>
                <span className="w-28 text-right text-sm text-[#64748B]">
                  {p.preco_custo ? formatarMoeda(p.preco_custo) : "—"}
                </span>
                <div className="w-20 flex items-center justify-end gap-1">
                  <button onClick={() => abrirEditar(p)} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:bg-[#EBF5FF] hover:text-[#3B9EFF] transition-colors">
                    <Edit2 size={14} />
                  </button>
                  {confirmExcluir === p.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => excluir(p.id)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setConfirmExcluir(null)} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmExcluir(p.id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#1E293B]">{editando ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setModalAberto(false)} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Nome do produto *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Arroz Tio João 5kg"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={form.descricao ?? ""}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Preço de venda (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco_venda || ""}
                    onChange={(e) => setForm({ ...form, preco_venda: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Preço de custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco_custo ?? ""}
                    onChange={(e) => setForm({ ...form, preco_custo: parseFloat(e.target.value) || undefined })}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Código de barras</label>
                  <input
                    type="text"
                    value={form.codigo_barras ?? ""}
                    onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                    placeholder="EAN-13"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Código interno</label>
                  <input
                    type="text"
                    value={form.codigo_interno ?? ""}
                    onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    placeholder="Ex: 0001"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0]">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 text-sm font-medium text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || form.preco_venda <= 0}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
