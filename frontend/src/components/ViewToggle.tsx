type Props = { view: "cards" | "table"; onChange: (v: "cards" | "table") => void };

const CardsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const TableIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="toggle">
      <button className={view === "cards" ? "on" : ""} onClick={() => onChange("cards")}><CardsIcon /> Cards</button>
      <button className={view === "table" ? "on" : ""} onClick={() => onChange("table")}><TableIcon /> Table</button>
    </div>
  );
}
