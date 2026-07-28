import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Minus, X, ShoppingCart, Trash2, Check } from "lucide-react";
import type { ItemVenda, Produto } from "../types";
import { api, formatarMoeda, type ItemVendaInput } from "../lib/tauri";
import { listen } from "@tauri-apps/api/event";

type FormaPagamento = "dinheiro" | "pix" | "cartao";
type Etapa = "carrinho" | "pagamento" | "sucesso";

export default function Vender() {
  const [cartItems, setCartItems] = useState<ItemVenda[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Produto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("carrinho");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("dinheiro");
  const [salvando, setSalvando] = useState(false);
  const [ultimaVendaId, setUltimaVendaId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Focus no campo de busca ao abrir
  useEffect(() => {
    searchRef.current?.focus();
  }, [etapa]);

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12" && cartItems.length > 0 && etapa === "carrinho") {
        setEtapa("pagamento");
      }
      if (e.key === "F4" && etapa === "carrinho") {
        limparVenda();
      }
      if (e.key === "Escape") {
        if (etapa === "pagamento") setEtapa("carrinho");
        if (etapa === "sucesso") novaVenda();
        setShowResults(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cartItems, etapa]);

  // Integração com Scanner — recebe código de barras do celular
  useEffect(() => {
    const unsub = listen<{ code: string }>("barcode-received", async (e) => {
      if (etapa !== "carrinho") return;
      const code = e.payload.code;
      const results = await api.buscarProdutos(code).catch(() => [] as Produto[]);
      if (results.length === 1) {
        adicionarProduto(results[0]);
      } else {
        setSearchQuery(code);
      }
    });
    return () => { unsub.then((fn) => fn()); };
  }, [etapa]);

  // Busca com debounce
  const buscar = useCallback((query: string) => {
    clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const results = await api.buscarProdutos(query).catch(() => []);
      setSearchResults(results);
      setShowResults(results.length > 0);
    }, 150);
  }, []);

  useEffect(() => {
    buscar(searchQuery);
  }, [searchQuery, buscar]);

  function adicionarProduto(produto: Produto) {
    setCartItems((prev) => {
      const existente = prev.find((i) => i.produto.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1, subtotal: i.produto.preco_venda * (i.quantidade + 1) }
            : i
        );
      }
      return [...prev, { produto, quantidade: 1, subtotal: produto.preco_venda }];
    });
    setSearchQuery("");
    setShowResults(false);
    searchRef.current?.focus();
  }

  function updateQuantity(produtoId: number, delta: number) {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.produto.id !== produtoId) return item;
          const novaQtd = item.quantidade + delta;
          if (novaQtd <= 0) return null;
          return { ...item, quantidade: novaQtd, subtotal: item.produto.preco_venda * novaQtd };
        })
        .filter((item): item is ItemVenda => item !== null)
    );
  }

  function removeItem(produtoId: number) {
    setCartItems((prev) => prev.filter((i) => i.produto.id !== produtoId));
  }

  function limparVenda() {
    setCartItems([]);
    setSearchQuery("");
    setShowResults(false);
    setEtapa("carrinho");
    searchRef.current?.focus();
  }

  function novaVenda() {
    limparVenda();
    setUltimaVendaId(null);
  }

  async function finalizarVenda() {
    if (cartItems.length === 0) return;
    setSalvando(true);
    const itens: ItemVendaInput[] = cartItems.map((i) => ({
      produto_id: i.produto.id,
      nome_produto: i.produto.nome,
      quantidade: i.quantidade,
      preco_unitario: i.produto.preco_venda,
      subtotal: i.subtotal,
    }));
    const id = await api.criarVenda(itens, formaPagamento, total).catch(() => null);
    setSalvando(false);
    if (id !== null) {
      setUltimaVendaId(id);
      setEtapa("sucesso");
    }
  }

  const totalItens = cartItems.length;
  const totalQuantidade = cartItems.reduce((a, i) => a + i.quantidade, 0);
  const subtotal = cartItems.reduce((a, i) => a + i.subtotal, 0);
  const total = subtotal;

  // ── Tela de sucesso ──────────────────────────────────────────────────────────
  if (etapa === "sucesso") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
            <Check size={40} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Venda registrada!</h2>
            <p className="text-sm text-[#64748B] mt-1">Venda #{ultimaVendaId} concluída com sucesso.</p>
          </div>
          <p className="text-3xl font-bold text-[#3B9EFF]">{formatarMoeda(total)}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={novaVenda}
              className="flex-1 py-3 text-sm font-semibold text-white bg-[#3B9EFF] rounded-xl hover:bg-[#1A6BC4] transition-colors"
            >
              Nova venda  (ESC)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tela de pagamento ────────────────────────────────────────────────────────
  if (etapa === "pagamento") {
    const opcoes: { key: FormaPagamento; label: string; emoji: string }[] = [
      { key: "dinheiro", label: "Dinheiro", emoji: "💵" },
      { key: "pix", label: "PIX", emoji: "📱" },
      { key: "cartao", label: "Cartão", emoji: "💳" },
    ];
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-6 w-full max-w-md px-6">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Forma de pagamento</h2>
            <p className="text-sm text-[#64748B] mt-1">Total: <span className="font-bold text-[#3B9EFF]">{formatarMoeda(total)}</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {opcoes.map((op) => (
              <button
                key={op.key}
                onClick={() => setFormaPagamento(op.key)}
                className={[
                  "flex flex-col items-center gap-2 py-6 rounded-xl border-2 transition-all text-sm font-semibold",
                  formaPagamento === op.key
                    ? "border-[#3B9EFF] bg-[#EBF5FF] text-[#3B9EFF]"
                    : "border-[#E2E8F0] bg-white text-[#1E293B] hover:border-[#3B9EFF]",
                ].join(" ")}
              >
                <span className="text-2xl">{op.emoji}</span>
                {op.label}
              </button>
            ))}
          </div>
          <button
            onClick={finalizarVenda}
            disabled={salvando}
            className="flex items-center justify-center gap-2 w-full py-4 text-sm font-bold text-white bg-[#3B9EFF] rounded-xl hover:bg-[#1A6BC4] transition-colors disabled:opacity-60"
          >
            <ShoppingCart size={18} />
            {salvando ? "Salvando..." : `Confirmar  •  ${formatarMoeda(total)}`}
          </button>
          <button onClick={() => setEtapa("carrinho")} className="text-sm text-[#64748B] hover:text-[#1E293B] text-center transition-colors">
            ← Voltar ao carrinho  (ESC)
          </button>
        </div>
      </div>
    );
  }

  // ── Tela principal ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-[#1E293B]">Nova Venda</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Adicione produtos à venda e Finalize</p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="Digite o código de barras ou nome do produto"
              className="w-full pl-11 pr-4 py-3.5 text-sm bg-white border-2 border-[#3B9EFF] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/20 shadow-sm"
            />
            {/* Dropdown de resultados */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-10 overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => adicionarProduto(p)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{p.nome}</p>
                      {p.codigo_barras && <p className="text-xs text-[#94A3B8]">{p.codigo_barras}</p>}
                    </div>
                    <span className="text-sm font-semibold text-[#3B9EFF]">{formatarMoeda(p.preco_venda)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <span className="text-sm font-medium text-[#1E293B]">Produtos na venda</span>
              {cartItems.length > 0 && (
                <button onClick={limparVenda} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors">
                  <Trash2 size={13} />
                  Limpar venda
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-[#64748B]">
                <ShoppingCart size={36} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhum produto adicionado</p>
                <p className="text-xs mt-1 opacity-70">Use o campo acima para buscar produtos</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {cartItems.map((item) => (
                  <div key={item.produto.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EBF5FF] shrink-0">
                      <ShoppingCart size={16} className="text-[#3B9EFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{item.produto.nome}</p>
                      {item.produto.descricao && (
                        <p className="text-xs text-[#64748B] truncate">{item.produto.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden shrink-0">
                      <button onClick={() => updateQuantity(item.produto.id, -1)} className="flex items-center justify-center w-8 h-8 text-[#64748B] hover:bg-slate-100 transition-colors">
                        <Minus size={13} />
                      </button>
                      <span className="flex items-center justify-center w-8 h-8 text-sm font-medium text-[#1E293B] border-x border-[#E2E8F0] select-none">
                        {item.quantidade}
                      </span>
                      <button onClick={() => updateQuantity(item.produto.id, 1)} className="flex items-center justify-center w-8 h-8 text-[#64748B] hover:bg-slate-100 transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <p className="text-xs text-[#64748B]">Unitário</p>
                      <p className="text-sm text-[#1E293B]">{formatarMoeda(item.produto.preco_venda)}</p>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <p className="text-xs text-[#64748B]">Subtotal</p>
                      <p className="text-sm font-semibold text-[#1E293B]">{formatarMoeda(item.subtotal)}</p>
                    </div>
                    <button onClick={() => removeItem(item.produto.id)} className="flex items-center justify-center w-7 h-7 rounded-md text-[#64748B] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex-1" />
              <button
                disabled={cartItems.length === 0}
                onClick={() => setEtapa("pagamento")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={13} />Finalizar venda  F12
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 shrink-0 flex flex-col bg-white border-l border-[#E2E8F0]">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">Resumo da venda</h2>
        </div>
        <div className="flex gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg py-2.5 border border-[#E2E8F0]">
            <span className="text-lg font-bold text-[#1E293B]">{totalItens}</span>
            <span className="text-xs text-[#64748B] mt-0.5">Itens</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg py-2.5 border border-[#E2E8F0]">
            <span className="text-lg font-bold text-[#1E293B]">{totalQuantidade}</span>
            <span className="text-xs text-[#64748B] mt-0.5">Qtd. total</span>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Subtotal</span>
            <span className="text-sm font-medium text-[#1E293B]">{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Acréscimos</span>
            <span className="text-sm font-medium text-[#1E293B]">{formatarMoeda(0)}</span>
          </div>
        </div>
        <div className="px-5 py-5 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-[#1E293B]">Total</span>
            <span className="text-2xl font-bold text-[#3B9EFF]">{formatarMoeda(total)}</span>
          </div>
        </div>
        <div className="px-5 py-5 space-y-3 mt-auto">
          <button
            disabled={cartItems.length === 0}
            onClick={() => setEtapa("pagamento")}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-[#3B9EFF] rounded-xl hover:bg-[#1A6BC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            Finalizar Venda
          </button>
          <button
            disabled={cartItems.length === 0}
            onClick={limparVenda}
            className="w-full text-center text-sm text-red-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cancelar venda
          </button>
        </div>
      </aside>
    </div>
  );
}
