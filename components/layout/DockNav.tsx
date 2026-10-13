"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export default function DockNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-4 z-50 hidden sm:flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-center gap-1 rounded-full border border-white/20 bg-night-900/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <li>
          <Link
            href="/"
            aria-label="Accueil"
            className="grid size-10 place-items-center rounded-full text-lg text-cream-50 hover:bg-white/10"
          >
            🐾
          </Link>
        </li>
        {NAV_ITEMS.map(({ href, short, icon: Icon, primary }) => {
          const active = pathname === href.split("?")[0];
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition sm:px-4",
                  primary && "bg-amber-glow font-semibold text-night-950",
                  !primary && active && "bg-white/15 text-white",
                  !primary && !active && "text-cream-100/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
