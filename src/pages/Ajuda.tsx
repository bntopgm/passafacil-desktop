import { Search, ChevronRight, BookOpen } from "lucide-react";

interface ArtigoAjuda {
  titulo: string;
  descricao: string;
}

const artigos: ArtigoAjuda[] = [
  {
    titulo: "Como realizar uma venda",
    descricao: "Passo a passo para finalizar uma venda com sucesso",
  },
  {
    titulo: "Cadastrar produtos",
    descricao: "Aprenda a adicionar e gerenciar seu catálogo de produtos",
  },
  {
    titulo: "Formas de pagamento",
    descricao: "Configure e aceite diferentes formas de pagamento",
  },
  {
    titulo: "Emitir relatórios",
    descricao: "Como gerar e interpretar os relatórios de desempenho",
  },
  {
    titulo: "Configurar impressora",
    descricao: "Conecte sua impressora térmica e imprima cupons fiscais",
  },
];

export default function Ajuda() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 scrollbar-thin">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Ajuda</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Encontre respostas para suas dúvidas
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
        />
        <input
          type="text"
          placeholder="Buscar artigos de ajuda..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF] focus:border-transparent transition"
        />
      </div>

      {/* Articles */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
        <div className="px-4 py-3 bg-[#F8FAFC]">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Artigos populares
          </span>
        </div>
        {artigos.map((artigo) => (
          <button
            key={artigo.titulo}
            className="flex items-center gap-4 w-full px-4 py-4 text-left hover:bg-[#F8FAFC] transition-colors group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#EBF5FF] shrink-0">
              <BookOpen size={16} className="text-[#3B9EFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B]">
                {artigo.titulo}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 truncate">
                {artigo.descricao}
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-[#64748B] group-hover:text-[#1E293B] transition-colors shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
