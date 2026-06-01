import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import type { Listing } from "../api/types";
import { area, pctSigned, price } from "../lib/format";

const RATING_COLORS: Record<string, string> = {
  good: "#36d399",
  fair: "#f7b955",
  overpriced: "#fb7185",
  unknown: "#6b7688",
};

function ratingIcon(rating: Listing["deal_rating"]) {
  const color = RATING_COLORS[rating] ?? RATING_COLORS.unknown;
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.35);box-shadow:0 0 10px ${color}88;cursor:pointer"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

function BoundsUpdater({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = listings.filter((l) => l.latitude != null && l.longitude != null);
    if (pts.length > 0) {
      map.fitBounds(
        pts.map((l) => [l.latitude!, l.longitude!] as [number, number]),
        { padding: [40, 40] }
      );
    }
  }, [listings, map]);
  return null;
}

interface Props {
  listings: Listing[];
}

export default function ListingsMap({ listings }: Props) {
  const { t } = useTranslation();
  const mapped = listings.filter((l) => l.latitude != null && l.longitude != null);
  const center: [number, number] =
    mapped.length > 0 ? [mapped[0].latitude!, mapped[0].longitude!] : [54.0, 15.0];

  return (
    <div style={{ position: "relative" }}>
      {mapped.length === 0 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(8,11,16,0.85)", borderRadius: 18, gap: 8,
          color: "#97a3b6", fontSize: 14,
        }}>
          <span style={{ fontSize: 32 }}>📍</span>
          <span>{t("map.noGeocoded")}</span>
          <span style={{ fontSize: 12, color: "#5e6b7e" }}>{t("map.runScrape")}</span>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: 520, borderRadius: 18, overflow: "hidden" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsUpdater listings={mapped} />
        {mapped.map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude!, l.longitude!]}
            icon={ratingIcon(l.deal_rating)}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13, color: "#eef2f8", lineHeight: 1.3 }}>
                  {l.title || `${l.postal_code ?? ""} ${l.city}`}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                    background: RATING_COLORS[l.deal_rating] + "22",
                    color: RATING_COLORS[l.deal_rating], border: `1px solid ${RATING_COLORS[l.deal_rating]}44`,
                  }}>
                    {l.deal_rating.toUpperCase()}
                  </span>
                  {l.undervaluation != null && (
                    <span style={{ fontSize: 11, color: l.undervaluation > 0 ? "#36d399" : "#fb7185" }}>
                      {pctSigned(l.undervaluation)} vs area
                    </span>
                  )}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    {l.price != null && (
                      <tr>
                        <td style={{ color: "#97a3b6", paddingRight: 8 }}>Price</td>
                        <td style={{ color: "#eef2f8", fontWeight: 600 }}>{price(l.price, l.currency)}</td>
                      </tr>
                    )}
                    {l.living_area_m2 != null && (
                      <tr>
                        <td style={{ color: "#97a3b6", paddingRight: 8 }}>Area</td>
                        <td style={{ color: "#eef2f8" }}>{area(l.living_area_m2)}</td>
                      </tr>
                    )}
                    {l.rooms != null && (
                      <tr>
                        <td style={{ color: "#97a3b6", paddingRight: 8 }}>Rooms</td>
                        <td style={{ color: "#eef2f8" }}>{l.rooms}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ color: "#97a3b6", paddingRight: 8 }}>Location</td>
                      <td style={{ color: "#eef2f8" }}>{[l.postal_code, l.city].filter(Boolean).join(" ")}</td>
                    </tr>
                  </tbody>
                </table>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block", marginTop: 8, textAlign: "center", fontSize: 12,
                    color: "#5b8cff", textDecoration: "none", fontWeight: 600,
                  }}
                >
                  {t("map.viewListing")}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ marginTop: 8, fontSize: 12, color: "#5e6b7e" }}>
        {t("map.geocodedOf", { mapped: mapped.length, total: listings.length })}
      </div>
    </div>
  );
}
