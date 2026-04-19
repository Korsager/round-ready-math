import { NavLink } from "react-router-dom";
import { Rocket } from "lucide-react";

export default function NavBar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-[12px] sm:text-[13px] px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
      isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Rocket size={18} className="text-primary" />
          <span className="hidden sm:inline text-[14px] font-medium text-[#111827]">Founders Toolkit</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 flex-1 justify-end">
          <NavLink to="/" end className={linkCls}>Fundraise</NavLink>
          <NavLink to="/forecast" className={linkCls}>Forecast</NavLink>
          <NavLink to="/cashflow" className={linkCls}>Cashflow</NavLink>
          <NavLink to="/pricing-playbook" className={linkCls}>Pricing</NavLink>
        </div>
      </div>
    </nav>
  );
}
