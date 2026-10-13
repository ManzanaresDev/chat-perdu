"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu à chaque changement de page
  useEffect(() => setOpen(false), [pathname]);

  // Échap pour fermer + blocage du scroll quand ouvert
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      {/* Fond assombri */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={clsx(
          "fixed inset-0 z-40 bg-night-950/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <nav
        id="mobile-menu"
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {/* Panneau vertical */}
        <ul
          className={clsx(
            "mb-3 flex w-full max-w-xs origin-bottom flex-col gap-2 rounded-3xl border border-white/15 bg-night-900/95 p-3 shadow-2xl backdrop-blur-xl transition duration-200",
            open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
          )}
          // inert évite le focus clavier quand le panneau est fermé
          {...(!open && { inert: true })}
        >
          <li>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-base text-cream-50 hover:bg-white/10"
            >
              🐾 Accueil
            </Link>
          </li>
          {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
            const active = pathname === href.split("?")[0];
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-base font-medium transition",
                    primary && "bg-amber-glow text-night-950",
                    !primary && active && "bg-white/15 text-white",
                    !primary && !active && "text-cream-100/90 hover:bg-white/10"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bouton flottant */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-night-900/90 px-6 py-3 text-sm font-medium text-cream-50 shadow-xl backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-glow"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          {open ? "Fermer" : "Menu"}
        </button>
      </nav>
    </div>
  );
}