// Shared formatters for money, area, percentages and deal ratings.

export const euro = (n?: number | null): string =>
  n == null ? "—" : n.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " €";

/** Compact euro for large figures: 1.290.000 € -> "1,29 Mio €". */
export const euroCompact = (n?: number | null): string => {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 2 }) + " Mio €";
  if (n >= 1_000) return Math.round(n / 1000) + "k €";
  return euro(n);
};

export const ppm2 = (n?: number | null): string =>
  n == null ? "—" : Math.round(n).toLocaleString("de-DE") + " €/m²";

export const area = (n?: number | null): string =>
  n == null ? "—" : n.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " m²";

/** Signed percentage, e.g. 0.67 -> "−67%" (undervaluation: positive = cheaper). */
export const pctSigned = (n?: number | null): string => {
  if (n == null) return "—";
  const v = Math.round(n * 100);
  return (v > 0 ? "−" : v < 0 ? "+" : "") + Math.abs(v) + "%";
};

export const pct = (n?: number | null): string =>
  n == null ? "—" : (n * 100).toFixed(1) + "%";

export type DealRating = "good" | "fair" | "overpriced" | "unknown";

export const dealLabel: Record<DealRating, string> = {
  good: "Good deal",
  fair: "Fair price",
  overpriced: "Overpriced",
  unknown: "No benchmark",
};

export const portalLabel: Record<string, string> = {
  immoscout: "ImmoScout24",
  immowelt: "Immowelt",
  sparkasse: "Sparkasse",
};
