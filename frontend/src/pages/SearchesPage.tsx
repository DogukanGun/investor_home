import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { ListingKind, PropertyType, SavedSearchInput } from "../api/types";
import { countryLabel } from "../lib/format";

const COUNTRIES = Object.entries(countryLabel);

const empty: SavedSearchInput = {
  name: "", city: "", postal_code: "",
  radius_km: null,
  country: "de",
  listing_kind: "sale", property_type: "apartment",
  price_min: null, price_max: null, size_min: null, size_max: null,
  rooms_min: null, rooms_max: null, active: true,
};

const num = (v: string): number | null => (v === "" ? null : Number(v));

type ScrapeResult = { scraped: number; kept: number; per_portal: Record<string, number> };

export default function SearchesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: searches = [] } = useQuery({ queryKey: ["searches"], queryFn: api.listSearches });
  const [form, setForm] = useState<SavedSearchInput>(empty);
  const set = (patch: Partial<SavedSearchInput>) => setForm((f) => ({ ...f, ...patch }));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["searches"] });
  const create = useMutation({ mutationFn: () => api.createSearch(form), onSuccess: () => { setForm(empty); invalidate(); } });
  const bulkGermany = useMutation({
    mutationFn: () => api.bulkGermany({ listing_kind: form.listing_kind, property_type: form.property_type, price_max: form.price_max }),
    onSuccess: invalidate,
  });
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
    ["price_min", t("searches.form.priceMin")], ["price_max", t("searches.form.priceMax")],
    ["size_min", t("searches.form.sizeMin")], ["size_max", t("searches.form.sizeMax")],
    ["rooms_min", t("searches.form.roomsMin")], ["rooms_max", t("searches.form.roomsMax")],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{t("searches.eyebrow")}</div>
          <h1 className="page-title">{t("searches.title")}</h1>
          <div className="page-sub">{t("searches.sub")}</div>
        </div>
      </div>

      <div className="panel">
        <div className="section-title" style={{ margin: "0 0 16px" }}>{t("searches.newSearch")}</div>
        <div className="form-grid">
          <label className="field"><span>{t("searches.form.name")}</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("searches.form.namePlaceholder")} />
          </label>
          <label className="field"><span>{t("searches.form.city")}</span>
            <input value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="München" />
          </label>
          <label className="field"><span>{t("searches.form.postalCode")}</span>
            <input value={form.postal_code ?? ""} onChange={(e) => set({ postal_code: e.target.value })} placeholder="80333" />
          </label>
          {form.postal_code && (
            <label className="field"><span>{t("searches.form.radiusKm")}</span>
              <select value={form.radius_km ?? ""} onChange={(e) => set({ radius_km: e.target.value === "" ? null : Number(e.target.value) })}>
                <option value="">{t("searches.form.radiusNone")}</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </label>
          )}
          <label className="field"><span>{t("searches.form.country")}</span>
            <select value={form.country} onChange={(e) => set({ country: e.target.value })}>
              {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label className="field"><span>{t("searches.form.kind")}</span>
            <select value={form.listing_kind} onChange={(e) => set({ listing_kind: e.target.value as ListingKind })}>
              <option value="sale">{t("searches.form.sale")}</option>
              <option value="rent">{t("searches.form.rent")}</option>
            </select>
          </label>
          <label className="field"><span>{t("searches.form.type")}</span>
            <select value={form.property_type} onChange={(e) => set({ property_type: e.target.value as PropertyType })}>
              <option value="apartment">{t("searches.form.apartment")}</option>
              <option value="house">{t("searches.form.house")}</option>
            </select>
          </label>
          {numFields.map(([key, label]) => (
            <label className="field" key={key}><span>{label}</span>
              <input type="number" value={(form[key] as number | null) ?? ""} onChange={(e) => set({ [key]: num(e.target.value) } as Partial<SavedSearchInput>)} />
            </label>
          ))}
          <div className="form-actions">
            <button className="btn primary" disabled={!form.name || !form.city || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? t("searches.form.saving") : t("searches.form.addSearch")}
            </button>
            <button className="btn ghost" disabled={bulkGermany.isPending} onClick={() => bulkGermany.mutate()} title={t("searches.form.importCities")}>
              {bulkGermany.isPending ? t("searches.form.importing") : t("searches.form.importCities")}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-title" style={{ margin: "0 0 16px" }}>
          {t("searches.savedSearches")} <span className="count">{searches.length}</span>
        </div>
        <div className="table-wrap" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>{t("searches.table.name")}</th>
                <th>{t("searches.table.location")}</th>
                <th>{t("searches.table.country")}</th>
                <th>{t("searches.table.kind")}</th>
                <th>{t("searches.table.type")}</th>
                <th>{t("searches.table.active")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {searches.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td>{s.city}{s.postal_code ? ` · ${s.postal_code}` : ""}{s.postal_code && s.radius_km ? ` ±${s.radius_km}km` : ""}</td>
                  <td>{countryLabel[s.country] ?? s.country}</td>
                  <td>{s.listing_kind}</td>
                  <td>{s.property_type}</td>
                  <td>
                    <input type="checkbox" checked={s.active} onChange={(e) => toggle.mutate({ id: s.id, active: e.target.checked })} />
                  </td>
                  <td>
                    <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="btn ghost" disabled={scrape.isPending} onClick={() => scrape.mutate(s.id)}>
                        {scrape.isPending && scrape.variables === s.id ? <><span className="spin" /> {t("searches.scraping")}</> : t("searches.scrapeNow")}
                      </button>
                      <button className="btn danger" onClick={() => remove.mutate(s.id)}>{t("searches.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {searches.length === 0 && (
                <tr><td colSpan={7} className="muted">{t("searches.noSearches")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {bulkGermany.isSuccess && (
          <p className="toast">{t("searches.importSuccess", { created: bulkGermany.data.created, skipped: bulkGermany.data.skipped })}</p>
        )}
        {scrape.isSuccess && (() => {
          const r = scrape.data as ScrapeResult;
          return <p className="toast">{t("searches.scrapeSuccess", { scraped: r.scraped, kept: r.kept })} · {Object.entries(r.per_portal).map(([k, v]) => `${k} ${v}`).join("  ·  ")}</p>;
        })()}
        {scrape.isError && <p className="toast err">Scrape failed: {(scrape.error as Error).message}</p>}
      </div>
    </>
  );
}
