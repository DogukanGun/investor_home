import type {
  AreaSummary,
  IndexPoint,
  Listing,
  ListingKind,
  SavedSearch,
  SavedSearchInput,
} from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listSearches: () => req<SavedSearch[]>("/api/searches"),
  createSearch: (data: SavedSearchInput) =>
    req<SavedSearch>("/api/searches", { method: "POST", body: JSON.stringify(data) }),
  updateSearch: (id: number, data: Partial<SavedSearchInput>) =>
    req<SavedSearch>(`/api/searches/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSearch: (id: number) =>
    req<void>(`/api/searches/${id}`, { method: "DELETE" }),
  scrapeSearch: (id: number) =>
    req<unknown>(`/api/scrape/search/${id}`, { method: "POST" }),
  bulkGermany: (data: { listing_kind: string; property_type: string; price_max?: number | null }) =>
    req<{ created: number; skipped: number }>("/api/searches/bulk-germany", { method: "POST", body: JSON.stringify(data) }),

  listListings: (params: Record<string, string>) =>
    req<Listing[]>("/api/listings?" + new URLSearchParams(params).toString()),

  listAreas: () => req<AreaSummary[]>("/api/areas"),
  areaTrends: () => req<import("./types").AreaTrend[]>("/api/areas/trends"),
  areaIndex: (areaKey: string, kind: ListingKind) =>
    req<IndexPoint[]>(`/api/areas/${encodeURIComponent(areaKey)}/index?listing_kind=${kind}`),
};
