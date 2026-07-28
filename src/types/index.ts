export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
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

export interface ItemVendaRow {
  id: number;
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface VendaResumo {
  id: number;
  total: number;
  forma_pagamento: string;
  status: string;
  criado_em: string;
  qtd_itens: number;
}

export interface VendaCompleta {
  id: number;
  total: number;
  forma_pagamento: string;
  status: string;
  criado_em: string;
  itens: ItemVendaRow[];
}

export interface RelatorioStats {
  faturamento: number;
  total_vendas: number;
  ticket_medio: number;
  total_itens_vendidos: number;
}

export interface ProdutoMaisVendido {
  nome: string;
  quantidade: number;
  receita: number;
}
