"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapAd = {
  id: string;
  lat: number;
  lng: number;
  status: "PERDU" | "TROUVE" | "RETROUVE" | "CLOS";
  city: string;
  color: string;
};

const COLORS: Record<MapAd["status"], string> = {
  PERDU: "#e5484d",
  TROUVE: "#d98a1c",
  RETROUVE: "#3aa675",
  CLOS: "#1c2747",
};
const LABELS: Record<MapAd["status"], string> = {
  PERDU: "Perdu",
  TROUVE: "Trouvé",
  RETROUVE: "Retrouvé",
  CLOS: "Clos",
};

const FRANCE: [number, number] = [46.6, 2.4];

export default function AllAdsMap({ ads }: { ads: MapAd[] }) {
  // Centre : moyenne des positions s'il y en a, sinon la France
  const center: [number, number] = ads.length
    ? [ads.reduce((s, a) => s + a.lat, 0) / ads.length, ads.reduce((s, a) => s + a.lng, 0) / ads.length]
    : FRANCE;

  return (
    <MapContainer center={center} zoom={ads.length ? 9 : 6} scrollWheelZoom className="h-[70dvh] w-full rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {ads.map((ad) => (
        <CircleMarker
          key={ad.id}
          center={[ad.lat, ad.lng]}
          radius={11}
          pathOptions={{ color: "#fff", weight: 2, fillColor: COLORS[ad.status], fillOpacity: 0.95 }}
        >
          <Popup>
            <strong>{LABELS[ad.status]}</strong> · {ad.city}
            <br />
            Chat {ad.color}
            <br />
            <a href={`/annonces/${ad.id}`}>Voir l'annonce</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
