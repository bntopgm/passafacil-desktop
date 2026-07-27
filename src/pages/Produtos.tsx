import { Package, Plus } from "lucide-react";

export default function Produtos() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1E293B]">Produtos</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Gerencie o catálogo de produtos do seu negócio
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
          <Plus size={15} />
          Novo Produto
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBF5FF] mb-4">
          <Package size={28} className="text-[#3B9EFF]" />
        </div>
        <h3 className="text-base font-semibold text-[#1E293B] mb-1">
          Nenhum produto cadastrado
        </h3>
        <p className="text-sm text-[#64748B] text-center max-w-xs">
          Adicione seus produtos para começar a realizar vendas rapidamente.
        </p>
        <button className="flex items-center gap-2 mt-5 px-4 py-2.5 text-sm font-semibold text-white bg-[#3B9EFF] rounded-lg hover:bg-[#1A6BC4] transition-colors">
          <Plus size={15} />
          Adicionar primeiro produto
        </button>
      </div>
    </div>
  );
}
