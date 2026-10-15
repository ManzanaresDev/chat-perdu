// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const alt = "Chat Perdu — Retrouvons-le ensemble";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0b1020",
          color: "#fdf8ef",
        }}
      >
        <div style={{ fontSize: 120 }}>🐾</div>
        <div style={{ fontSize: 76, marginTop: 8 }}>Ramenons-le à la maison</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#f6b84b" }}>Chat Perdu · annonces gratuites</div>
      </div>
    ),
    size
  );
}
