export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco_venda: number;
  preco_custo?: number;
  codigo_barras?: string;
  codigo_interno?: string;
  ativo: boolean;
}

export interface ItemVenda {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

export type FormaPagamento =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "outro";

export type StatusVenda = "aberta" | "finalizada" | "cancelada";

export interface Venda {
  id: number;
  itens: ItemVenda[];
  total: number;
  forma_pagamento: FormaPagamento;
  status: StatusVenda;
  criado_em: string;
}
