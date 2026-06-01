import { useTranslation } from "react-i18next";

type Props = { view: "cards" | "table" | "map"; onChange: (v: "cards" | "table" | "map") => void };

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
const MapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

export default function ViewToggle({ view, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="toggle">
      <button className={view === "cards" ? "on" : ""} onClick={() => onChange("cards")}><CardsIcon /> {t("toggle.cards")}</button>
      <button className={view === "table" ? "on" : ""} onClick={() => onChange("table")}><TableIcon /> {t("toggle.table")}</button>
      <button className={view === "map" ? "on" : ""} onClick={() => onChange("map")}><MapIcon /> {t("toggle.map")}</button>
    </div>
  );
}
