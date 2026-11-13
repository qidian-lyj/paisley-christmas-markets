import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import type { MarketEvent } from "@/lib/types";

export const metadata: Metadata = { title: "What's on" };

/** Splits the programme into upcoming and already-past events. */
function splitEvents(events: MarketEvent[]) {
  const now = Date.now();
  return {
    upcoming: events.filter(
      (event) => new Date(event.scheduled_at).getTime() >= now
    ),
    past: events.filter(
      (event) => new Date(event.scheduled_at).getTime() < now
    ),
  };
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("scheduled_at", { ascending: true })
    .returns<MarketEvent[]>();

  const { upcoming, past } = splitEvents(data ?? []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="border-b-2 border-gold-400 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">What&apos;s on</h1>
        <p className="mt-3 text-ink/70">
          Carols, lights and grottos — the full programme for the 2026 market.
        </p>
      </header>

      {upcoming.length === 0 ? (
        <p className="mt-10 text-ink/70">
          The programme will be announced soon. Check back closer to December.
        </p>
      ) : (
        <ul className="mt-10 space-y-8">
          {upcoming.map((event) => (
            <li
              key={event.id}
              className="grid gap-1 sm:grid-cols-[16rem_1fr] sm:gap-6"
            >
              <time
                dateTime={event.scheduled_at}
                className="text-sm font-medium text-berry-600"
              >
                {formatDateTime(event.scheduled_at)}
              </time>
              <div>
                <h2 className="font-display text-xl">{event.title}</h2>
                {event.description && (
                  <p className="mt-1 leading-relaxed text-ink/75">
                    {event.description}
                  </p>
                )}
                {event.location && (
                  <p className="mt-1 text-sm text-ink/60">{event.location}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl text-ink/60">
            Earlier in the market
          </h2>
          <ul className="mt-5 space-y-5 text-ink/60">
            {past.map((event) => (
              <li
                key={event.id}
                className="grid gap-1 sm:grid-cols-[16rem_1fr] sm:gap-6"
              >
                <time
                  dateTime={event.scheduled_at}
                  className="text-sm font-medium"
                >
                  {formatDateTime(event.scheduled_at)}
                </time>
                <div>
                  <h3 className="font-display text-lg">{event.title}</h3>
                  {event.location && (
                    <p className="mt-0.5 text-sm">{event.location}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
