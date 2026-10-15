"use client";

import { useEffect } from "react";
import { DRAFT_KEY } from "@/lib/utils";

/** Efface le brouillon du formulaire une fois l'annonce envoyée. */
export default function ClearDraft() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignoré */
    }
  }, []);
  return null;
}
