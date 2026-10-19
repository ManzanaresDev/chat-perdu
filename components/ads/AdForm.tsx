"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Minus, Plus, Send } from "lucide-react";
import { createAd } from "@/actions/ads";
import PhotoUploader from "@/components/ads/PhotoUploader";
import LocationPicker from "@/components/map/LocationPickerDynamic";
import type { PickedLocation } from "@/components/map/LocationPicker";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { DRAFT_KEY } from "@/lib/utils";
import { ZONE, isInZone } from "@/lib/zone";

const STEPS = ["Situation", "Le chat", "Photos", "Contact"] as const;
const LAST = STEPS.length - 1;

// Étape contenant chaque champ (pour revenir sur l'étape fautive après une erreur serveur)
// La ville et le code postal ne sont plus saisis : le serveur les fixe d'après ZONE.
const STEP_OF: Record<string, number> = {
  status: 0, eventDate: 0, lat: 0, lng: 0,
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

/* ---------- Aides pour l'interface mobile ---------- */

// Pastille (bouton à bascule) réutilisée pour les raccourcis de date et les âges
const chip = (active: boolean) =>
  clsx(
    "min-h-11 rounded-full border-2 px-4 py-2 text-center text-sm font-medium transition disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep",
    active ? "border-amber-deep bg-amber-glow/15" : "border-night-900/10 bg-white hover:bg-night-900/5"
  );

const stepBtn =
  "inline-flex size-12 items-center justify-center rounded-full border-2 border-night-900/15 bg-white transition hover:bg-night-900/5 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep";

// Date au format AAAA-MM-JJ, reculée de `days` jours (calcul en UTC pour éviter les décalages d'heure d'été)
function shiftDay(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const DATE_CHIPS = [
  { label: "Aujourd'hui", ago: 0 },
  { label: "Hier", ago: 1 },
  { label: "Il y a 2 jours", ago: 2 },
] as const;

const AGE_PRESETS = [
  "Chaton (moins de 1 an)",
  "Jeune (1 à 3 ans)",
  "Adulte (3 à 10 ans)",
  "Senior (plus de 10 ans)",
] as const;

type AgeUnit = "mois" | "ans";
const AGE_MAX: Record<AgeUnit, number> = { mois: 24, ans: 25 };

const ageLabel = (n: number, unit: AgeUnit) => (unit === "mois" ? "mois" : n > 1 ? "ans" : "an");
const formatAge = (n: number, unit: AgeUnit) => `environ ${n} ${ageLabel(n, unit)}`;

function parseAge(value: string): { n: number; unit: AgeUnit } | null {
  const m = /^environ (\d+) (an|ans|mois)$/.exec(value);
  if (!m) return null;
  return { n: Number(m[1]), unit: m[2] === "mois" ? "mois" : "ans" };
}

// Bouton radio présenté comme un grand bouton (contrôle segmenté)
function SegmentChoice({
  name, value, label, defaultChecked,
}: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className={clsx(
          "flex min-h-12 items-center justify-center rounded-xl border-2 border-night-900/10 bg-white px-2 py-2 text-center text-sm font-medium transition hover:bg-night-900/5",
          "peer-checked:border-amber-deep peer-checked:bg-amber-glow/15",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-deep"
        )}
      >
        {label}
      </span>
    </label>
  );
}

// Couleurs proposées (pastilles). La valeur envoyée au serveur est le texte en minuscules, joint en français.
const COLOR_CHIPS = [
  { label: "Noir", swatch: "#1f2937" },
  { label: "Blanc", swatch: "#ffffff" },
  { label: "Gris", swatch: "#9ca3af" },
  { label: "Roux", swatch: "#e07b39" },
  { label: "Tigré", swatch: "repeating-linear-gradient(45deg,#b45309 0 4px,#3b2f2f 4px 8px)" },
  { label: "Écaille de tortue", swatch: "linear-gradient(135deg,#1f2937 50%,#e07b39 50%)" },
  { label: "Tricolore", swatch: "linear-gradient(90deg,#ffffff 33%,#e07b39 33% 66%,#1f2937 66%)" },
  { label: "Siamois", swatch: "#d6c4a8" },
] as const;

function joinFr(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// Relit une valeur de brouillon (« noir et blanc ») pour recocher les pastilles
function parseColors(value: string) {
  const known = new Map<string, string>(COLOR_CHIPS.map((c) => [c.label.toLowerCase(), c.label]));
  const colors: string[] = [];
  const others: string[] = [];
  for (const raw of value.split(/, | et /)) {
    const t = raw.trim();
    if (!t) continue;
    const match = known.get(t.toLowerCase());
    if (match) {
      if (!colors.includes(match)) colors.push(match);
    } else {
      others.push(t);
    }
  }
  return { colors, other: others.join(", ") };
}

const SIGNS = [
  "oreille coupée", "yeux bleus", "queue courte", "poil long",
  "tache blanche", "craintif", "câlin", "boite",
] as const;

// Position d'une expression dans le texte (mot entier, sans tenir compte de la casse), ou -1
function findSign(text: string, phrase: string) {
  const lower = text.toLowerCase();
  const isLetter = (c?: string) => !!c && /[a-zà-ÿœæ]/i.test(c);
  let from = 0;
  for (;;) {
    const i = lower.indexOf(phrase, from);
    if (i < 0) return -1;
    if (!isLetter(lower[i - 1]) && !isLetter(lower[i + phrase.length])) return i;
    from = i + 1;
  }
}

// Retire l'expression et nettoie les virgules autour
function removeSign(text: string, phrase: string) {
  const i = findSign(text, phrase);
  if (i < 0) return text;
  const before = text.slice(0, i).replace(/[,;]\s*$/, "");
  let after = text.slice(i + phrase.length);
  if (!before.trim()) after = after.replace(/^\s*[,;]\s*/, "");
  const next = `${before}${after}`.replace(/\s{2,}/g, " ").trim();
  return before.trim() ? next : next.charAt(0).toUpperCase() + next.slice(1);
}

// Case à cocher présentée comme une pastille
function ToggleChip({ name, label }: { name: string; label: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} className="peer sr-only" />
      <span
        className={clsx(
          "inline-flex min-h-11 items-center rounded-full border-2 border-night-900/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-night-900/5",
          "peer-checked:border-amber-deep peer-checked:bg-amber-glow/15 peer-checked:before:mr-1 peer-checked:before:content-['✓']",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-deep"
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
  const [eventDate, setEventDate] = useState("");
  const [age, setAge] = useState(""); // valeur envoyée dans le champ caché ageApprox
  const [preciseAge, setPreciseAge] = useState(false);
  const [ageN, setAgeN] = useState(3);
  const [ageUnit, setAgeUnit] = useState<AgeUnit>("ans");
  const [status, setStatus] = useState<"PERDU" | "TROUVE">("PERDU");
  const [sex, setSex] = useState<"MALE" | "FEMELLE" | "INCONNU">("INCONNU");
  const [colors, setColors] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherColor, setOtherColor] = useState("");

  // Valeur envoyée dans le champ caché « color » (80 caractères max, comme le schéma)
  const colorValue = joinFr([
    ...colors.map((c) => c.toLowerCase()),
    ...(otherOpen && otherColor.trim() ? [otherColor.trim().toLowerCase()] : []),
  ]).slice(0, 80);

  const toggleColor = (label: string) =>
    setColors((cur) => (cur.includes(label) ? cur.filter((c) => c !== label) : [...cur, label]));

  // Copie du texte de la description : sert à savoir quelles pastilles sont actives
  const [description, setDescription] = useState("");

  // Ajoute l'expression à la description, ou la retire si elle y est déjà ; saveDraft garde le brouillon à jour
  const toggleSign = (phrase: string) => {
    const el = formRef.current?.elements.namedItem("description");
    if (!(el instanceof HTMLTextAreaElement)) return;
    const cur = el.value.trim();
    if (findSign(cur, phrase) >= 0) {
      el.value = removeSign(cur, phrase);
    } else {
      el.value = cur
        ? `${cur}${/[.!?,;]$/.test(cur) ? " " : ", "}${phrase}`
        : phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }
    setDescription(el.value);
    saveDraft();
  };

  const chooseAge = (value: string) => {
    setPreciseAge(false);
    setAge((cur) => (cur === value ? "" : value)); // un second appui désélectionne (champ facultatif)
  };
  const openPrecise = () => {
    setPreciseAge(true);
    setAge(formatAge(ageN, ageUnit));
  };
  const setPrecise = (n: number, unit: AgeUnit) => {
    const clamped = Math.min(Math.max(n, 1), AGE_MAX[unit]);
    setAgeN(clamped);
    setAgeUnit(unit);
    setAge(formatAge(clamped, unit));
  };
  const clearAge = () => {
    setAge("");
    setPreciseAge(false);
  };

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
        // Un brouillon ancien peut contenir une position hors zone : on l'ignore
        setPosition(d.position && isInZone(d.position.lat, d.position.lng) ? d.position : null);
        setStep(Math.min(Math.max(d.step ?? 0, 0), LAST));
        // Champs pilotés par l'état React : on réaligne l'interface sur le brouillon
        const f = d.fields ?? {};
        if (typeof f.eventDate === "string") setEventDate(f.eventDate);
        if (typeof f.ageApprox === "string") {
          setAge(f.ageApprox);
          const parsed = parseAge(f.ageApprox);
          if (parsed) {
            setAgeN(parsed.n);
            setAgeUnit(parsed.unit);
            setPreciseAge(true);
          }
        }
        if (typeof f.description === "string") setDescription(f.description);
        if (f.status === "TROUVE") setStatus("TROUVE");
        if (f.sex === "MALE" || f.sex === "FEMELLE") setSex(f.sex);
        if (typeof f.color === "string" && f.color) {
          const parsed = parseColors(f.color);
          setColors(parsed.colors);
          if (parsed.other) {
            setOtherColor(parsed.other);
            setOtherOpen(true);
          }
        }
      }
    } catch {
      /* brouillon illisible : on repart de zéro */
    }
    setReady(true);
  }, []);

  // Sauvegarde quand photos / position / étape changent (une fois le brouillon relu)
  useEffect(() => {
    if (ready) saveDraft();
  }, [ready, saveDraft, eventDate, age, colorValue]);

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
    if (n === 0) {
      if (!position) {
        setFormError("Indiquez où le chat a été vu pour la dernière fois (clic sur la carte ou recherche d'adresse).");
        return false;
      }
      if (!isInZone(position.lat, position.lng)) {
        setFormError(`Les annonces sont réservées à ${ZONE.label}.`);
        return false;
      }
    }
    if (n === 1) {
      // Le champ « color » est caché (non validé par le navigateur) et une description complétée par les
      // pastilles : la longueur minimale est contrôlée à la main, comme le fait le serveur.
      if (colorValue.trim().length < 2) {
        setFormError("Choisissez au moins une couleur (ou décrivez-la avec « Autre »).");
        return false;
      }
      const el = form.elements.namedItem("description");
      if (el instanceof HTMLTextAreaElement && el.value.trim().length < 3) {
        setFormError("Décrivez brièvement le chat (utilisez les pastilles ou écrivez quelques mots).");
        return false;
      }
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

  /* ---------- Récapitulatif ---------- */

  const goTo = (n: number) => {
    setFormError(null);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sexLabel = { MALE: "Mâle", FEMELLE: "Femelle", INCONNU: "Sexe inconnu" }[sex];
  const dateLabel = eventDate
    ? new Date(`${eventDate}T00:00:00`).toLocaleDateString("fr-FR", { dateStyle: "long" })
    : "—";
  const recap = [
    { label: "Annonce", value: status === "TROUVE" ? "Chat trouvé" : "Chat perdu", step: 0 },
    { label: status === "TROUVE" ? "Découvert le" : "Disparu le", value: dateLabel, step: 0 },
    { label: "Lieu", value: position ? "Position choisie sur la carte" : "—", step: 0 },
    { label: "Le chat", value: [colorValue, sexLabel, age].filter(Boolean).join(" · ") || "—", step: 1 },
    { label: "Photos", value: `${photos.length} photo${photos.length > 1 ? "s" : ""}`, step: 2 },
  ];

  /* ---------- Rendu ---------- */

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={(e) => {
        const t: EventTarget = e.target;
        if (t instanceof HTMLTextAreaElement && t.name === "description") setDescription(t.value);
        if (t instanceof HTMLInputElement) {
          if (t.name === "status") setStatus(t.value === "TROUVE" ? "TROUVE" : "PERDU");
          if (t.name === "sex") setSex(t.value === "MALE" || t.value === "FEMELLE" ? t.value : "INCONNU");
        }
        saveDraft();
      }}
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

        <Field
          label={status === "TROUVE" ? "Date de la découverte" : "Date de la disparition"}
          name="eventDate"
          error={err("eventDate")}
          hint="Touchez un raccourci, ou choisissez une autre date."
        >
          <div role="group" aria-label="Raccourcis de date" className="mt-2 flex flex-wrap gap-2">
            {DATE_CHIPS.map(({ label, ago }) => {
              const value = today ? shiftDay(today, ago) : "";
              const active = !!value && eventDate === value;
              return (
                <button key={ago} type="button" disabled={!today} aria-pressed={active}
                  onClick={() => setEventDate(value)} className={chip(active)}>
                  {label}
                </button>
              );
            })}
          </div>
          <input
            id="eventDate" name="eventDate" type="date" required max={today || undefined}
            value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            aria-describedby={describedBy("eventDate")} className={input}
          />
        </Field>

        <div>
          <p className="block text-sm font-medium">Où ? <span className="font-normal text-night-800/60">(dernier lieu connu)</span></p>
          <p className="mb-2 text-xs text-night-800/60">
            Annonces réservées à {ZONE.label}. Cherchez une rue ou cliquez sur la carte. La position sera floutée (≈ 100 m) avant publication.
          </p>
          <LocationPicker
            value={position}
            onChange={(p) => { setPosition(p); setFormError(null); }}
          />
          <input type="hidden" name="lat" value={position?.lat ?? ""} />
          <input type="hidden" name="lng" value={position?.lng ?? ""} />
        </div>
      </fieldset>

      {/* Étape 2 — Le chat */}
      <fieldset data-step="1" hidden={step !== 1} className="space-y-5">
        <legend className="sr-only">Le chat</legend>

        {status === "PERDU" && (
          <Field label="Nom (facultatif)" name="catName" error={err("catName")}>
            <input id="catName" name="catName" maxLength={50} autoCapitalize="words" enterKeyHint="next"
              aria-describedby={describedBy("catName")} className={input} />
          </Field>
        )}

        <fieldset>
          <legend className="text-sm font-medium">Sexe</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <SegmentChoice name="sex" value="MALE" label="♂ Mâle" />
            <SegmentChoice name="sex" value="FEMELLE" label="♀ Femelle" />
            <SegmentChoice name="sex" value="INCONNU" label="Je ne sais pas" defaultChecked />
          </div>
          {err("sex") && <p role="alert" className="mt-1 text-sm text-alert">{err("sex")}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Couleur et robe</legend>
          <p className="text-xs text-night-800/60">Touchez une ou plusieurs couleurs.</p>
          <input type="hidden" name="color" value={colorValue} />
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_CHIPS.map(({ label, swatch }) => {
              const active = colors.includes(label);
              return (
                <button key={label} type="button" aria-pressed={active} onClick={() => toggleColor(label)}
                  className={clsx(chip(active), "inline-flex items-center gap-2")}>
                  <span aria-hidden className="size-4 shrink-0 rounded-full border border-night-900/20"
                    style={{ background: swatch }} />
                  {label}
                </button>
              );
            })}
            <button type="button" aria-pressed={otherOpen} onClick={() => setOtherOpen((o) => !o)} className={chip(otherOpen)}>
              Autre
            </button>
          </div>
          {otherOpen && (
            <div className="mt-3">
              <label htmlFor="colorOther" className="sr-only">Autre couleur ou robe</label>
              <input id="colorOther" value={otherColor} onChange={(e) => setOtherColor(e.target.value)}
                maxLength={40} placeholder="ex. bleu russe, gris tigré…" enterKeyHint="next" className={input} />
            </div>
          )}
          {err("color") && <p role="alert" className="mt-1 text-sm text-alert">{err("color")}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Âge approximatif (facultatif)</legend>
          <input type="hidden" name="ageApprox" value={age} />

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AGE_PRESETS.map((preset) => (
              <button key={preset} type="button" aria-pressed={age === preset}
                onClick={() => chooseAge(preset)} className={chip(age === preset)}>
                {preset}
              </button>
            ))}
          </div>

          {preciseAge ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-cream-100 p-3">
              <button type="button" aria-label="Diminuer l'âge" disabled={ageN <= 1}
                onClick={() => setPrecise(ageN - 1, ageUnit)} className={stepBtn}>
                <Minus className="size-5" aria-hidden />
              </button>
              <output aria-live="polite" className="min-w-20 text-center text-lg font-semibold">
                {ageN} {ageLabel(ageN, ageUnit)}
              </output>
              <button type="button" aria-label="Augmenter l'âge" disabled={ageN >= AGE_MAX[ageUnit]}
                onClick={() => setPrecise(ageN + 1, ageUnit)} className={stepBtn}>
                <Plus className="size-5" aria-hidden />
              </button>
              <div role="group" aria-label="Unité de l'âge" className="ml-auto flex gap-2">
                {(["mois", "ans"] as const).map((u) => (
                  <button key={u} type="button" aria-pressed={ageUnit === u}
                    onClick={() => setPrecise(ageN, u)} className={chip(ageUnit === u)}>
                    {u === "mois" ? "Mois" : "Ans"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" onClick={openPrecise}
              className="mt-3 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep">
              Préciser l'âge
            </button>
          )}

          {age && (
            <button type="button" onClick={clearAge}
              className="ml-4 mt-3 text-sm text-night-800/70 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep">
              Effacer
            </button>
          )}
          {err("ageApprox") && <p role="alert" className="mt-1 text-sm text-alert">{err("ageApprox")}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Identification</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <ToggleChip name="hasChip" label="Pucé" />
            <ToggleChip name="isTattooed" label="Tatoué" />
            <ToggleChip name="isCollared" label="Porte un collier" />
          </div>
        </fieldset>

        <Field
          label="Description et signes distinctifs"
          name="description"
          error={err("description")}
          hint="Caractère, taches, oreille coupée, comportement… Touchez les pastilles ou écrivez quelques mots."
        >
          <div role="group" aria-label="Ajouter un signe distinctif" className="mt-2 flex flex-wrap gap-2">
            {SIGNS.map((sign) => {
              const active = findSign(description, sign) >= 0;
              return (
                <button key={sign} type="button" aria-pressed={active} aria-label={sign}
                  onClick={() => toggleSign(sign)} className={chip(active)}>
                  {active ? "✓" : "+"} {sign}
                </button>
              );
            })}
          </div>
          <textarea id="description" name="description" required maxLength={1500} rows={5}
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
              autoCapitalize="words" enterKeyHint="next" aria-describedby={describedBy("contactName")} className={input} />
          </Field>
          <Field label="Votre email" name="contactEmail" error={err("contactEmail")}>
            <input id="contactEmail" name="contactEmail" type="email" required autoComplete="email"
              inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next"
              aria-describedby={describedBy("contactEmail")} className={input} />
          </Field>
        </div>

        <Field label="Téléphone (facultatif)" name="contactPhone" error={err("contactPhone")}>
          <input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" maxLength={20} autoComplete="tel"
            enterKeyHint="done" aria-describedby={describedBy("contactPhone")} className={input} />
        </Field>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-night-900/10 bg-white p-3">
          <span className="text-sm">Afficher mon téléphone sur l'annonce et l'affiche</span>
          <input type="checkbox" name="showPhone" role="switch" className="peer sr-only" />
          <span aria-hidden
            className={clsx(
              "relative h-7 w-12 shrink-0 rounded-full bg-night-900/20 transition",
              "peer-checked:bg-amber-deep peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-deep",
              "after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5"
            )} />
        </label>

        {step === LAST && (
          <section aria-labelledby="recap-title" className="rounded-2xl border-2 border-night-900/10 bg-white p-4">
            <h2 id="recap-title" className="text-sm font-semibold">Vérifiez votre annonce</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {recap.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div>
                    <dt className="text-night-800/60">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                  <button type="button" onClick={() => goTo(row.step)}
                    className="shrink-0 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep">
                    Modifier
                  </button>
                </div>
              ))}
            </dl>
            {photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {photos.slice(0, 4).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="size-14 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </section>
        )}

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
      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-night-900/10 bg-white/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
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