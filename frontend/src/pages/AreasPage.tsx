import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { ppm2 } from "../lib/format";
import EmptyState from "../components/EmptyState";

export default function AreasPage() {
  const { data: areas = [] } = useQuery({ queryKey: ["areas"], queryFn: api.listAreas });
  const [selected, setSelected] = useState<string | null>(null);

  const area = selected ?? areas[0]?.area_key ?? null;
  const { data: index = [] } = useQuery({
    queryKey: ["index", area],
    queryFn: () => api.areaIndex(area!, "sale"),
    enabled: !!area,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Market</div>
          <h1 className="page-title">Areas &amp; price index</h1>
          <div className="page-sub">Median €/m² per postal area, and how it trends over time.</div>
        </div>
      </div>

      {areas.length === 0 ? (
        <EmptyState title="No area stats yet" hint="Scrape a search to populate per-area medians." cta={{ to: "/searches", label: "Go to searches" }} />
      ) : (
        <>
          <div className="stat-grid">
            {areas.map((a) => (
              <div
                key={a.area_key}
                className={`stat ${a.area_key === area ? "sel" : ""}`}
                onClick={() => setSelected(a.area_key)}
              >
                <div className="stat-key">{a.area_key}</div>
                <div className="stat-big mono">{ppm2(a.sale_median_ppm2)}</div>
                <div className="stat-sub">
                  <span>median sale price</span>
                  <span className="mono">{a.sale_samples} listings</span>
                </div>
              </div>
            ))}
          </div>

          {area && (
            <div className="panel" style={{ marginTop: 22 }}>
              <div className="section-title" style={{ margin: "0 0 14px" }}>
                Price index — {area} <span className="count">base period = 100</span>
              </div>
              {index.length < 2 ? (
                <p className="muted">
                  Need at least two scrape days to plot a trend. Currently {index.length} data point(s).
                  Re-scrape on another day and the curve appears here.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={index} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#5b8cff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#232c3b" vertical={false} />
                    <XAxis dataKey="period" stroke="#5e6b7e" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5e6b7e" fontSize={12} domain={["auto", "auto"]} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#11161f", border: "1px solid #232c3b", borderRadius: 10, fontFamily: "IBM Plex Mono" }} />
                    <Area type="monotone" dataKey="index" stroke="#5b8cff" strokeWidth={2.5} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
