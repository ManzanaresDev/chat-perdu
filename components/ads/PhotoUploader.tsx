"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { resizeImage } from "@/lib/image";

const MAX = 4;

type Props = { value: string[]; onChange: (urls: string[]) => void };

async function upload(file: File): Promise<string> {
  const resized = await resizeImage(file); // redimensionne + supprime les métadonnées EXIF
  const body = new FormData();
  body.set("file", resized);
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Échec de l'envoi");
  return data.url;
}

export default function PhotoUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const room = MAX - value.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`${MAX} photos maximum : les suivantes ont été ignorées.`);

    setBusy(picked.length);
    const added: string[] = [];
    for (const file of picked) {
      try {
        added.push(await upload(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (from: number, to: number) => {
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <li key={url} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-100">
                <Image src={url} alt={`Photo ${i + 1}`} fill sizes="(min-width: 640px) 160px, 45vw" className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-night-900/80 px-2 py-0.5 text-xs text-white">
                    Principale
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                    aria-label={`Déplacer la photo ${i + 1} vers la gauche`}
                    className="grid size-9 place-items-center rounded-full hover:bg-night-900/5 disabled:opacity-30">
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}
                    aria-label={`Déplacer la photo ${i + 1} vers la droite`}
                    className="grid size-9 place-items-center rounded-full hover:bg-night-900/5 disabled:opacity-30">
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  aria-label={`Supprimer la photo ${i + 1}`}
                  className="grid size-9 place-items-center rounded-full text-alert hover:bg-alert/10">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length + busy < MAX && (
        <div>
          <input
            ref={inputRef}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="sr-only"
          />
          <label
            htmlFor="photos"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-night-900/20 p-8 text-center transition hover:border-amber-deep hover:bg-amber-glow/5 has-[:focus-visible]:outline-2"
          >
            <ImagePlus className="size-8 text-amber-deep" aria-hidden />
            <span className="font-medium">Ajouter des photos</span>
            <span className="text-xs text-night-800/60">{value.length}/{MAX} · JPEG, PNG ou WebP</span>
          </label>
        </div>
      )}

      {busy > 0 && <p role="status" className="text-sm text-night-800/70">Envoi de {busy} photo{busy > 1 ? "s" : ""}…</p>}
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    </div>
  );
}
