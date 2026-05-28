import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Listing } from "../api/types";
import { euroCompact, pctSigned, ppm2 } from "../lib/format";
import KpiTile from "../components/KpiTile";
import ListingCard from "../components/ListingCard";
import EmptyState from "../components/EmptyState";

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default function DashboardPage() {
  const { data: listings = [], isFetching } = useQuery({
    queryKey: ["listings", { listing_kind: "sale", sort: "undervaluation" }],
    queryFn: () => api.listListings({ listing_kind: "sale", sort: "undervaluation" }),
  });
  const { data: areas = [] } = useQuery({ queryKey: ["areas"], queryFn: api.listAreas });

  const goodDeals = listings.filter((l: Listing) => l.deal_rating === "good");
  const medPpm2 = median(listings.map((l) => l.price_per_m2).filter((n): n is number => n != null));
  const best = listings.find((l) => l.undervaluation != null) ?? null;
  const topDeals = listings.slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h1 className="page-title">What&apos;s a good buy right now</h1>
          <div className="page-sub">
            Listings ranked by price per m² against the local median.{" "}
            {isFetching && <span className="spin" />}
          </div>
        </div>
        <Link className="btn ghost" to="/browse">Browse all deals →</Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          hint="Create a saved search for a city or postal code, then run a scrape."
          cta={{ to: "/searches", label: "Set up a search" }}
        />
      ) : (
        <>
          <div className="kpi-row">
            <KpiTile label="Active buy listings" value={String(listings.length)} foot="across all portals" delay={0} />
            <KpiTile label="Good deals" value={String(goodDeals.length)} good foot="≥10% below area median" delay={60} />
            <KpiTile label="Median price" value={ppm2(medPpm2)} foot="of all listings shown" delay={120} />
            <KpiTile
              label="Best undervaluation"
              value={best ? pctSigned(best.undervaluation) : "—"}
              good
              foot={best ? `${euroCompact(best.price)} · ${best.postal_code ?? best.city}` : undefined}
              delay={180}
            />
          </div>

          <div className="section-title">
            Top deals <span className="count">{topDeals.length} of {listings.length}</span>
          </div>
          <div className="card-grid">
            {topDeals.map((l, i) => (
              <ListingCard key={l.id} listing={l} delay={i * 55} />
            ))}
          </div>

          {areas.length > 0 && (
            <>
              <div className="section-title">
                Areas <span className="count">{areas.length}</span>
              </div>
              <div className="stat-grid">
                {areas.slice(0, 8).map((a) => (
                  <Link key={a.area_key} to="/areas" className="stat" style={{ textDecoration: "none" }}>
                    <div className="stat-key">{a.area_key}</div>
                    <div className="stat-big mono">{ppm2(a.sale_median_ppm2)}</div>
                    <div className="stat-sub">
                      <span>median sale</span>
                      <span className="mono">{a.sale_samples} listings</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
