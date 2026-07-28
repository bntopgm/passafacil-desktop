import { useState } from "react";
import { Search, ChevronRight, ChevronLeft, BookOpen, Mail } from "lucide-react";

interface Artigo {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: string;
}

const artigos: Artigo[] = [
  {
    id: "nova-venda",
    titulo: "Como realizar uma venda",
    descricao: "Passo a passo para registrar uma venda do início ao fim",
    conteudo: `**Como realizar uma venda**

1. Clique em **Vender** no menu lateral (ou pressione F2).
2. No campo de busca, digite o nome do produto, código de barras ou código interno.
3. Selecione o produto na lista que aparecer.
4. Ajuste a quantidade com os botões + e − se necessário.
5. Repita para adicionar mais produtos.
6. Clique em **Finalizar Venda** (ou pressione F12).
7. Selecione a forma de pagamento: Dinheiro, PIX ou Cartão.
8. Clique em **Confirmar**.

A venda é salva automaticamente no banco de dados local.`,
  },
  {
    id: "cadastrar-produto",
    titulo: "Cadastrar produtos",
    descricao: "Aprenda a adicionar e gerenciar seu catálogo de produtos",
    conteudo: `**Cadastrar produtos**

1. Clique em **Produtos** no menu lateral.
2. Clique no botão **Novo Produto** (canto superior direito).
3. Preencha os campos:
   - **Nome** (obrigatório)
   - **Preço de venda** (obrigatório)
   - Descrição, Código de barras, Código interno e Preço de custo são opcionais.
4. Clique em **Adicionar produto**.

Para **editar** um produto, clique no ícone de lápis na linha do produto.
Para **excluir**, clique no ícone de lixeira e confirme a exclusão.

O produto excluído não aparece mais nas vendas futuras, mas o histórico de vendas anteriores é preservado.`,
  },
  {
    id: "cancelar-venda",
    titulo: "Cancelar uma venda",
    descricao: "Como cancelar uma venda registrada por engano",
    conteudo: `**Cancelar uma venda**

Para cancelar uma venda que ainda está em andamento (carrinho):
- Clique em **Cancelar venda** no painel direito ou pressione F4.

Para cancelar uma venda já finalizada:
1. Vá para **Histórico** no menu lateral.
2. Encontre a venda que deseja cancelar.
3. Clique na venda para expandir os detalhes.
4. Clique em **Cancelar venda** e confirme.

A venda cancelada permanece no histórico com status "Cancelada", mas não é contabilizada nos relatórios.`,
  },
  {
    id: "relatorios",
    titulo: "Emitir relatórios",
    descricao: "Como gerar e interpretar os relatórios de desempenho",
    conteudo: `**Emitir relatórios**

1. Clique em **Relatórios** no menu lateral.
2. Selecione o período: **Hoje**, **7 dias** ou **30 dias**.
3. Os cards exibem automaticamente:
   - **Faturamento**: soma total das vendas concluídas.
   - **Total de vendas**: número de vendas realizadas.
   - **Ticket médio**: valor médio por venda.
   - **Itens vendidos**: quantidade total de itens.
4. Abaixo dos cards, veja os **produtos mais vendidos** com gráfico de barras.

Os dados são calculados em tempo real a partir do banco local.`,
  },
  {
    id: "historico",
    titulo: "Consultar histórico de vendas",
    descricao: "Como navegar pelo histórico e ver detalhes de uma venda",
    conteudo: `**Consultar histórico**

1. Clique em **Histórico** no menu lateral.
2. Filtre por período: **Hoje**, **7 dias** ou **30 dias**.
3. Cada linha mostra: número da venda, data/hora, quantidade de itens, forma de pagamento e total.
4. Clique em qualquer venda para expandir e ver os itens detalhados.

No topo da página você vê o resumo rápido: total de vendas, faturamento e ticket médio do período.`,
  },
  {
    id: "backup",
    titulo: "Fazer backup dos dados",
    descricao: "Como fazer backup e restaurar seus dados",
    conteudo: `**Fazer backup**

Seus dados ficam salvos localmente em:
\`C:\\Users\\[seu usuário]\\AppData\\Roaming\\PassaFacil\\passafacil.db\`

Para fazer backup completo, copie esse arquivo para um pendrive ou pasta de nuvem (Google Drive, OneDrive).

Para exportar seus produtos em planilha:
1. Vá em **Configurações** no menu lateral.
2. Na seção **Backup e exportação**, clique em **Exportar produtos como CSV**.
3. O arquivo será baixado automaticamente.

Para trocar de computador, copie o arquivo \`passafacil.db\` para o novo computador na mesma pasta.`,
  },
  {
    id: "atalhos",
    titulo: "Atalhos de teclado",
    descricao: "Lista completa dos atalhos para operar mais rápido",
    conteudo: `**Atalhos de teclado**

| Tecla | Ação |
|-------|------|
| F2    | Ir para Nova Venda |
| F4    | Cancelar venda em andamento |
| F12   | Finalizar venda |
| ESC   | Fechar / Voltar |
| Enter | Confirmar ação |
| Tab   | Próximo campo |

No campo de busca da tela de venda, pressionar Enter seleciona o primeiro resultado automaticamente.`,
  },
];

