// app/admin/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, REPORT_REASONS, STATUS_LABEL } from "@/lib/utils";
import { approveAd, dismissReports, refuseAd } from "@/actions/admin";

export const metadata: Metadata = { title: "Modération", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const withPhoto = {
  include: { photos: { orderBy: { order: "asc" as const }, take: 1 } },
};

export default async function AdminPage() {
  const [pending, reported] = await Promise.all([
    prisma.ad.findMany({
      where: { moderation: "EN_ATTENTE" },
      ...withPhoto,
      orderBy: { createdAt: "asc" },
    }),
    prisma.ad.findMany({
      where: { moderation: "APPROUVEE", reports: { some: {} } },
      include: { ...withPhoto.include, reports: { orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Modération</h1>
        <Link href="/" className="text-sm underline underline-offset-4">← Retour au site</Link>
      </header>

      <section aria-labelledby="pending" className="mt-10">
        <h2 id="pending" className="font-display text-2xl">En attente ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-3 text-night-800/70">Rien à modérer. 🎉</p>}

        <ul className="mt-4 space-y-4">
          {pending.map((a) => (
            <li key={a.id} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-night-900/5 sm:flex-row">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-cream-100 sm:w-48">
                {a.photos[0] && <Image src={a.photos[0].url} alt="" fill sizes="192px" className="object-cover" />}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm text-night-800/70">
                  {STATUS_LABEL[a.status].text} · {a.city} ({a.postalCode}) · {formatDate(a.eventDate)}
                </p>
                <h3 className="font-display text-xl">{a.catName || `Chat ${a.color}`}</h3>
                <p className="line-clamp-4 whitespace-pre-line text-sm">{a.description}</p>
                <p className="text-xs text-night-800/60">
                  Contact : {a.contactName} · {a.contactEmail}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <form action={approveAd.bind(null, a.id)}>
                    <button className="rounded-full bg-ok px-5 py-2 text-sm font-semibold text-white">Approuver</button>
                  </form>

                  <form action={refuseAd.bind(null, a.id)} className="flex flex-1 flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`reason-${a.id}`}>Motif du refus</label>
                    <input
                      id={`reason-${a.id}`}
                      name="reason"
                      placeholder="Motif du refus (envoyé par email)"
                      className="min-w-48 flex-1 rounded-xl border border-night-900/15 px-3 py-2 text-sm"
                    />
                    <button className="rounded-full bg-alert px-5 py-2 text-sm font-semibold text-white">Refuser</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reported" className="mt-14">
        <h2 id="reported" className="font-display text-2xl">Annonces signalées ({reported.length})</h2>
        {reported.length === 0 && <p className="mt-3 text-night-800/70">Aucun signalement.</p>}

        <ul className="mt-4 space-y-4">
          {reported.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-night-900/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/annonces/${a.id}`} className="font-display text-xl underline underline-offset-4">
                  {a.catName || `Chat ${a.color}`} — {a.city}
                </Link>
                <span className="rounded-full bg-alert/10 px-3 py-1 text-xs font-semibold text-alert">
                  {a.reports.length} signalement{a.reports.length > 1 ? "s" : ""}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {a.reports.map((r) => (
                  <li key={r.id}>
                    <strong>{REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason}</strong>
                    {r.details ? ` — ${r.details}` : ""}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={dismissReports.bind(null, a.id)}>
                  <button className="rounded-full border border-night-900/20 px-5 py-2 text-sm hover:bg-night-900/5">
                    Garder l'annonce
                  </button>
                </form>
                <form action={refuseAd.bind(null, a.id)} className="flex flex-1 flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`reason-r-${a.id}`}>Motif du retrait</label>
                  <input
                    id={`reason-r-${a.id}`}
                    name="reason"
                    placeholder="Motif du retrait (envoyé par email)"
                    className="min-w-48 flex-1 rounded-xl border border-night-900/15 px-3 py-2 text-sm"
                  />
                  <button className="rounded-full bg-alert px-5 py-2 text-sm font-semibold text-white">Retirer</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}