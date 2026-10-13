import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import clsx from "clsx";

export default function CenterNav() {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-wrap items-center justify-center gap-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => (
          <li key={href}>
            <Link
              href={href}
              className={clsx(
                "group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-glow",
                primary
                  ? "bg-amber-glow text-night-950 shadow-lg shadow-amber-glow/20 animate-pulse-ring hover:bg-amber-deep hover:text-white"
                  : "border border-white/25 bg-white/10 text-cream-50 backdrop-blur-md hover:bg-white/20"
              )}
            >
              <Icon className="size-4 transition-transform group-hover:scale-110" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
