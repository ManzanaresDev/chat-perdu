import Link from "next/link";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export default function CenterNav() {
  return (
    <nav aria-label="Navigation principale">
      <ul
        className={clsx(
          // mobile : colonne centrée, largeur contrôlée
          "mx-auto flex w-full max-w-xs flex-col items-stretch gap-2.5",
          // ≥ sm : pilules sur une ligne
          "sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
        )}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => (
          <li key={href} className="sm:w-auto">
            <Link
              href={href}
              className={clsx(
                "group flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-base font-medium transition",
                "sm:inline-flex sm:w-auto sm:py-3 sm:text-sm",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-glow",
                primary
                  ? "bg-amber-glow text-night-950 shadow-lg shadow-amber-glow/20 animate-pulse-ring hover:bg-amber-deep hover:text-white"
                  : "border border-white/25 bg-white/10 text-cream-50 backdrop-blur-md hover:bg-white/20"
              )}
            >
              <Icon className="size-5 sm:size-4 transition-transform group-hover:scale-110" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}