import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <div className="eyebrow">{t("dashboard.eyebrow")}</div>
          <h1 className="page-title">{t("dashboard.title")}</h1>
          <div className="page-sub">
            {t("dashboard.sub")}{" "}
            {isFetching && <span className="spin" />}
          </div>
        </div>
        <Link className="btn ghost" to="/browse">{t("dashboard.browseAll")}</Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title={t("dashboard.empty")}
          hint={t("dashboard.emptyHint")}
          cta={{ to: "/searches", label: t("dashboard.setUp") }}
        />
      ) : (
        <>
          <div className="kpi-row">
            <KpiTile label={t("dashboard.kpi.activeListings")} value={String(listings.length)} foot={t("dashboard.kpi.acrossPortals")} delay={0} />
            <KpiTile label={t("dashboard.kpi.goodDeals")} value={String(goodDeals.length)} good foot={t("dashboard.kpi.belowMedian")} delay={60} />
            <KpiTile label={t("dashboard.kpi.medianPrice")} value={ppm2(medPpm2)} foot={t("dashboard.kpi.ofAllListings")} delay={120} />
            <KpiTile
              label={t("dashboard.kpi.bestUndervaluation")}
              value={best ? pctSigned(best.undervaluation) : "—"}
              good
              foot={best ? `${euroCompact(best.price)} · ${best.postal_code ?? best.city}` : undefined}
              delay={180}
            />
          </div>

          <div className="section-title">
            {t("dashboard.topDeals")} <span className="count">{topDeals.length} {t("dashboard.of")} {listings.length}</span>
          </div>
          <div className="card-grid">
            {topDeals.map((l, i) => (
              <ListingCard key={l.id} listing={l} delay={i * 55} />
            ))}
          </div>

          {areas.length > 0 && (
            <>
              <div className="section-title">
                {t("dashboard.areas")} <span className="count">{areas.length}</span>
              </div>
              <div className="stat-grid">
                {areas.slice(0, 8).map((a) => (
                  <Link key={a.area_key} to="/areas" className="stat" style={{ textDecoration: "none" }}>
                    <div className="stat-key">{a.area_key}</div>
                    <div className="stat-big mono">{ppm2(a.sale_median_ppm2)}</div>
                    <div className="stat-sub">
                      <span>{t("dashboard.medianSale")}</span>
                      <span className="mono">{a.sale_samples} {t("dashboard.listings")}</span>
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
