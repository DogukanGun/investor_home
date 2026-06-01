import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Listing, Portal } from "../api/types";
import { area, countryLabel, pctSigned, portalLabel, ppm2, price } from "../lib/format";
import FilterChips from "../components/FilterChips";
import ViewToggle from "../components/ViewToggle";
import ListingCard from "../components/ListingCard";
import ListingsMap from "../components/ListingsMap";
import DealBadge from "../components/DealBadge";
import EmptyState from "../components/EmptyState";

const PORTALS: Portal[] = ["immoscout", "immowelt", "sparkasse", "idealista", "idealista_pt", "seloger", "funda", "rightmove"];
const COUNTRIES = Object.entries(countryLabel);

function uvBarColor(r: Listing["deal_rating"]): string {
  return r === "good" ? "var(--good)" : r === "overpriced" ? "var(--bad)" : r === "fair" ? "var(--fair)" : "var(--unknown)";
}

export default function ListingsPage() {
  const { t } = useTranslation();
  const [rating, setRating] = useState("");
  const [city, setCity] = useState("");
  const [portal, setPortal] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState("undervaluation");
  const [view, setView] = useState<"cards" | "table" | "map">("cards");

  const RATING_CHIPS = [
    { value: "", label: t("browse.filter.all") },
    { value: "good", label: t("browse.filter.good"), tone: "good" as const },
    { value: "fair", label: t("browse.filter.fair"), tone: "fair" as const },
    { value: "overpriced", label: t("browse.filter.overpriced"), tone: "overpriced" as const },
  ];

  const params: Record<string, string> = { listing_kind: "sale", sort };
  if (city) params.city = city;
  if (rating) params.rating = rating;
  if (portal) params.portal = portal;
  if (country) params.country = country;

  const { data: listings = [], isFetching } = useQuery({
    queryKey: ["listings", params],
    queryFn: () => api.listListings(params),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{t("browse.eyebrow")}</div>
          <h1 className="page-title">{t("browse.title")}</h1>
          <div className="page-sub">{listings.length} {t("browse.listings")} {isFetching && <span className="spin" />}</div>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="toolbar">
        <FilterChips value={rating} options={RATING_CHIPS} onChange={setRating} />
        <div className="spacer" />
        <label className="field">
          <span>{t("browse.filter.city")}</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("browse.filter.cityPlaceholder")} />
        </label>
        <label className="field">
          <span>{t("browse.filter.country")}</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t("browse.filter.countryAll")}</option>
            {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t("browse.filter.portal")}</span>
          <select value={portal} onChange={(e) => setPortal(e.target.value)}>
            <option value="">{t("browse.filter.portalAll")}</option>
            {PORTALS.map((p) => <option key={p} value={p}>{portalLabel[p]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t("browse.filter.sortBy")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="undervaluation">{t("browse.sort.bestDeal")}</option>
            <option value="price_per_m2">{t("browse.sort.ppm2Low")}</option>
            <option value="price">{t("browse.sort.priceLow")}</option>
            <option value="yield">{t("browse.sort.grossYield")}</option>
          </select>
        </label>
      </div>

      {listings.length === 0 ? (
        <EmptyState title={t("browse.noMatch")} hint={t("browse.noMatchHint")} cta={{ to: "/searches", label: t("browse.goToSearches") }} />
      ) : view === "map" ? (
        <ListingsMap listings={listings} />
      ) : view === "cards" ? (
        <div className="card-grid">
          {listings.map((l, i) => <ListingCard key={l.id} listing={l} delay={Math.min(i, 12) * 40} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("browse.table.deal")}</th><th>{t("browse.table.location")}</th>
                <th className="num">{t("browse.table.price")}</th><th className="num">{t("browse.table.area")}</th>
                <th className="num">{t("browse.table.ppm2")}</th><th className="num">{t("browse.table.median")}</th>
                <th className="num">{t("browse.table.vsArea")}</th>
                <th>{t("browse.table.portal")}</th><th></th>
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
                    <td className="num">{price(l.price, l.currency)}</td>
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
                    <td><a className="listing-link" href={l.url} target="_blank" rel="noreferrer">↗</a></td>
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