export default function Ajuda() {
  const [busca, setBusca] = useState("");
  const [artigoAberto, setArtigoAberto] = useState<Artigo | null>(null);

  const filtrados = artigos.filter(
    (a) =>
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  // Renderiza markdown simples (negrito, listas, código)
  function renderConteudo(texto: string) {
    return texto.split("\n").map((linha, i) => {
      if (linha.startsWith("**") && linha.endsWith("**") && linha.length > 4) {
        return <h3 key={i} className="text-base font-bold text-[#1E293B] mt-4 mb-2 first:mt-0">{linha.slice(2, -2)}</h3>;
      }
      if (linha.match(/^\d+\./)) {
        return <p key={i} className="text-sm text-[#1E293B] py-0.5 pl-2">{linha.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      }
      if (linha.startsWith("- ")) {
        return <p key={i} className="text-sm text-[#1E293B] py-0.5 pl-2">• {linha.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      }
      if (linha.startsWith("`") || linha.startsWith("\\`")) {
        return <code key={i} className="block text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded px-3 py-1.5 my-1 font-mono text-[#1E293B]">{linha.replace(/`/g, "")}</code>;
      }
      if (linha.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-[#1E293B] py-0.5">{linha.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
    });
  }

  if (artigoAberto) {
    return (
      <div className="h-full overflow-y-auto px-6 py-5">
        <button onClick={() => setArtigoAberto(null)} className="flex items-center gap-1.5 text-sm text-[#3B9EFF] hover:text-[#1A6BC4] mb-5 transition-colors">
          <ChevronLeft size={16} />Voltar para ajuda
        </button>
        <div className="max-w-2xl">
          <h1 className="text-xl font-bold text-[#1E293B] mb-1">{artigoAberto.titulo}</h1>
          <p className="text-sm text-[#64748B] mb-6">{artigoAberto.descricao}</p>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-1">
            {renderConteudo(artigoAberto.conteudo)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Ajuda</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Encontre respostas para suas dúvidas</p>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar artigos de ajuda..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/30 focus:border-[#3B9EFF] transition"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <Search size={28} className="text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#64748B]">Nenhum artigo encontrado para "{busca}"</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
          <div className="px-4 py-3 bg-[#F8FAFC]">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              {busca ? `${filtrados.length} resultado${filtrados.length !== 1 ? "s" : ""}` : "Artigos de ajuda"}
            </span>
          </div>
          {filtrados.map((artigo) => (
            <button
              key={artigo.id}
              onClick={() => setArtigoAberto(artigo)}
              className="flex items-center gap-4 w-full px-4 py-4 text-left hover:bg-[#F8FAFC] transition-colors group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#EBF5FF] shrink-0">
                <BookOpen size={16} className="text-[#3B9EFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B]">{artigo.titulo}</p>
                <p className="text-xs text-[#64748B] mt-0.5 truncate">{artigo.descricao}</p>
              </div>
              <ChevronRight size={16} className="text-[#64748B] group-hover:text-[#1E293B] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Botão de suporte */}
      <div className="mt-6 bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EBF5FF] shrink-0">
          <Mail size={18} className="text-[#3B9EFF]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1E293B]">Não encontrou o que precisava?</p>
          <p className="text-xs text-[#64748B] mt-0.5">Fale com o suporte por e-mail</p>
        </div>
        <a
          href="mailto:suporte@passafacil.com.br"
          className="px-4 py-2 text-sm font-medium text-[#3B9EFF] border border-[#3B9EFF] rounded-lg hover:bg-[#EBF5FF] transition-colors shrink-0"
        >
          Contato
        </a>
      </div>
    </div>
  );
}
