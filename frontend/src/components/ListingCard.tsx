import type { Listing } from "../api/types";
import { area, euro, pctSigned, portalLabel, ppm2 } from "../lib/format";
import DealBadge from "./DealBadge";

/** Listing €/m² as a fraction of the area median, clamped to [6, 100]%.
 *  Cheaper-than-area listings fill less of the bar → shorter = better deal. */
function meterWidth(l: Listing): number {
  if (!l.price_per_m2 || !l.area_median_ppm2) return 0;
  return Math.max(6, Math.min(100, (l.price_per_m2 / l.area_median_ppm2) * 100));
}

export default function ListingCard({ listing: l, delay = 0 }: { listing: Listing; delay?: number }) {
  const r = l.deal_rating;
  const w = meterWidth(l);
  return (
    <article className={`listing reveal r-${r}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="listing-top">
        <div className="listing-uv">
          <span className={`fig ${r}`}>{pctSigned(l.undervaluation)}</span>
          <span className="cap">{l.undervaluation != null && l.undervaluation > 0 ? "below area median" : "vs area median"}</span>
        </div>
        <DealBadge rating={r} />
      </div>

      <div className="listing-price mono">{euro(l.price)}</div>

      <div className="listing-meta">
        <b>{area(l.living_area_m2)}</b>
        {l.rooms != null && (<><span className="dot">·</span><span>{l.rooms} rooms</span></>)}
        <span className="dot">·</span>
        <span>{l.postal_code || ""} {l.city}</span>
      </div>

      <div>
        <div className="meter">
          <span className={r} style={{ width: `${w}%` }} />
        </div>
        <div className="meter-row" style={{ marginTop: 6 }}>
          <span className="mono">{ppm2(l.price_per_m2)}</span>
          <span>median {ppm2(l.area_median_ppm2)}</span>
        </div>
      </div>

      <div className="listing-foot">
        <span className="chip-portal">{portalLabel[l.portal] ?? l.portal}</span>
        <a className="listing-link" href={l.url} target="_blank" rel="noreferrer">
          View listing
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </article>
  );
}
