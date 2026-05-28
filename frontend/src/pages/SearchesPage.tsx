import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { SavedSearchInput } from "../api/types";

const empty: SavedSearchInput = {
  name: "",
  city: "",
  postal_code: "",
  listing_kind: "sale",
  property_type: "apartment",
  price_min: null,
  price_max: null,
  size_min: null,
  size_max: null,
  rooms_min: null,
  rooms_max: null,
  active: true,
};

function num(v: string): number | null {
  return v === "" ? null : Number(v);
}

export default function SearchesPage() {
  const qc = useQueryClient();
  const { data: searches = [] } = useQuery({ queryKey: ["searches"], queryFn: api.listSearches });
  const [form, setForm] = useState<SavedSearchInput>(empty);

  const create = useMutation({
    mutationFn: () => api.createSearch(form),
    onSuccess: () => {
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["searches"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteSearch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["searches"] }),
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.updateSearch(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["searches"] }),
  });
  const scrape = useMutation({ mutationFn: (id: number) => api.scrapeSearch(id) });

  return (
    <>
      <div className="panel">
        <h2>New saved search</h2>
        <div className="form-grid">
          <label>Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>City
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label>Postal code
            <input value={form.postal_code ?? ""} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
          </label>
          <label>Kind
            <select value={form.listing_kind} onChange={(e) => setForm({ ...form, listing_kind: e.target.value as any })}>
              <option value="sale">Sale (buy)</option>
              <option value="rent">Rent</option>
            </select>
          </label>
          <label>Type
            <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as any })}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
            </select>
          </label>
          <label>Price min
            <input type="number" value={form.price_min ?? ""} onChange={(e) => setForm({ ...form, price_min: num(e.target.value) })} />
          </label>
          <label>Price max
            <input type="number" value={form.price_max ?? ""} onChange={(e) => setForm({ ...form, price_max: num(e.target.value) })} />
          </label>
          <label>Size min (m²)
            <input type="number" value={form.size_min ?? ""} onChange={(e) => setForm({ ...form, size_min: num(e.target.value) })} />
          </label>
          <label>Size max (m²)
            <input type="number" value={form.size_max ?? ""} onChange={(e) => setForm({ ...form, size_max: num(e.target.value) })} />
          </label>
          <label>Rooms min
            <input type="number" value={form.rooms_min ?? ""} onChange={(e) => setForm({ ...form, rooms_min: num(e.target.value) })} />
          </label>
          <label>Rooms max
            <input type="number" value={form.rooms_max ?? ""} onChange={(e) => setForm({ ...form, rooms_max: num(e.target.value) })} />
          </label>
          <button disabled={!form.name || !form.city || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Saving…" : "Add search"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Saved searches</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>City</th><th>Postal</th><th>Kind</th><th>Type</th>
              <th>Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.city}</td>
                <td>{s.postal_code || "—"}</td>
                <td>{s.listing_kind}</td>
                <td>{s.property_type}</td>
                <td>
                  <input type="checkbox" checked={s.active}
                    onChange={(e) => toggle.mutate({ id: s.id, active: e.target.checked })} />
                </td>
                <td className="row-actions">
                  <button className="secondary" disabled={scrape.isPending} onClick={() => scrape.mutate(s.id)}>
                    {scrape.isPending && scrape.variables === s.id ? "Scraping…" : "Scrape now"}
                  </button>
                  <button className="danger" onClick={() => remove.mutate(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {searches.length === 0 && (
              <tr><td colSpan={7} className="muted">No searches yet. Add one above.</td></tr>
            )}
          </tbody>
        </table>
        {scrape.isSuccess && <p className="muted">Last scrape: {JSON.stringify(scrape.data)}</p>}
        {scrape.isError && <p className="neg">Scrape failed: {(scrape.error as Error).message}</p>}
      </div>
    </>
  );
}
