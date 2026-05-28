import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ListingKind } from "../api/types";

const euro = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " €";
const pct = (n?: number | null) => (n == null ? "—" : (n * 100).toFixed(1) + " %");

export default function ListingsPage() {
  const [kind, setKind] = useState<ListingKind>("sale");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("undervaluation");

  const params: Record<string, string> = { listing_kind: kind, sort };
  if (city) params.city = city;
  if (rating) params.rating = rating;

  const { data: listings = [], isFetching } = useQuery({
    queryKey: ["listings", params],
    queryFn: () => api.listListings(params),
  });

  return (
    <div className="panel">
      <h2>Listings {isFetching && <span className="muted">· loading…</span>}</h2>
      <div className="toolbar">
        <label>Kind
          <select value={kind} onChange={(e) => setKind(e.target.value as ListingKind)}>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
          </select>
        </label>
        <label>City
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="any" />
        </label>
        <label>Deal
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">any</option>
            <option value="good">good</option>
            <option value="fair">fair</option>
            <option value="overpriced">overpriced</option>
          </select>
        </label>
        <label>Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="undervaluation">Undervaluation</option>
            <option value="yield">Gross yield</option>
            <option value="price_per_m2">€/m²</option>
            <option value="price">Price</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Title</th><th>Portal</th><th>City</th><th>Price</th><th>m²</th>
            <th>€/m²</th><th>Area median</th><th>Undervalued</th><th>Deal</th><th>Gross yield</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td><a className="listing-link" href={l.url} target="_blank" rel="noreferrer">{l.title || "(untitled)"}</a></td>
              <td>{l.portal}</td>
              <td>{l.city}{l.postal_code ? ` (${l.postal_code})` : ""}</td>
              <td>{euro(l.price)}</td>
              <td>{l.living_area_m2 ?? "—"}</td>
              <td>{euro(l.price_per_m2)}</td>
              <td>{euro(l.area_median_ppm2)}</td>
              <td className={l.undervaluation == null ? "" : l.undervaluation >= 0 ? "pos" : "neg"}>
                {pct(l.undervaluation)}
              </td>
              <td><span className={`badge ${l.deal_rating}`}>{l.deal_rating}</span></td>
              <td>{pct(l.gross_yield)}</td>
            </tr>
          ))}
          {listings.length === 0 && (
            <tr><td colSpan={10} className="muted">No listings. Run a scrape from the Searches page.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
