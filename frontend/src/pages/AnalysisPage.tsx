import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, Legend,
} from "recharts";
import { api } from "../api/client";
import type { AreaTrend } from "../api/types";
import { ppm2, euro } from "../lib/format";

// ─── colour palette for multi-area history lines ───────────────────────────
const LINE_COLORS = ["#5b8cff", "#36d399", "#f7b955", "#fb7185", "#c084fc"];

// ─── Helpers ──────────────────────────────────────────────────────────────
function pct(n: number | null | undefined, digits = 1) {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}

function trendArrow(v: number | null) {
  if (v == null) return null;
  if (v > 0.5) return { arrow: "↑", cls: "trend-up" };
  if (v < -0.5) return { arrow: "↓", cls: "trend-down" };
  return { arrow: "→", cls: "trend-flat" };
}

// ─── Distribution histogram ───────────────────────────────────────────────
function DistributionChart() {
  const { t } = useTranslation();
  const { data: listings = [] } = useQuery({
    queryKey: ["listings", { listing_kind: "sale", sort: "price_per_m2", limit: "1000" }],
    queryFn: () => api.listListings({ listing_kind: "sale", sort: "price_per_m2", limit: "1000" }),
  });

  const { buckets, median } = useMemo(() => {
    const vals = listings.map(l => l.price_per_m2).filter((v): v is number => v != null);
    if (!vals.length) return { buckets: [], median: null };

    const sorted = [...vals].sort((a, b) => a - b);
    const med = sorted.length % 2
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    const min = Math.floor(sorted[0] / 500) * 500;
    const max = Math.ceil(sorted[sorted.length - 1] / 500) * 500;
    const bkts: { range: string; count: number; start: number }[] = [];
    for (let s = min; s < max; s += 500) {
      bkts.push({
        start: s,
        range: `${(s / 1000).toFixed(1)}k`,
        count: vals.filter(v => v >= s && v < s + 500).length,
      });
    }
    return { buckets: bkts, median: med };
  }, [listings]);

  if (!buckets.length) return <p className="muted">{t("analysis.dist.noData")}</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={buckets} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
        <CartesianGrid stroke="#232c3b" vertical={false} />
        <XAxis dataKey="range" stroke="#5e6b7e" fontSize={11} tickLine={false} axisLine={false}
          label={{ value: t("analysis.dist.xLabel"), position: "insideBottom", offset: -2, fill: "#5e6b7e", fontSize: 11 }} />
        <YAxis stroke="#5e6b7e" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#11161f", border: "1px solid #232c3b", borderRadius: 10, fontFamily: "IBM Plex Mono", fontSize: 12 }}
          formatter={(v: number) => [v, t("analysis.dist.listings")]}
        />
        <Bar dataKey="count" fill="#5b8cff" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        {median != null && (
          <ReferenceLine
            x={`${(Math.round(median / 500) * 500 / 1000).toFixed(1)}k`}
            stroke="#36d399" strokeWidth={2} strokeDasharray="4 3"
            label={{ value: t("analysis.dist.median"), position: "top", fill: "#36d399", fontSize: 11 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Area heatmap ─────────────────────────────────────────────────────────
function AreaHeatmap({ trends }: { trends: AreaTrend[] }) {
  const { t } = useTranslation();

  // Normalise to [0,1] for colour intensity
  const prices = trends.map(a => a.sale_current).filter((v): v is number => v != null);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  function heatColor(v: number | null) {
    if (v == null || maxP === minP) return "#232c3b";
    const ratio = (v - minP) / (maxP - minP); // 0 = cheapest (green), 1 = priciest (red)
    // interpolate: green (#36d399) → neutral (#232c3b) → red (#fb7185)
    if (ratio < 0.5) {
      const t2 = ratio * 2;
      const r = Math.round(0x36 + (0x23 - 0x36) * t2);
      const g = Math.round(0xd3 + (0x2c - 0xd3) * t2);
      const b = Math.round(0x99 + (0x3b - 0x99) * t2);
      return `rgba(${r},${g},${b},0.22)`;
    } else {
      const t2 = (ratio - 0.5) * 2;
      const r = Math.round(0x23 + (0xfb - 0x23) * t2);
      const g = Math.round(0x2c + (0x71 - 0x2c) * t2);
      const b = Math.round(0x3b + (0x85 - 0x3b) * t2);
      return `rgba(${r},${g},${b},0.22)`;
    }
  }

  return (
    <div className="heatmap-grid">
      {trends.map(a => {
        const td = trendArrow(a.sale_trend_pct);
        return (
          <div key={a.area_key} className="heatmap-cell" style={{ background: heatColor(a.sale_current) }}>
            <div className="hm-head">
              <span className="hm-key">{a.area_key}</span>
              {td && <span className={`hm-trend ${td.cls}`}>{td.arrow} {pct(a.sale_trend_pct)}</span>}
            </div>
            <div className="hm-price mono">{ppm2(a.sale_current)}</div>
            <div className="hm-sub">
              {a.p25_ppm2 != null && a.p75_ppm2 != null && (
                <span className="hm-range">{t("analysis.heatmap.range")} {ppm2(a.p25_ppm2)} – {ppm2(a.p75_ppm2)}</span>
              )}
              {a.rent_current != null && (
                <span className="hm-rent">{t("analysis.heatmap.rent")} {ppm2(a.rent_current)}</span>
              )}
            </div>
            <div className="hm-samples">{a.sale_samples} {t("analysis.heatmap.samples")}</div>
          </div>
        );
      })}
    </div>
  );
}

// Fetch index for a single area — avoids hook-in-loop
function useAreaIndex(ak: string) {
  return useQuery({
    queryKey: ["index", ak, "sale"],
    queryFn: () => api.areaIndex(ak, "sale"),
    enabled: !!ak,
  });
}

// Pre-fetch up to 5 areas (fixed slots, hooks always called)
function useFiveAreaIndexes(keys: string[]) {
  const a = useAreaIndex(keys[0] ?? "");
  const b = useAreaIndex(keys[1] ?? "");
  const c = useAreaIndex(keys[2] ?? "");
  const d = useAreaIndex(keys[3] ?? "");
  const e = useAreaIndex(keys[4] ?? "");
  return [a, b, c, d, e];
}

// ─── Multi-area price history ─────────────────────────────────────────────
function PriceHistory({ areaKeys }: { areaKeys: string[] }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"index" | "absolute">("index");
  const [selected, setSelected] = useState<string[]>(areaKeys.slice(0, 3));

  // Always fetch 5 slots (hooks must not be in loops)
  const slots = [...selected, "", "", "", "", ""].slice(0, 5);
  const queries = useFiveAreaIndexes(slots);

  // Merge all areas into one dataset keyed by period
  const chartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number | null>> = {};
    queries.forEach((q, i) => {
      const ak = selected[i];
      if (!ak) return;
      (q.data ?? []).forEach(pt => {
        byPeriod[pt.period] = byPeriod[pt.period] ?? {};
        byPeriod[pt.period][ak] = mode === "index" ? pt.index : pt.median_price_per_m2;
      });
    });
    return Object.entries(byPeriod).sort().map(([period, vals]) => ({ period, ...vals }));
  }, [queries[0].data, queries[1].data, queries[2].data, queries[3].data, queries[4].data, mode, selected]);

  const toggle = (ak: string) => setSelected(s =>
    s.includes(ak) ? s.filter(x => x !== ak) : s.length < 5 ? [...s, ak] : s
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("analysis.history.selectHint")}:</span>
        {areaKeys.map(ak => (
          <button key={ak} onClick={() => toggle(ak)}
            style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "IBM Plex Mono",
              background: selected.includes(ak) ? "var(--accent-soft)" : "var(--card-2)",
              color: selected.includes(ak) ? "var(--accent)" : "var(--muted)",
              border: `1px solid ${selected.includes(ak) ? "var(--accent)" : "var(--line)"}`,
            }}>
            {ak}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {(["index", "absolute"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`lang-btn${mode === m ? " on" : ""}`}>
              {t(`analysis.history.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="muted" style={{ fontSize: 13 }}>{t("analysis.history.noData")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="#232c3b" vertical={false} />
            <XAxis dataKey="period" stroke="#5e6b7e" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#5e6b7e" fontSize={11} tickLine={false} axisLine={false}
              tickFormatter={v => mode === "index" ? String(v) : `${Math.round(v / 1000)}k`} />
            <Tooltip contentStyle={{ background: "#11161f", border: "1px solid #232c3b", borderRadius: 10, fontFamily: "IBM Plex Mono", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
            {selected.map((ak, i) => (
              <Line key={ak} type="monotone" dataKey={ak} stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Yield calculator ─────────────────────────────────────────────────────
function YieldCalc() {
  const { t } = useTranslation();
  const [purchasePrice, setPurchasePrice] = useState("");
  const [area, setArea] = useState("");
  const [rent, setRent] = useState("");
  const [costs, setCosts] = useState("10");
  const [expenses, setExpenses] = useState("150");
  const [mortgageRate, setMortgageRate] = useState("4.5");
  const [ltv, setLtv] = useState("70");

  const results = useMemo(() => {
    const pp = parseFloat(purchasePrice);
    const r = parseFloat(rent);
    if (!pp || !r) return null;
    const costsAmt = pp * (parseFloat(costs) / 100);
    const totalInvestment = pp + costsAmt;
    const equity = pp * (1 - parseFloat(ltv) / 100) + costsAmt;
    const monthlyExpAmt = parseFloat(expenses) || 0;
    const annualRent = r * 12;
    const annualExpenses = monthlyExpAmt * 12;
    const annualMortgagePayment = (pp * (parseFloat(ltv) / 100)) * (parseFloat(mortgageRate) / 100);

    const grossYield = (annualRent / totalInvestment) * 100;
    const netYield = ((annualRent - annualExpenses) / totalInvestment) * 100;
    const monthlyCashflow = r - monthlyExpAmt - (annualMortgagePayment / 12);
    const cashOnCash = ((annualRent - annualExpenses - annualMortgagePayment) / equity) * 100;
    const breakEvenYears = netYield > 0 ? (100 / netYield) : null;

    return { grossYield, netYield, monthlyCashflow, cashOnCash, breakEvenYears };
  }, [purchasePrice, rent, costs, expenses, mortgageRate, ltv]);

  type Field = { label: string; value: string; set: (v: string) => void; placeholder: string; hint?: string };
  const fields: Field[] = [
    { label: t("analysis.yield.purchasePrice"), value: purchasePrice, set: setPurchasePrice, placeholder: "350000" },
    { label: t("analysis.yield.monthlyRent"), value: rent, set: setRent, placeholder: "1400" },
    { label: t("analysis.yield.area"), value: area, set: setArea, placeholder: "75" },
    { label: t("analysis.yield.purchaseCosts"), value: costs, set: setCosts, placeholder: "10", hint: t("analysis.yield.purchaseCostsHint") },
    { label: t("analysis.yield.monthlyExpenses"), value: expenses, set: setExpenses, placeholder: "150", hint: t("analysis.yield.expensesHint") },
    { label: t("analysis.yield.mortgageRate"), value: mortgageRate, set: setMortgageRate, placeholder: "4.5" },
    { label: t("analysis.yield.ltv"), value: ltv, set: setLtv, placeholder: "70" },
  ];

  const kpis = results ? [
    { label: t("analysis.yield.grossYield"), value: results.grossYield.toFixed(2) + "%", good: results.grossYield >= 5 },
    { label: t("analysis.yield.netYield"), value: results.netYield.toFixed(2) + "%", good: results.netYield >= 3.5 },
    { label: t("analysis.yield.monthlyCashflow"), value: euro(results.monthlyCashflow), good: results.monthlyCashflow >= 0 },
    { label: t("analysis.yield.cashOnCash"), value: results.cashOnCash.toFixed(2) + "%", good: results.cashOnCash >= 4 },
    { label: t("analysis.yield.breakEven"), value: results.breakEvenYears ? results.breakEvenYears.toFixed(1) + " " + t("analysis.yield.years") : "—", good: (results.breakEvenYears ?? 99) < 20 },
  ] : [];

  return (
    <div className="yield-layout">
      <div className="yield-inputs">
        {fields.map(f => (
          <label className="field" key={f.label}>
            <span>{f.label}</span>
            <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
            {f.hint && <span style={{ fontSize: 11, color: "var(--faint)", marginTop: 3 }}>{f.hint}</span>}
          </label>
        ))}
      </div>

      <div className="yield-results">
        {!results ? (
          <p className="muted" style={{ fontSize: 13 }}>{t("analysis.yield.fillAll")}</p>
        ) : (
          <div className="yield-kpis">
            {kpis.map(k => (
              <div key={k.label} className={`yield-kpi${k.good ? " good" : ""}`}>
                <div className="yk-label">{k.label}</div>
                <div className={`yk-value mono${k.good ? " good" : ""}`}>{k.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { t } = useTranslation();
  const { data: trends = [] } = useQuery({ queryKey: ["area-trends"], queryFn: api.areaTrends });
  const areaKeys = trends.map(a => a.area_key);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{t("analysis.eyebrow")}</div>
          <h1 className="page-title">{t("analysis.title")}</h1>
          <div className="page-sub">{t("analysis.sub")}</div>
        </div>
      </div>

      {/* Distribution */}
      <div className="panel">
        <div className="section-title" style={{ margin: "0 0 4px" }}>{t("analysis.dist.title")}</div>
        <p className="page-sub" style={{ margin: "0 0 16px", fontSize: 13 }}>{t("analysis.dist.sub")}</p>
        <DistributionChart />
      </div>

      {/* Heatmap */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="section-title" style={{ margin: "0 0 4px" }}>{t("analysis.heatmap.title")}</div>
        <p className="page-sub" style={{ margin: "0 0 16px", fontSize: 13 }}>{t("analysis.heatmap.sub")}</p>
        {trends.length === 0
          ? <p className="muted">{t("analysis.dist.noData")}</p>
          : <AreaHeatmap trends={trends} />}
      </div>

      {/* Price history */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="section-title" style={{ margin: "0 0 4px" }}>{t("analysis.history.title")}</div>
        <p className="page-sub" style={{ margin: "0 0 16px", fontSize: 13 }}>{t("analysis.history.sub")}</p>
        {areaKeys.length > 0
          ? <PriceHistory areaKeys={areaKeys} />
          : <p className="muted">{t("analysis.history.noData")}</p>}
      </div>

      {/* Yield calculator */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="section-title" style={{ margin: "0 0 4px" }}>{t("analysis.yield.title")}</div>
        <p className="page-sub" style={{ margin: "0 0 20px", fontSize: 13 }}>{t("analysis.yield.sub")}</p>
        <YieldCalc />
      </div>
    </>
  );
}
