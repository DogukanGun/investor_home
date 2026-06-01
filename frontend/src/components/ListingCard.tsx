import { useTranslation } from "react-i18next";
import type { Listing } from "../api/types";
import { area, pctSigned, portalLabel, ppm2, price } from "../lib/format";
import DealBadge from "./DealBadge";

/** Where does this listing sit on the cheap↔pricey spectrum?
 *  Left = cheap (< median), right = pricey (> median).
 *  Median sits at 50%. Clamped to [6, 94] so the dot stays visible. */
function spectrumPos(l: Listing): number {
  if (!l.price_per_m2 || !l.area_median_ppm2) return 50;
  return Math.max(6, Math.min(94, (l.price_per_m2 / (l.area_median_ppm2 * 2)) * 100));
}

export default function ListingCard({ listing: l, delay = 0 }: { listing: Listing; delay?: number }) {
  const { t } = useTranslation();
  const r = l.deal_rating;
  const pos = spectrumPos(l);

  return (
    <article className={`lcard reveal r-${r}`} style={{ animationDelay: `${delay}ms` }}>

      {/* ── Header: location + portal ── */}
      <header className="lc-head">
        <div className="lc-location">
          <div className="lc-city">{l.city}</div>
          {l.postal_code && <div className="lc-postal">{l.postal_code}</div>}
        </div>
        <span className="chip-portal">{portalLabel[l.portal] ?? l.portal}</span>
      </header>

      {/* ── Body: price left, undervaluation right ── */}
      <div className="lc-body">
        <div className="lc-price-col">
          <div className="lc-price mono">{price(l.price, l.currency)}</div>
          <div className="lc-ppm2 mono">{ppm2(l.price_per_m2)}</div>
        </div>
        <div className="lc-score-col">
          <div className={`lc-pct mono ${r}`}>{pctSigned(l.undervaluation)}</div>
          <div className="lc-pct-label">
            {l.undervaluation != null && l.undervaluation > 0
              ? t("card.belowAreaMedian")
              : t("card.vsAreaMedian")}
          </div>
        </div>
      </div>

      {/* ── Specs row ── */}
      <div className="lc-specs">
        {l.living_area_m2 != null && <b>{area(l.living_area_m2)}</b>}
        {l.rooms != null && <><span className="dot">·</span><span>{l.rooms} {t("card.rooms")}</span></>}
      </div>

      {/* ── Spectrum: position vs area median ── */}
      {l.area_median_ppm2 && (
        <div className="lc-spectrum">
          <div className="lc-track">
            <div className="lc-marker" style={{ left: `${pos}%` }} />
          </div>
          <div className="lc-spectrum-labels">
            <span>{t("card.cheap")}</span>
            <span className="lc-median-label">{t("card.median")} {ppm2(l.area_median_ppm2)}</span>
            <span>{t("card.pricey")}</span>
          </div>
        </div>
      )}

      {/* ── Footer: deal badge + view link ── */}
      <footer className="lc-foot">
        <DealBadge rating={r} />
        <a className="lc-view-btn" href={l.url} target="_blank" rel="noreferrer">
          {t("card.viewListing")}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      </footer>
    </article>
  );
}
