import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  params: { statut?: string; ville?: string };
};

function href(page: number, { statut, ville }: Props["params"]) {
  const q = new URLSearchParams();
  if (statut) q.set("statut", statut);
  if (ville) q.set("ville", ville);
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `/annonces?${qs}` : "/annonces";
}

/** Fenêtre de pages autour de la page courante : 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, params }: Props) {
  if (totalPages <= 1) return null;

  const base = "grid size-10 place-items-center rounded-full text-sm transition";

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1, params)} aria-label="Page précédente" className={clsx(base, "hover:bg-night-900/5")}>
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : (
            <span aria-hidden className={clsx(base, "opacity-30")}>
              <ChevronLeft className="size-5" />
            </span>
          )}
        </li>

        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-night-800/50">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p, params)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={clsx(base, p === page ? "bg-night-900 font-semibold text-white" : "hover:bg-night-900/5")}
              >
                {p}
              </Link>
            </li>
          )
        )}

        <li>
          {page < totalPages ? (
            <Link href={href(page + 1, params)} aria-label="Page suivante" className={clsx(base, "hover:bg-night-900/5")}>
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : (
            <span aria-hidden className={clsx(base, "opacity-30")}>
              <ChevronRight className="size-5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
