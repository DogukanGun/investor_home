import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ListingKind, PropertyType, SavedSearchInput } from "../api/types";

const empty: SavedSearchInput = {
  name: "", city: "", postal_code: "",
  listing_kind: "sale", property_type: "apartment",
  price_min: null, price_max: null, size_min: null, size_max: null,
  rooms_min: null, rooms_max: null, active: true,
};

const num = (v: string): number | null => (v === "" ? null : Number(v));

type ScrapeResult = { scraped: number; kept: number; per_portal: Record<string, number> };

export default function SearchesPage() {
  const qc = useQueryClient();
  const { data: searches = [] } = useQuery({ queryKey: ["searches"], queryFn: api.listSearches });
  const [form, setForm] = useState<SavedSearchInput>(empty);
  const set = (patch: Partial<SavedSearchInput>) => setForm((f) => ({ ...f, ...patch }));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["searches"] });
  const create = useMutation({ mutationFn: () => api.createSearch(form), onSuccess: () => { setForm(empty); invalidate(); } });
  const remove = useMutation({ mutationFn: (id: number) => api.deleteSearch(id), onSuccess: invalidate });
  const toggle = useMutation({ mutationFn: (v: { id: number; active: boolean }) => api.updateSearch(v.id, { active: v.active }), onSuccess: invalidate });
  const scrape = useMutation({
    mutationFn: (id: number) => api.scrapeSearch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
  });

  const numFields: Array<[keyof SavedSearchInput, string]> = [
    ["price_min", "Price min €"], ["price_max", "Price max €"],
    ["size_min", "Size min m²"], ["size_max", "Size max m²"],
    ["rooms_min", "Rooms min"], ["rooms_max", "Rooms max"],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Configure</div>
          <h1 className="page-title">Searches</h1>
          <div className="page-sub">Each saved search drives scraping across all three portals.</div>
        </div>
      </div>

      <div className="panel">
        <div className="section-title" style={{ margin: "0 0 16px" }}>New saved search</div>
        <div className="form-grid">
          <label className="field"><span>Name</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Munich centre" />
          </label>
          <label className="field"><span>City</span>
            <input value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="München" />
          </label>
          <label className="field"><span>Postal code</span>
            <input value={form.postal_code ?? ""} onChange={(e) => set({ postal_code: e.target.value })} placeholder="80333" />
          </label>
          <label className="field"><span>Kind</span>
            <select value={form.listing_kind} onChange={(e) => set({ listing_kind: e.target.value as ListingKind })}>
              <option value="sale">Sale (buy)</option>
              <option value="rent">Rent</option>
            </select>
          </label>
          <label className="field"><span>Type</span>
            <select value={form.property_type} onChange={(e) => set({ property_type: e.target.value as PropertyType })}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
            </select>
          </label>
          {numFields.map(([key, label]) => (
            <label className="field" key={key}><span>{label}</span>
              <input type="number" value={(form[key] as number | null) ?? ""} onChange={(e) => set({ [key]: num(e.target.value) } as Partial<SavedSearchInput>)} />
            </label>
          ))}
          <div className="form-actions">
            <button className="btn primary" disabled={!form.name || !form.city || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Saving…" : "Add search"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-title" style={{ margin: "0 0 16px" }}>
          Saved searches <span className="count">{searches.length}</span>
        </div>
        <div className="table-wrap" style={{ border: "none" }}>
          <table>
            <thead>
              <tr><th>Name</th><th>Location</th><th>Kind</th><th>Type</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {searches.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td>{s.city}{s.postal_code ? ` · ${s.postal_code}` : ""}</td>
                  <td>{s.listing_kind}</td>
                  <td>{s.property_type}</td>
                  <td>
                    <input type="checkbox" checked={s.active} onChange={(e) => toggle.mutate({ id: s.id, active: e.target.checked })} />
                  </td>
                  <td>
                    <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="btn ghost" disabled={scrape.isPending} onClick={() => scrape.mutate(s.id)}>
                        {scrape.isPending && scrape.variables === s.id ? <><span className="spin" /> Scraping…</> : "Scrape now"}
                      </button>
                      <button className="btn danger" onClick={() => remove.mutate(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {searches.length === 0 && (
                <tr><td colSpan={6} className="muted">No searches yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {scrape.isSuccess && (() => {
          const r = scrape.data as ScrapeResult;
          return <p className="toast">✓ Scraped {r.scraped}, kept {r.kept} · {Object.entries(r.per_portal).map(([k, v]) => `${k} ${v}`).join("  ·  ")}</p>;
        })()}
        {scrape.isError && <p className="toast err">Scrape failed: {(scrape.error as Error).message}</p>}
      </div>
    </>
  );
}
