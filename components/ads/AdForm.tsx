"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { createAd } from "@/actions/ads";
import PhotoUploader from "@/components/ads/PhotoUploader";
import LocationPicker from "@/components/map/LocationPickerDynamic";
import type { PickedLocation } from "@/components/map/LocationPicker";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { DRAFT_KEY } from "@/lib/utils";

const STEPS = ["Situation", "Le chat", "Photos", "Contact"] as const;
const LAST = STEPS.length - 1;

// Étape contenant chaque champ (pour revenir sur l'étape fautive après une erreur serveur)
const STEP_OF: Record<string, number> = {
  status: 0, eventDate: 0, city: 0, postalCode: 0, lat: 0, lng: 0,
  catName: 1, color: 1, sex: 1, ageApprox: 1, description: 1,
  contactName: 3, contactEmail: 3, contactPhone: 3, consent: 3,
};

// Champs jamais mémorisés dans le brouillon
const NOT_SAVED = new Set(["consent", "website", "cf-turnstile-response", "lat", "lng"]);

type Draft = {
  fields: Record<string, string | boolean>;
  photos: string[];
  position: PickedLocation | null;
  step: number;
};

const input =
  "mt-1 w-full rounded-xl border border-night-900/15 bg-white px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-deep";

function Field({
  label, name, error, hint, children,
}: { label: string; name: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      {hint && <p id={`${name}-hint`} className="text-xs text-night-800/60">{hint}</p>}
      {children}
      {error && <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-alert">{error}</p>}
    </div>
  );
}

function StatusChoice({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name="status" value={value} defaultChecked={value === "PERDU"} className="peer sr-only" />
      <span
        className={clsx(
          "block rounded-2xl border-2 border-night-900/10 p-4 text-center font-medium transition",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-deep",
          color
        )}
      >
        {label}
      </span>
    </label>
  );
}

export default function AdForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [position, setPosition] = useState<PickedLocation | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [ready, setReady] = useState(false); // le brouillon a été relu
  const [today, setToday] = useState("");

  const err = (name: string) => errors[name]?.[0];
  const describedBy = (name: string) =>
    [err(name) && `${name}-error`, `${name}-hint`].filter(Boolean).join(" ") || undefined;

  /* ---------- Brouillon (sessionStorage) ---------- */

  const saveDraft = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const fields: Draft["fields"] = {};
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) continue;
      if (!el.name || NOT_SAVED.has(el.name)) continue;
      if (el instanceof HTMLInputElement && el.type === "radio") {
        if (el.checked) fields[el.name] = el.value;
      } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
        fields[el.name] = el.checked;
      } else {
        fields[el.name] = el.value;
      }
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, photos, position, step } satisfies Draft));
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, [photos, position, step]);

  // Relecture au chargement
  useEffect(() => {
    // Date maximale = aujourd'hui (heure locale), calculée côté client pour éviter un écart d'hydratation
    setToday(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));

    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      const form = formRef.current;
      if (stored && form) {
        const d = JSON.parse(stored) as Draft;
        for (const [name, value] of Object.entries(d.fields ?? {})) {
          const el = form.elements.namedItem(name);
          if (!el) continue;
          if (typeof value === "boolean") {
            if (el instanceof HTMLInputElement) el.checked = value;
          } else if (el instanceof RadioNodeList) {
            el.value = value;
          } else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
            el.value = value;
          }
        }
        setPhotos(Array.isArray(d.photos) ? d.photos : []);
        setPosition(d.position ?? null);
        setStep(Math.min(Math.max(d.step ?? 0, 0), LAST));
      }
    } catch {
      /* brouillon illisible : on repart de zéro */
    }
    setReady(true);
  }, []);

  // Sauvegarde quand photos / position / étape changent (une fois le brouillon relu)
  useEffect(() => {
    if (ready) saveDraft();
  }, [ready, saveDraft]);

  /* ---------- Navigation entre étapes ---------- */

  function validateStep(n: number) {
    const form = formRef.current;
    if (!form) return true;
    const fieldset = form.querySelector<HTMLFieldSetElement>(`fieldset[data-step="${n}"]`);
    const controls = fieldset?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea"
    );
    for (const control of Array.from(controls ?? [])) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    if (n === 0 && !position) {
      setFormError("Indiquez où le chat a été vu pour la dernière fois (clic sur la carte ou recherche d'adresse).");
      return false;
    }
    if (n === 2 && photos.length < 1) {
      setFormError("Ajoutez au moins une photo.");
      return false;
    }
    setFormError(null);
    return true;
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, LAST));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goBack = () => {
    setFormError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- Envoi ---------- */

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < LAST) return goNext(); // « Entrée » dans un champ : on avance simplement

    // Valide toutes les étapes ; revient sur la première fautive
    for (let n = 0; n <= LAST; n++) {
      if (!validateStep(n)) {
        if (n !== step) {
          setStep(n);
          requestAnimationFrame(() => validateStep(n)); // réaffiche l'infobulle une fois l'étape visible
        }
        return;
      }
    }

    const fd = new FormData(e.currentTarget);
    setErrors({});
    setFormError(null);

    start(async () => {
      const res = await createAd(fd, photos);
      // En cas de succès, la Server Action redirige vers /annonces/nouvelle/merci : on n'arrive pas ici.
      if (res && !res.ok) {
        window.turnstile?.reset();
        setErrors(res.errors ?? {});
        setFormError(res.error ?? (res.errors ? "Certains champs sont à corriger." : null));
        const firstBad = Object.keys(res.errors ?? {}).map((k) => STEP_OF[k]).filter((n) => n !== undefined);
        if (firstBad.length) setStep(Math.min(...firstBad));
      }
    });
  };

  /* ---------- Rendu ---------- */

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={saveDraft}
      noValidate
      className="mt-8 space-y-8"
    >
      {/* Progression */}
      <div>
        <p className="text-sm font-medium" aria-live="polite">
          Étape {step + 1} sur {STEPS.length} · {STEPS[step]}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label="Progression du formulaire"
          className="mt-2 h-2 overflow-hidden rounded-full bg-night-900/10"
        >
          <div
            className="h-full rounded-full bg-amber-glow transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Étape 1 — Situation */}
      <fieldset data-step="0" hidden={step !== 0} className="space-y-5">
        <legend className="sr-only">Situation</legend>

        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Type d'annonce">
          <StatusChoice value="PERDU" label="🔎 J'ai perdu mon chat" color="peer-checked:border-alert peer-checked:bg-alert/5" />
          <StatusChoice value="TROUVE" label="🐾 J'ai trouvé un chat" color="peer-checked:border-amber-deep peer-checked:bg-amber-glow/10" />
        </div>
        {err("status") && <p role="alert" className="text-sm text-alert">{err("status")}</p>}

        <Field label="Date de la disparition / de la découverte" name="eventDate" error={err("eventDate")}>
          <input
            id="eventDate" name="eventDate" type="date" required max={today || undefined}
            aria-describedby={describedBy("eventDate")} className={input}
          />
        </Field>

        <div>
          <p className="block text-sm font-medium">Où ? <span className="font-normal text-night-800/60">(dernier lieu connu)</span></p>
          <p className="mb-2 text-xs text-night-800/60">
            Cherchez une adresse ou une ville, ou cliquez sur la carte. La position sera floutée (≈ 100 m) avant publication.
          </p>
          <LocationPicker
            value={position}
            onChange={(p) => { setPosition(p); setFormError(null); }}
            onAddress={({ city, postcode }) => {
              const set = (name: string, value: string) => {
                const el = formRef.current?.elements.namedItem(name);
                if (el instanceof HTMLInputElement && value) el.value = value;
              };
              set("city", city);
              set("postalCode", postcode);
              saveDraft();
            }}
          />
          <input type="hidden" name="lat" value={position?.lat ?? ""} />
          <input type="hidden" name="lng" value={position?.lng ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Ville" name="city" error={err("city")}>
            <input id="city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2"
              aria-describedby={describedBy("city")} className={input} />
          </Field>
          <Field label="Code postal" name="postalCode" error={err("postalCode")}>
            <input id="postalCode" name="postalCode" required inputMode="numeric" pattern="\d{5}" maxLength={5}
              autoComplete="postal-code" aria-describedby={describedBy("postalCode")} className={input} />
          </Field>
        </div>
      </fieldset>

      {/* Étape 2 — Le chat */}
      <fieldset data-step="1" hidden={step !== 1} className="space-y-5">
        <legend className="sr-only">Le chat</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (facultatif)" name="catName" error={err("catName")}>
            <input id="catName" name="catName" maxLength={50} aria-describedby={describedBy("catName")} className={input} />
          </Field>
          <Field label="Sexe" name="sex" error={err("sex")}>
            <select id="sex" name="sex" defaultValue="INCONNU" className={input}>
              <option value="INCONNU">Je ne sais pas</option>
              <option value="MALE">Mâle</option>
              <option value="FEMELLE">Femelle</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Couleur et robe" name="color" error={err("color")} hint="ex. tigré roux, noir et blanc…">
            <input id="color" name="color" required minLength={2} maxLength={80}
              aria-describedby={describedBy("color")} className={input} />
          </Field>
          <Field label="Âge approximatif (facultatif)" name="ageApprox" error={err("ageApprox")}>
            <input id="ageApprox" name="ageApprox" maxLength={50} placeholder="environ 3 ans"
              aria-describedby={describedBy("ageApprox")} className={input} />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Identification</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {[
              ["hasChip", "Pucé"],
              ["isTattooed", "Tatoué"],
              ["isCollared", "Porte un collier"],
            ].map(([name, label]) => (
              <label key={name} className="inline-flex items-center gap-2 text-base">
                <input type="checkbox" name={name} className="size-5 accent-amber-deep" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Description et signes distinctifs"
          name="description"
          error={err("description")}
          hint="Caractère, taches, oreille coupée, comportement… (20 caractères minimum)"
        >
          <textarea id="description" name="description" required minLength={20} maxLength={1500} rows={5}
            aria-describedby={describedBy("description")} className={input} />
        </Field>
      </fieldset>

      {/* Étape 3 — Photos */}
      <fieldset data-step="2" hidden={step !== 2} className="space-y-3">
        <legend className="text-sm font-medium">Photos (1 à 4)</legend>
        <p className="text-sm text-night-800/70">Plus la photo est nette, plus les chances augmentent. Privilégiez la lumière du jour.</p>
        <PhotoUploader value={photos} onChange={setPhotos} />
      </fieldset>

      {/* Étape 4 — Contact */}
      <fieldset data-step="3" hidden={step !== 3} className="space-y-5">
        <legend className="sr-only">Contact</legend>

        <p className="rounded-2xl bg-cream-100 p-4 text-sm">
          Votre email ne sera <strong>jamais affiché</strong> : les personnes intéressées vous écrivent via un formulaire.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Votre prénom" name="contactName" error={err("contactName")}>
            <input id="contactName" name="contactName" required minLength={2} maxLength={80} autoComplete="given-name"
              aria-describedby={describedBy("contactName")} className={input} />
          </Field>
          <Field label="Votre email" name="contactEmail" error={err("contactEmail")}>
            <input id="contactEmail" name="contactEmail" type="email" required autoComplete="email"
              aria-describedby={describedBy("contactEmail")} className={input} />
          </Field>
        </div>

        <Field label="Téléphone (facultatif)" name="contactPhone" error={err("contactPhone")}>
          <input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" maxLength={20} autoComplete="tel"
            aria-describedby={describedBy("contactPhone")} className={input} />
        </Field>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="showPhone" className="size-5 accent-amber-deep" />
          Afficher mon téléphone sur l'annonce et l'affiche
        </label>

        <div>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="consent" id="consent" required className="mt-1 size-5 accent-amber-deep"
              aria-describedby={err("consent") ? "consent-error" : undefined} />
            <span className="text-sm">
              J'accepte que mes informations soient publiées dans l'annonce et traitées selon la{" "}
              <a href="/confidentialite" target="_blank" className="underline underline-offset-4">politique de confidentialité</a>.
            </span>
          </label>
          {err("consent") && <p id="consent-error" role="alert" className="mt-1 text-sm text-alert">{err("consent")}</p>}
        </div>

        {/* Honeypot : invisible pour les humains */}
        <div aria-hidden className="absolute -left-[9999px]">
          <label>
            Ne pas remplir
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* Monté seulement sur cette étape : le widget doit être visible pour produire son jeton */}
        {step === LAST && <TurnstileWidget />}
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-xl bg-alert/10 p-3 text-sm text-alert">{formError}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium hover:bg-night-900/5">
            <ArrowLeft className="size-4" aria-hidden /> Retour
          </button>
        ) : <span />}

        {step < LAST ? (
          <button type="button" onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-night-900 px-6 py-3 text-sm font-medium text-white hover:bg-night-800">
            Continuer <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button type="submit" disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-amber-glow px-6 py-3 text-sm font-semibold text-night-950 hover:bg-amber-deep hover:text-white disabled:opacity-60">
            <Send className="size-4" aria-hidden />
            {pending ? "Publication…" : "Publier l'annonce"}
          </button>
        )}
      </div>
    </form>
  );
}
