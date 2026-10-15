"use client";

import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({
  lat,
  lng,
  radius = 500,
}: {
  lat: number;
  lng: number;
  radius?: number;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-72 w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Zone approximative : on ne montre jamais l'adresse exacte */}
      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{ color: "#d98a1c", fillColor: "#f6b84b", fillOpacity: 0.25 }}
      />
    </MapContainer>
  );
}
