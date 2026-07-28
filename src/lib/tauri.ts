import { invoke } from "@tauri-apps/api/core";
import type { Produto, VendaResumo, VendaCompleta, RelatorioStats, ProdutoMaisVendido } from "../types";

export type Filtro = "hoje" | "semana" | "mes";

export interface NovoProduto {
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  codigo_interno?: string;
  preco_venda: number;
  preco_custo?: number;
}

export interface ItemVendaInput {
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export const api = {
  // Produtos
  listarProdutos: () => invoke<Produto[]>("listar_produtos"),
  buscarProdutos: (query: string) => invoke<Produto[]>("buscar_produtos", { query }),
  criarProduto: (produto: NovoProduto) => invoke<Produto>("criar_produto", { produto }),
  atualizarProduto: (id: number, produto: NovoProduto) => invoke<Produto>("atualizar_produto", { id, produto }),
  excluirProduto: (id: number) => invoke<void>("excluir_produto", { id }),

  // Vendas
  criarVenda: (itens: ItemVendaInput[], formaPagamento: string, total: number) =>
    invoke<number>("criar_venda", { itens, formaPagamento: forma_pagamento_map(formaPagamento), total }),
  listarVendas: (filtro: Filtro) => invoke<VendaResumo[]>("listar_vendas", { filtro }),
  obterVenda: (id: number) => invoke<VendaCompleta>("obter_venda", { id }),
  cancelarVenda: (id: number) => invoke<void>("cancelar_venda", { id }),

  // Relatórios
  obterRelatorio: (filtro: Filtro) => invoke<RelatorioStats>("obter_relatorio", { filtro }),
  produtosMaisVendidos: (filtro: Filtro) => invoke<ProdutoMaisVendido[]>("produtos_mais_vendidos", { filtro }),

  // Configurações
  obterConfig: (chave: string) => invoke<string>("obter_config", { chave }),
  salvarConfig: (chave: string, valor: string) => invoke<void>("salvar_config", { chave, valor }),
  exportarCsv: () => invoke<string>("exportar_csv"),
};

function forma_pagamento_map(f: string): string {
  const map: Record<string, string> = {
    dinheiro: "dinheiro",
    pix: "pix",
    cartao: "cartao",
    cartao_credito: "cartao",
    cartao_debito: "cartao",
  };
  return map[f] ?? f;
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string): string {
  const d = new Date(iso.replace(" ", "T"));
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
