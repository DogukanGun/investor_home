import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

type IconProps = { d: string };
const Icon = ({ d }: IconProps) => (
  <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const LANGS = [
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "fr", flag: "🇫🇷" },
  { code: "tr", flag: "🇹🇷" },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();

  const NAV = [
    { to: "/overview", label: t("nav.overview"), d: "M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z" },
    { to: "/browse", label: t("nav.browse"), d: "M3 5h18M3 12h18M3 19h18" },
    { to: "/areas", label: t("nav.areas"), d: "M3 17l6-6 4 4 8-8M21 7v6h-6" },
    { to: "/analysis", label: t("nav.analysis"), d: "M18 20V10M12 20V4M6 20v-6" },
    { to: "/searches", label: t("nav.searches"), d: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" },
  ];

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">IH</div>
        <div>
          <div className="brand-name">InvestorHome</div>
          <div className="brand-sub">{t("sidebar.sub")}</div>
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

      <div className="lang-switcher">
        {LANGS.map((l) => (
          <button
            key={l.code}
            className={`lang-btn${i18n.language === l.code ? " on" : ""}`}
            onClick={() => changeLang(l.code)}
            title={t(`lang.${l.code}`)}
          >
            {l.flag} {t(`lang.${l.code}`)}
          </button>
        ))}
      </div>

      <div className="sidebar-foot">{t("sidebar.foot")}</div>
    </aside>
  );
}
