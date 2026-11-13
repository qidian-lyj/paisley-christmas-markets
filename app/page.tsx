import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Market } from "@/lib/types";

const sectionRule = "border-t-2 border-gold-400 pt-4";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("markets")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .returns<Market[]>();
  const market = data?.[0];

  const dates = market
    ? `${formatDate(market.start_date)} – ${formatDate(market.end_date)}`
    : "December 2026";
  const location = market?.location ?? "Paisley town centre";

  return (
    <>
      <section className="bg-pine-950 text-paper">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
          <p className="text-sm text-gold-300">
            {location}, {dates}
          </p>
          <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl leading-tight sm:text-6xl">
            {market?.title ?? "Paisley Christmas Markets"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-paper/80">
            {market?.description ??
              "A traditional German-style Christmas market in the heart of Paisley."}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className="rounded-md bg-berry-600 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-berry-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              Apply for a stall
            </Link>
            <Link
              href="/events"
              className="rounded-md border border-gold-400/60 px-6 py-3 text-sm font-medium text-gold-300 transition-colors hover:border-gold-400 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              See what&apos;s on
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl sm:text-3xl">Plan your visit</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div className={sectionRule}>
            <h3 className="font-display text-lg">Dates &amp; times</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              {dates}. Open daily from 10am to 8pm, and entry is free — just
              turn up and follow the lights.
            </p>
          </div>
          <div className={sectionRule}>
            <h3 className="font-display text-lg">Where to find us</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              {location}, two minutes from Gilmour Street station. Bus stops on
              Gauze Street serve every route into town.
            </p>
          </div>
          <div className={sectionRule}>
            <h3 className="font-display text-lg">The programme</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Lights switch-on, carol concerts, Santa&apos;s grotto and a
              mulled wine masterclass.
            </p>
            <Link
              href="/events"
              className="mt-2 inline-block text-sm text-berry-700 underline underline-offset-2"
            >
              View the full programme
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-pine-900 text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">
              Sell your wares this December
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-paper/75">
              We&apos;re looking for street food traders, artisans and craft
              makers. Pitches start at £30 for a 3×3 m stall, applications are
              reviewed within five working days, and everything is handled
              online.
            </p>
          </div>
          <Link
            href="/apply"
            className="justify-self-start rounded-md bg-gold-400 px-6 py-3 text-sm font-medium text-pine-950 transition-colors hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 lg:justify-self-end"
          >
            Apply for a stall
          </Link>
        </div>
      </section>
    </>
  );
}
