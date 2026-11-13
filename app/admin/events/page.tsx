import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { addEventAction, deleteEventAction } from "../actions";
import { inputClass, labelClass } from "@/components/form-controls";
import type { MarketEvent } from "@/lib/types";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("scheduled_at", { ascending: true })
    .returns<MarketEvent[]>();
  const events = data ?? [];

  return (
    <div className="grid gap-12 lg:grid-cols-[20rem_1fr]">
      <form action={addEventAction} className="space-y-4">
        <h2 className="border-t-2 border-gold-400 pt-4 font-display text-xl">
          Add an event
        </h2>
        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={80}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="scheduled_at" className={labelClass}>
            Date &amp; time
          </label>
          <input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={80}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={400}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-pine-700 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
        >
          Add event
        </button>
      </form>

      <div>
        <h2 className="font-display text-xl">Programme</h2>
        {events.length === 0 ? (
          <p className="mt-4 text-ink/70">No events yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-ink/10 pt-4"
              >
                <time
                  dateTime={event.scheduled_at}
                  className="text-sm text-berry-600"
                >
                  {formatDateTime(event.scheduled_at)}
                </time>
                <span className="font-medium">{event.title}</span>
                {event.location && (
                  <span className="text-sm text-ink/60">
                    {event.location}
                  </span>
                )}
                <form action={deleteEventAction} className="ml-auto">
                  <input type="hidden" name="id" value={event.id} />
                  <button
                    type="submit"
                    className="text-sm text-berry-700 underline underline-offset-2"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
