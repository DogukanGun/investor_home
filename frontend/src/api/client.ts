import type {
  AreaSummary,
  IndexPoint,
  Listing,
  ListingKind,
  SavedSearch,
  SavedSearchInput,
} from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
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
  // Auth
  login: (email: string, password: string) =>
    req<{ access_token: string; token_type: string; email: string; name: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    req<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    req<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password: newPassword }) }),

  // Searches
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

  // Listings
  listListings: (params: Record<string, string>) =>
    req<Listing[]>("/api/listings?" + new URLSearchParams(params).toString()),

  // Areas
  listAreas: () => req<AreaSummary[]>("/api/areas"),
  areaTrends: () => req<import("./types").AreaTrend[]>("/api/areas/trends"),
  areaIndex: (areaKey: string, kind: ListingKind) =>
    req<IndexPoint[]>(`/api/areas/${encodeURIComponent(areaKey)}/index?listing_kind=${kind}`),
};
