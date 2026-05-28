import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";

const euro = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " €";

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
      <div className="panel">
        <h2>Areas</h2>
        <table>
          <thead>
            <tr>
              <th>Area</th><th>Sale median €/m²</th><th>Rent median €/m²/mo</th>
              <th>Gross yield*</th><th>Samples (sale/rent)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => {
              const yld =
                a.sale_median_ppm2 && a.rent_median_ppm2
                  ? ((a.rent_median_ppm2 * 12) / a.sale_median_ppm2) * 100
                  : null;
              return (
                <tr key={a.area_key}>
                  <td>{a.area_key}</td>
                  <td>{euro(a.sale_median_ppm2)}</td>
                  <td>{euro(a.rent_median_ppm2)}</td>
                  <td>{yld == null ? "—" : yld.toFixed(1) + " %"}</td>
                  <td>{a.sale_samples} / {a.rent_samples}</td>
                  <td><button className="secondary" onClick={() => setSelected(a.area_key)}>Index ↗</button></td>
                </tr>
              );
            })}
            {areas.length === 0 && (
              <tr><td colSpan={6} className="muted">No area stats yet. Scrape some searches first.</td></tr>
            )}
          </tbody>
        </table>
        <p className="muted">* Gross yield ≈ annual median rent €/m² ÷ median sale €/m². Per-listing yield is on the Listings page.</p>
      </div>

      {area && (
        <div className="panel">
          <h2>Price index — {area} (sale, base period = 100)</h2>
          {index.length < 2 ? (
            <p className="muted">Need at least two scrape days to plot a trend. Currently {index.length} point(s).</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={index} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="#2a3342" />
                <XAxis dataKey="period" stroke="#8b97a7" fontSize={12} />
                <YAxis stroke="#8b97a7" fontSize={12} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#1a212b", border: "1px solid #2a3342" }} />
                <Line type="monotone" dataKey="index" stroke="#4f8cff" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </>
  );
}
