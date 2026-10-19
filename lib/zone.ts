// lib/zone.ts : zone autorisée, utilisable côté client ET serveur
export const ZONE = {
  label: "Malo-les-Bains (Dunkerque)",
  city: "Malo-les-Bains", // valeur enregistrée dans Ad.city
  postalCode: "59240",
  center: { lat: 51.045, lng: 2.4 },
  // Rectangle approximatif à ajuster : sud, ouest, nord, est
  bounds: { south: 51.038, west: 2.385, north: 51.065, east: 2.418 },
} as const;

export function isInZone(lat: number, lng: number) {
  const { south, west, north, east } = ZONE.bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}