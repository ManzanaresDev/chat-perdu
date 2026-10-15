// lib/validators.ts
import { z } from "zod";
import { REPORT_REASONS } from "@/lib/utils";

export const adSchema = z.object({
  status: z.enum(["PERDU", "TROUVE"]),
  catName: z.string().trim().max(50).optional(),
  sex: z.enum(["MALE", "FEMELLE", "INCONNU"]),
  color: z.string().trim().min(2, "Décrivez la couleur").max(80),
  ageApprox: z.string().trim().max(50).optional(),
  isTattooed: z.boolean().default(false),
  hasChip: z.boolean().default(false),
  isCollared: z.boolean().default(false),
  description: z
    .string()
    .trim()
    .min(20, "Ajoutez quelques détails (20 caractères min.)")
    .max(1500),
  // La date est comparée au moment de la validation (et non au démarrage du serveur).
  // Tolérance de 24 h : une date « du jour » saisie dans un fuseau en avance sur UTC reste valide.
  eventDate: z.coerce
    .date()
    .refine(
      (d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
      "La date ne peut pas être dans le futur"
    ),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal à 5 chiffres"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  contactName: z.string().trim().min(2).max(80),
  contactEmail: z.email("Email invalide"),
  contactPhone: z.string().trim().max(20).optional(),
  showPhone: z.boolean().default(false),
  consent: z.literal(true, { error: "Consentement requis" }),
  // honeypot : doit rester vide
  website: z.string().max(0).optional(),
});

export type AdInput = z.infer<typeof adSchema>;

/** Champs modifiables par le propriétaire via le lien de gestion. */
export const adUpdateSchema = z.object({
  catName: z.string().trim().max(50).optional(),
  description: z.string().trim().min(20, "20 caractères min.").max(1500),
  contactPhone: z.string().trim().max(20).optional(),
  showPhone: z.boolean().default(false),
});

export const messageSchema = z.object({
  adId: z.cuid(),
  fromName: z.string().trim().min(2).max(80),
  fromEmail: z.email(),
  body: z.string().trim().min(10).max(1000),
});

export const reportSchema = z.object({
  adId: z.cuid(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...(keyof typeof REPORT_REASONS)[]]),
  details: z.string().trim().max(500).optional(),
});
