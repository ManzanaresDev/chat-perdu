// src/components/home/Hero.tsx
import Image from "next/image";
import clsx from "clsx";
import CenterNav from "@/components/layout/CenterNav";

type HeroProps = {
  /** "image" : image fixe animée en CSS · "video" : vidéo de fond (hero.webm / hero.mp4)
   *  · "animated" : fichier WebP animé (public/images/hero.webp) */
  variant?: "image" | "video" | "animated";
  /** Chemin du WebP animé (variant="animated") */
  animatedSrc?: string;
  /**
   * "contain" : l'image est affichée ENTIÈREMENT (aucun recadrage),
   *             les bandes libres sont remplies par une version floutée de la même image.
   * "cover"   : l'image remplit tout l'écran mais peut être recadrée.
   */
  fit?: "contain" | "cover";
  /** Pour fit="cover" : zone de l'image à garder visible (ex. "center 30%", "50% 20%"). */
  position?: string;
  /** Agrandissement de l'image (1 = taille normale, 1.3 = +30 %). Le zoom se fait autour du centre de l'écran :
   *  réglez d'abord `position` pour mettre la tête au centre, puis augmentez `zoom`. */
  zoom?: number;
};

export default function Hero({
  variant = "image",
  animatedSrc = "/images/hero.webp",
  fit = "contain",
  position = "center",
  zoom = 1,
}: HeroProps) {
  const isContain = fit === "contain";
  const fitClass = isContain ? "object-contain" : "object-cover";

  return (
<section className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden py-16">
      {/* 1. Média de fond */}
      <div className="absolute inset-0 -z-20">
        {/* Fond flou : comble les bandes autour de l'image entière */}
        {isContain && (
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            sizes="100vw"
            aria-hidden
            className="animate-kenburns scale-110 object-cover opacity-80 blur-2xl"
          />
        )}

        {/* Couche agrandie : le zoom est ici pour ne pas entrer en conflit avec l'animation de l'image */}
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}
        >
        {/* Image principale (sert aussi de poster à la vidéo, sur mobile et si animations réduites) */}
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={clsx(
            fitClass,
            // Ken Burns uniquement pour la variante image : sous une vidéo, l'animation serait invisible mais coûterait du GPU
            !isContain && variant === "image" && "animate-kenburns will-change-transform"
          )}
          style={{ objectPosition: position }}
        />

        {/* Vidéo : desktop uniquement, masquée si l'utilisateur réduit les animations */}
        {variant === "video" && (
          <video
            className={clsx("absolute inset-0 hidden size-full motion-reduce:hidden md:block", fitClass)}
            style={{ objectPosition: position }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/hero.jpg"
            aria-hidden
            tabIndex={-1}
          >
            <source src="/images/hero.webm" type="video/webm" />
            <source src="/images/hero.mp4" type="video/mp4" />
          </video>
        )}

        {/* WebP animé : `unoptimized` conserve l'animation et la qualité d'origine.
            Masqué si l'utilisateur réduit les animations (l'image fixe reste alors visible). */}
        {variant === "animated" && (
          <Image
            src={animatedSrc}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            aria-hidden
            className={clsx(fitClass, "motion-reduce:hidden")}
            style={{ objectPosition: position }}
          />
        )}
        </div>
      </div>

      {/* 2. Voile de lisibilité */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-night-950/70 via-night-950/45 to-night-950/80"
      />

      {/* Lueur ambrée décorative */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-glow/10 blur-3xl"
      />

      {/* 3. Contenu centré : titre + menu au milieu de la page */}
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center text-cream-50">
        <p className="animate-fade-up text-sm uppercase tracking-[0.3em] text-amber-glow">
          Tableau d’annonces
        </p>

        <h1
          className="animate-fade-up mt-4 font-display leading-tight text-4xl sm:text-6xl md:text-7xll"
          style={{ animationDelay: "0.15s" }}
        >
          Ramenons-le <em className="text-amber-glow not-italic">à la maison</em>
        </h1>

        <p
          className="animate-fade-up mt-5 max-w-xl text-base text-cream-100/90 sm:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Signalez la disparition de votre chat ou l’arrivée d’un chat égaré. Chaque partage
          augmente les chances de retrouvailles.
        </p>

        <div className="animate-fade-up mt-10" style={{ animationDelay: "0.5s" }}>
          <CenterNav />
        </div>
      </div>

      {/* Indicateur de défilement */}
      <a
        href="#dernieres-annonces"
        aria-label="Voir les dernières annonces"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float text-cream-100/80"
      >
        ↓
      </a>
    </section>
  );
}