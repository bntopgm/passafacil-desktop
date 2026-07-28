import { NavLink } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Clock,
  BarChart2,
  HelpCircle,
  Settings,
  ScanLine,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    to: "/",
    icon: <ShoppingCart size={18} />,
    label: "Vender",
    end: true,
  },
  {
    to: "/produtos",
    icon: <Package size={18} />,
    label: "Produtos",
  },
  {
    to: "/historico",
    icon: <Clock size={18} />,
    label: "Histórico",
  },
  {
    to: "/scanner",
    icon: <ScanLine size={18} />,
    label: "Scanner",
  },
  {
    to: "/relatorios",
    icon: <BarChart2 size={18} />,
    label: "Relatórios",
  },
  {
    to: "/ajuda",
    icon: <HelpCircle size={18} />,
    label: "Ajuda",
  },
  {
    to: "/configuracoes",
    icon: <Settings size={18} />,
    label: "Configurações",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#F8FAFC] border-r border-[#E2E8F0] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-center w-8 h-8 bg-[#3B9EFF] rounded-lg">
          <ShoppingCart size={16} className="text-white" />
        </div>
        <span className="font-semibold text-[#1E293B] text-sm leading-tight">
          Passa Fácil
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-[#EBF5FF] text-[#3B9EFF] border-l-2 border-[#3B9EFF] pl-[10px]"
                  : "text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]",
              ].join(" ")
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom plan badge */}
      <div className="px-5 py-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            ★ Profissional
          </span>
        </div>
      </div>
    </aside>
  );
}
