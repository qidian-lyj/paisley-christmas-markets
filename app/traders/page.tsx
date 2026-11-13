import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, TRADER_CATEGORIES, type Stall } from "@/lib/types";

export const metadata: Metadata = { title: "Traders" };

export default async function TradersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stalls")
    .select("*")
    .eq("approved", true)
    .order("name", { ascending: true })
    .returns<Stall[]>();
  const stalls = data ?? [];

  const groups = TRADER_CATEGORIES.map((category) => ({
    category,
    stalls: stalls.filter((stall) => stall.category === category),
  })).filter((group) => group.stalls.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="border-b-2 border-gold-400 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">
          Meet the traders
        </h1>
        <p className="mt-3 text-ink/70">
          Every stall at the 2026 market, from Glühwein to hand-blown glass.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="mt-10 max-w-2xl text-ink/70">
          Stalls for 2026 are still being confirmed. Thinking of joining them?{" "}
          <Link
            href="/apply"
            className="text-berry-700 underline underline-offset-2"
          >
            Apply for a stall
          </Link>
          .
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="mt-12">
            <h2 className="border-b border-gold-400 pb-2 font-display text-xl">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {group.stalls.map((stall) => (
                <div key={stall.id}>
                  {stall.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stall.image_url}
                      alt={`${stall.name} stall`}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="mt-3 font-medium">{stall.name}</h3>
                  {stall.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {stall.description}
                    </p>
                  )}
                  {(stall.price_info || stall.contact_email || stall.contact_phone) && (
                    <div className="mt-2 flex flex-col gap-1 text-xs">
                      {stall.price_info && (
                        <p className="font-medium text-pine-800">{stall.price_info}</p>
                      )}
                      {(stall.contact_email || stall.contact_phone) && (
                        <p className="text-ink/55">
                          {stall.contact_email && (
                            <a
                              href={`mailto:${stall.contact_email}`}
                              className="underline-offset-2 hover:text-berry-700 hover:underline"
                            >
                              {stall.contact_email}
                            </a>
                          )}
                          {stall.contact_email && stall.contact_phone ? " — " : null}
                          {stall.contact_phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
