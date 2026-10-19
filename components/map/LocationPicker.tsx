"use client";

import { useState } from "react";
import { CircleMarker, MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search } from "lucide-react";
import { blur } from "@/lib/utils";
import { ZONE, isInZone } from "@/lib/zone";

export type PickedLocation = { lat: number; lng: number };

type Props = {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
};

type AddressFeature = {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: { city?: string; postcode?: string };
};

const ZONE_BOUNDS: [[number, number], [number, number]] = [
  [ZONE.bounds.south, ZONE.bounds.west],
  [ZONE.bounds.north, ZONE.bounds.east],
];
// Marge autour de la zone : la carte ne peut pas être déplacée plus loin
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [ZONE.bounds.south - 0.01, ZONE.bounds.west - 0.01],
  [ZONE.bounds.north + 0.01, ZONE.bounds.east + 0.01],
];

async function searchAddress(q: string): Promise<AddressFeature | null> {
  // Le filtre postcode limite la recherche de l'API Adresse au code postal de la zone
  const res = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&postcode=${ZONE.postalCode}&limit=1`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: AddressFeature[] };
  return data.features?.[0] ?? null;
}

/** Écoute les clics sur la carte. */
function ClickHandler({ onPick }: { onPick: (p: PickedLocation) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: blur(e.latlng.lat), lng: blur(e.latlng.lng) }),
  });
  return null;
}

/** Recentre la carte quand la position change (recherche, géolocalisation). */
function Recenter({ value }: { value: PickedLocation | null }) {
  const map = useMap();
  const lat = value?.lat;
  const lng = value?.lng;
  if (lat !== undefined && lng !== undefined) {
    // setView à chaque rendu avec un nouveau point : on ne bouge que si le centre est loin
    const center = map.getCenter();
    if (Math.abs(center.lat - lat) > 0.002 || Math.abs(center.lng - lng) > 0.002) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }
  return null;
}

export default function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  /** N'accepte un point que s'il est dans la zone autorisée. */
  function accept(p: PickedLocation) {
    if (!isInZone(p.lat, p.lng)) {
      setStatus(`Ce point est hors de ${ZONE.label} : les annonces sont limitées à cette zone.`);
      return;
    }
    setStatus(null);
    onChange(p);
  }

  async function onSearch() {
    if (query.trim().length < 3) return;
    setStatus("Recherche…");
    try {
      const f = await searchAddress(query.trim());
      if (!f) return setStatus("Aucun résultat à Malo-les-Bains. Essayez avec le nom de la rue.");
      const [lng, lat] = f.geometry.coordinates;
      accept({ lat: blur(lat), lng: blur(lng) });
    } catch {
      setStatus("Recherche indisponible, cliquez directement sur la carte.");
    }
  }

  function locateMe() {
    if (!navigator.geolocation) return setStatus("Géolocalisation indisponible sur cet appareil.");
    setStatus("Localisation…");
    navigator.geolocation.getCurrentPosition(
      (pos) => accept({ lat: blur(pos.coords.latitude), lng: blur(pos.coords.longitude) }),
      () => setStatus("Impossible de vous localiser. Utilisez la recherche ou la carte."),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Pas d'attribut `name` : ce champ ne part pas avec le formulaire */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // ne soumet pas le formulaire parent
              void onSearch();
            }
          }}
          placeholder="Rue ou adresse à Malo-les-Bains"
          aria-label="Rechercher une adresse à Malo-les-Bains"
          className="flex-1 rounded-xl border border-night-900/15 bg-white px-3 py-3 text-base"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onSearch()}
            className="inline-flex items-center gap-2 rounded-full bg-night-900 px-5 py-3 text-sm font-medium text-white hover:bg-night-800"
          >
            <Search className="size-4" aria-hidden />
            Chercher
          </button>
          <button
            type="button"
            onClick={locateMe}
            className="inline-flex items-center gap-2 rounded-full border border-night-900/20 px-4 py-3 text-sm hover:bg-night-900/5"
          >
            <LocateFixed className="size-4" aria-hidden />
            Ma position
          </button>
        </div>
      </div>

      {status && <p role="status" className="text-sm text-night-800/70">{status}</p>}

      <MapContainer
        center={value ? [value.lat, value.lng] : [ZONE.center.lat, ZONE.center.lng]}
        zoom={15}
        minZoom={13}
        maxBounds={MAX_BOUNDS}
        scrollWheelZoom
        className="h-72 w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Contour de la zone autorisée */}
        <Rectangle
          bounds={ZONE_BOUNDS}
          pathOptions={{ color: "#d98a1c", weight: 2, fill: false, dashArray: "6" }}
        />
        <ClickHandler onPick={accept} />
        <Recenter value={value} />
        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={10}
            pathOptions={{ color: "#d98a1c", fillColor: "#f6b84b", fillOpacity: 0.9, weight: 3 }}
          />
        )}
      </MapContainer>

      <p className="text-xs text-night-800/60" aria-live="polite">
        {value ? "Position enregistrée (floutée à environ 100 m)." : "Aucune position choisie pour le moment."}
      </p>
    </div>
  );
}