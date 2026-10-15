// app/error.tsx
"use client";

import Image from "next/image";

/**
 * ⚙️ POSITION DU TEXTE (en % de l'image, pas de l'écran)
 * - left / bottom : distance par rapport au coin bas gauche de l'image
 * - maxWidth : largeur max du bloc (garde-la sous 48% pour ne pas toucher le chat)
 * - Pour positionner depuis le haut : top: "55%", bottom: "auto"
 */
const TEXT_POSITION = {
  top: "auto",
  bottom: "7%",
  left: "3%",
  maxWidth: "48%",
  textAlign: "left" as "left" | "center" | "right",
};

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="contenu"
      className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-night-950 text-cream-50"
    >
      {/* Cadre au ratio 3:2 de la photo : l'image est toujours visible en entier */}
      <div
        className="relative"
        style={{
          width: "min(100vw, 150dvh)",
          aspectRatio: "3 / 2",
          containerType: "inline-size",
        }}
      >
        <Image
          src="/images/error.webp"
          alt="Un chaton blanc et gris assis, le regard tourné sur le côté"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Voile sombre côté gauche pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        {/* Bloc de texte : les tailles suivent la largeur de l'image (cqw) */}
        <div
          className="absolute"
          style={{
            top: TEXT_POSITION.top,
            bottom: TEXT_POSITION.bottom,
            left: TEXT_POSITION.left,
            maxWidth: TEXT_POSITION.maxWidth,
            textAlign: TEXT_POSITION.textAlign,
          }}
        >
          <h1
            className="font-display leading-tight drop-shadow-lg"
            style={{ fontSize: "clamp(1.5rem, 5.5cqw, 6rem)" }}
          >
            Oups, une erreur est survenue
          </h1>
          <p
            className="text-cream-100/90 drop-shadow-lg"
            style={{
              fontSize: "clamp(0.875rem, 2cqw, 2rem)",
              marginTop: "2cqw",
            }}
          >
            Ce n'est pas votre faute. Réessayez dans un instant.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-amber-glow font-semibold text-night-950 hover:bg-amber-deep hover:text-white"
            style={{
              marginTop: "2.5cqw",
              padding: "1.1cqw 2.8cqw",
              fontSize: "clamp(0.875rem, 1.6cqw, 1.5rem)",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    </main>
  );
}