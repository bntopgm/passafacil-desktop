import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Tag,
  User,
  Trash2,
} from "lucide-react";
import type { ItemVenda, Produto } from "../types";

const mockProdutos: Produto[] = [
  {
    id: 1,
    nome: "Detergente Ypê 500ml",
    descricao: "Detergente líquido neutro",
    preco_venda: 12.99,
    ativo: true,
    codigo_barras: "7896098900011",
  },
  {
    id: 2,
    nome: "Papel Higiênico Neve 12un",
    descricao: "Folha dupla, pacote com 12 rolos",
    preco_venda: 8.9,
    ativo: true,
    codigo_barras: "7896004001234",
  },
  {
    id: 3,
    nome: "Leite Pilar 930g",
    descricao: "Leite integral longa vida",
    preco_venda: 6.9,
    ativo: true,
    codigo_barras: "7898215151515",
  },
];

const initialCartItems: ItemVenda[] = mockProdutos.map((produto) => ({
  produto,
  quantidade: produto.id === 1 ? 2 : 1,
  subtotal: produto.id === 1 ? produto.preco_venda * 2 : produto.preco_venda,
}));

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Vender() {
  const [cartItems, setCartItems] = useState<ItemVenda[]>(initialCartItems);
  const [searchQuery, setSearchQuery] = useState("");

  function updateQuantity(produtoId: number, delta: number) {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.produto.id !== produtoId) return item;
          const novaQtd = item.quantidade + delta;
          if (novaQtd <= 0) return null;
          return {
            ...item,
            quantidade: novaQtd,
            subtotal: item.produto.preco_venda * novaQtd,
          };
        })
        .filter((item): item is ItemVenda => item !== null)
    );
  }

  function removeItem(produtoId: number) {
    setCartItems((prev) =>
      prev.filter((item) => item.produto.id !== produtoId)
    );
  }

  function limparVenda() {
    setCartItems([]);
  }

  const totalItens = cartItems.length;
  const totalQuantidade = cartItems.reduce(
    (acc, item) => acc + item.quantidade,
    0
  );
  const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const acrescimos = 0;
  const total = subtotal + acrescimos;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-[#1E293B]">Nova Venda</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Adicione produtos à venda e Finalize
            </p>
          </div>

          {/* Product search */}
          <div className="relative mb-5">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o código de barras ou nome do produto"
              className="w-full pl-11 pr-4 py-3.5 text-sm bg-white border-2 border-[#3B9EFF] rounded-xl text-[#1E293B] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 transition shadow-sm"
            />
          </div>

          {/* Cart items section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <span className="text-sm font-medium text-[#1E293B]">
                Produtos na venda
              </span>
              {cartItems.length > 0 && (
                <button
                  onClick={limparVenda}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                  Limpar venda
                </button>
              )}
            </div>

            {/* Items */}
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-[#64748B]">
                <ShoppingCart size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum produto adicionado</p>
                <p className="text-xs mt-1 opacity-70">
                  Use o campo acima para buscar produtos
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {cartItems.map((item) => (
                  <div
                    key={item.produto.id}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors group"
                  >
                    {/* Product icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EBF5FF] shrink-0">
                      <ShoppingCart size={16} className="text-[#3B9EFF]" />
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">
                        {item.produto.nome}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">
                        {item.produto.descricao}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-0 border border-[#E2E8F0] rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(item.produto.id, -1)}
                        className="flex items-center justify-center w-8 h-8 text-[#64748B] hover:bg-slate-100 transition-colors"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="flex items-center justify-center w-8 h-8 text-sm font-medium text-[#1E293B] border-x border-[#E2E8F0] select-none">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.produto.id, 1)}
                        className="flex items-center justify-center w-8 h-8 text-[#64748B] hover:bg-slate-100 transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Unit price */}
                    <div className="text-right shrink-0 w-24">
                      <p className="text-xs text-[#64748B]">Unitário</p>
                      <p className="text-sm text-[#1E293B]">
                        {formatarMoeda(item.produto.preco_venda)}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0 w-24">
                      <p className="text-xs text-[#64748B]">Subtotal</p>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {formatarMoeda(item.subtotal)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.produto.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-[#64748B] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                      aria-label="Remover item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom action bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors">
                <Plus size={13} />
                Adicionar produto
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors">
                <Tag size={13} />
                Descontos
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors">
                <User size={13} />
                Clientes
              </button>
              <div className="flex-1" />
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
                <ShoppingCart size={13} />
                Finalizar venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Sale summary */}
      <aside className="w-80 shrink-0 flex flex-col bg-white border-l border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">
            Resumo da venda
          </h2>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg py-2.5 border border-[#E2E8F0]">
            <span className="text-lg font-bold text-[#1E293B]">
              {totalItens}
            </span>
            <span className="text-xs text-[#64748B] mt-0.5">Itens</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg py-2.5 border border-[#E2E8F0]">
            <span className="text-lg font-bold text-[#1E293B]">
              {totalQuantidade}
            </span>
            <span className="text-xs text-[#64748B] mt-0.5">
              Qtd. total
            </span>
          </div>
        </div>

        {/* Subtotal and acréscimos */}
        <div className="px-5 py-4 space-y-3 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Subtotal</span>
            <span className="text-sm font-medium text-[#1E293B]">
              {formatarMoeda(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Acréscimos</span>
            <span className="text-sm font-medium text-[#1E293B]">
              {formatarMoeda(acrescimos)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="px-5 py-5 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-[#1E293B]">
              Total
            </span>
            <span className="text-2xl font-bold text-[#3B9EFF]">
              {formatarMoeda(total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-5 space-y-3 mt-auto">
          <button
            disabled={cartItems.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-[#3B9EFF] rounded-xl hover:bg-[#1A6BC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
