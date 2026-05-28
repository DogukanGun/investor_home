import { NavLink } from "react-router-dom";

type IconProps = { d: string };
const Icon = ({ d }: IconProps) => (
  <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { to: "/overview", label: "Overview", d: "M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z" },
  { to: "/browse", label: "Browse deals", d: "M3 5h18M3 12h18M3 19h18" },
  { to: "/areas", label: "Areas & index", d: "M3 17l6-6 4 4 8-8M21 7v6h-6" },
  { to: "/searches", label: "Searches", d: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">IH</div>
        <div>
          <div className="brand-name">InvestorHome</div>
          <div className="brand-sub">Property terminal</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Navigate</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}>
            <Icon d={n.d} />
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        Buy-to-let analytics across ImmoScout24, Immowelt &amp; Sparkasse.
        Deals ranked by €/m² vs local median.
      </div>
    </aside>
  );
}
