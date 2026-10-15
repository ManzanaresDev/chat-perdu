// app/(site)/annonces/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getAd } from "@/lib/queries";

export const alt = "Annonce de chat perdu ou trouvé";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getAd(id);
  const ad = found?.moderation === "APPROUVEE" ? found : null;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0b1020", color: "#fdf8ef" }}>
        {ad?.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.photos[0].url} alt="" width={630} height={630} style={{ objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 48 }}>
          <div style={{ fontSize: 28, color: "#f6b84b" }}>
            {ad?.status === "PERDU" ? "CHAT PERDU" : "CHAT TROUVÉ"}
          </div>
          <div style={{ fontSize: 64, marginTop: 12 }}>{ad?.city ?? "Chat Perdu"}</div>
          <div style={{ fontSize: 32, marginTop: 12, opacity: 0.8 }}>{ad?.color}</div>
        </div>
      </div>
    ),
    size
  );
}
