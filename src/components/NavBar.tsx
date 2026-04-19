import { NavLink } from "react-router-dom";
import { Rocket } from "lucide-react";

export default function NavBar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-[13px] px-3 py-1.5 rounded-md transition-colors ${
      isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
      <div className="max-w-[1100px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-primary" />
          <span className="text-[14px] font-medium text-[#111827]">Founders Toolkit</span>
        </div>
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls}>Fundraise math</NavLink>
          <NavLink to="/forecast" className={linkCls}>36-month forecast</NavLink>
          <NavLink to="/cashflow" className={linkCls}>Cashflow & runway</NavLink>
          <NavLink to="/pricing-playbook" className={linkCls}>Pricing playbook</NavLink>
        </div>
      </div>
    </nav>
  );
}
