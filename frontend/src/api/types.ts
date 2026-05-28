export type ListingKind = "sale" | "rent";
export type PropertyType = "apartment" | "house";
export type Portal = "immoscout" | "immowelt" | "sparkasse";

export interface SavedSearch {
  id: number;
  name: string;
  city: string;
  postal_code?: string | null;
  listing_kind: ListingKind;
  property_type: PropertyType;
  price_min?: number | null;
  price_max?: number | null;
  size_min?: number | null;
  size_max?: number | null;
  rooms_min?: number | null;
  rooms_max?: number | null;
  active: boolean;
  created_at: string;
}

export type SavedSearchInput = Omit<SavedSearch, "id" | "created_at">;

export interface Listing {
  id: number;
  portal: Portal;
  url: string;
  title: string;
  listing_kind: ListingKind;
  property_type?: PropertyType | null;
  city: string;
  postal_code?: string | null;
  price?: number | null;
  living_area_m2?: number | null;
  rooms?: number | null;
  price_per_m2?: number | null;
  area_median_ppm2?: number | null;
  undervaluation?: number | null;
  deal_rating: "good" | "fair" | "overpriced" | "unknown";
  gross_yield?: number | null;
  last_seen_at: string;
}

export interface AreaSummary {
  area_key: string;
  sale_median_ppm2: number | null;
  rent_median_ppm2: number | null;
  sale_samples: number;
  rent_samples: number;
}

export interface IndexPoint {
  period: string;
  median_price_per_m2: number | null;
  index: number | null;
  sample_count: number;
}
