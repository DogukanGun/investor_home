import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Listing, Portal } from "../api/types";
import { area, euro, pctSigned, portalLabel, ppm2 } from "../lib/format";
import FilterChips from "../components/FilterChips";
import ViewToggle from "../components/ViewToggle";
import ListingCard from "../components/ListingCard";
import DealBadge from "../components/DealBadge";
import EmptyState from "../components/EmptyState";

const RATING_CHIPS = [
  { value: "", label: "All" },
  { value: "good", label: "Good", tone: "good" as const },
  { value: "fair", label: "Fair", tone: "fair" as const },
  { value: "overpriced", label: "Overpriced", tone: "overpriced" as const },
];

const PORTALS: Portal[] = ["immoscout", "immowelt", "sparkasse"];

function uvBarColor(r: Listing["deal_rating"]): string {
  return r === "good" ? "var(--good)" : r === "overpriced" ? "var(--bad)" : r === "fair" ? "var(--fair)" : "var(--unknown)";
}

export default function ListingsPage() {
  const [rating, setRating] = useState("");
  const [city, setCity] = useState("");
  const [portal, setPortal] = useState("");
  const [sort, setSort] = useState("undervaluation");
  const [view, setView] = useState<"cards" | "table">("cards");

  const params: Record<string, string> = { listing_kind: "sale", sort };
  if (city) params.city = city;
  if (rating) params.rating = rating;
  if (portal) params.portal = portal;

  const { data: listings = [], isFetching } = useQuery({
    queryKey: ["listings", params],
    queryFn: () => api.listListings(params),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Browse</div>
          <h1 className="page-title">Buy listings</h1>
          <div className="page-sub">{listings.length} listings {isFetching && <span className="spin" />}</div>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="toolbar">
        <FilterChips value={rating} options={RATING_CHIPS} onChange={setRating} />
        <div className="spacer" />
        <label className="field">
          <span>City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="any" />
        </label>
        <label className="field">
          <span>Portal</span>
          <select value={portal} onChange={(e) => setPortal(e.target.value)}>
            <option value="">all</option>
            {PORTALS.map((p) => <option key={p} value={p}>{portalLabel[p]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="undervaluation">Best deal</option>
            <option value="price_per_m2">€/m² (low→high)</option>
            <option value="price">Price (low→high)</option>
            <option value="yield">Gross yield</option>
          </select>
        </label>
      </div>

      {listings.length === 0 ? (
        <EmptyState title="No listings match" hint="Try clearing filters or run a scrape from Searches." cta={{ to: "/searches", label: "Go to searches" }} />
      ) : view === "cards" ? (
        <div className="card-grid">
          {listings.map((l, i) => <ListingCard key={l.id} listing={l} delay={Math.min(i, 12) * 40} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Deal</th><th>Location</th><th className="num">Price</th><th className="num">m²</th>
                <th className="num">€/m²</th><th className="num">Median</th><th className="num">vs area</th>
                <th>Portal</th><th></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const w = l.price_per_m2 && l.area_median_ppm2
                  ? Math.max(6, Math.min(100, (l.price_per_m2 / l.area_median_ppm2) * 100)) : 0;
                return (
                  <tr key={l.id}>
                    <td><DealBadge rating={l.deal_rating} /></td>
                    <td>{l.postal_code || ""} {l.city}{l.rooms != null ? ` · ${l.rooms} rm` : ""}</td>
                    <td className="num">{euro(l.price)}</td>
                    <td className="num">{area(l.living_area_m2)}</td>
                    <td className="num">{ppm2(l.price_per_m2)}</td>
                    <td className="num muted">{ppm2(l.area_median_ppm2)}</td>
                    <td className="num">
                      <div className="uv-cell">
                        <span className={l.undervaluation != null && l.undervaluation > 0 ? "pos" : "neg"}>{pctSigned(l.undervaluation)}</span>
                        <span className="uv-bar"><span style={{ width: `${w}%`, background: uvBarColor(l.deal_rating) }} /></span>
                      </div>
                    </td>
                    <td><span className="chip-portal">{portalLabel[l.portal] ?? l.portal}</span></td>
                    <td><a className="listing-link" href={l.url} target="_blank" rel="noreferrer">View ↗</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
