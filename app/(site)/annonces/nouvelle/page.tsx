import type { Metadata } from "next";
import AdForm from "@/components/ads/AdForm";

export const metadata: Metadata = {
  title: "Déposer une annonce",
  description: "Signalez un chat perdu ou trouvé en quelques minutes.",
};

export default function NewAdPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl">Déposer une annonce</h1>
      <p className="mt-2 text-night-800/70">
        Quelques minutes suffisent. Plus l'annonce est précise, plus elle a de chances d'aboutir.
      </p>
      <AdForm />
    </div>
  );
}
