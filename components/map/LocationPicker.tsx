"use client";

import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search } from "lucide-react";
import { blur } from "@/lib/utils";

export type PickedLocation = { lat: number; lng: number };

type Props = {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
  /** Appelé quand on connaît la ville / le code postal du point choisi. */
  onAddress?: (address: { city: string; postcode: string }) => void;
};

type AddressFeature = {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: { city?: string; postcode?: string };
};

const FRANCE: [number, number] = [46.6, 2.4];

async function searchAddress(q: string): Promise<AddressFeature | null> {
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`);
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: AddressFeature[] };
  return data.features?.[0] ?? null;
}

async function reverseGeocode(lat: number, lng: number): Promise<AddressFeature | null> {
  const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`);
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

export default function LocationPicker({ value, onChange, onAddress }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function pick(p: PickedLocation, withAddress = true) {
    onChange(p);
    if (withAddress && onAddress) {
      try {
        const f = await reverseGeocode(p.lat, p.lng);
        if (f?.properties.city) onAddress({ city: f.properties.city, postcode: f.properties.postcode ?? "" });
      } catch {
        /* l'adresse reste à saisir à la main */
      }
    }
  }

  async function onSearch() {
    if (query.trim().length < 3) return;
    setStatus("Recherche…");
    try {
      const f = await searchAddress(query.trim());
      if (!f) return setStatus("Aucun résultat. Essayez avec le nom de la ville.");
      const [lng, lat] = f.geometry.coordinates;
      onChange({ lat: blur(lat), lng: blur(lng) });
      if (f.properties.city) onAddress?.({ city: f.properties.city, postcode: f.properties.postcode ?? "" });
      setStatus(null);
    } catch {
      setStatus("Recherche indisponible, cliquez directement sur la carte.");
    }
  }

  function locateMe() {
    if (!navigator.geolocation) return setStatus("Géolocalisation indisponible sur cet appareil.");
    setStatus("Localisation…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus(null);
        void pick({ lat: blur(pos.coords.latitude), lng: blur(pos.coords.longitude) });
      },
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
          placeholder="Adresse, rue ou ville"
          aria-label="Rechercher une adresse"
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
        center={value ? [value.lat, value.lng] : FRANCE}
        zoom={value ? 15 : 6}
        scrollWheelZoom
        className="h-72 w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(p) => void pick(p)} />
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
