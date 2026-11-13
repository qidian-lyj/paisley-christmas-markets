import { createClient } from "@/lib/supabase/server";
import { CategoryChip } from "@/components/badges";
import { deleteStallAction, toggleStallAction } from "../actions";
import type { Stall } from "@/lib/types";

export default async function AdminStallsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stalls")
    .select("*")
    .order("name", { ascending: true })
    .returns<Stall[]>();
  const stalls = data ?? [];

  return (
    <div>
      <h2 className="font-display text-2xl">Stalls</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Approved stalls are listed on the public Traders page. Accepting an
        application creates a listing automatically.
      </p>

      {stalls.length === 0 ? (
        <p className="mt-8 text-ink/70">
          No stalls yet — approve an application to create the first listing.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {stalls.map((stall) => (
            <li
              key={stall.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4"
            >
              <span className="font-medium">{stall.name}</span>
              <CategoryChip category={stall.category} />
              <span
                className={`text-xs ${stall.approved ? "text-pine-800" : "text-ink/50"}`}
              >
                {stall.approved ? "Listed publicly" : "Hidden"}
              </span>
              <div className="ml-auto flex gap-2">
                <form action={toggleStallAction}>
                  <input type="hidden" name="id" value={stall.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-ink/20 px-3 py-1.5 text-sm transition-colors hover:border-ink/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pine-700"
                  >
                    {stall.approved ? "Hide" : "Publish"}
                  </button>
                </form>
                <form action={deleteStallAction}>
                  <input type="hidden" name="id" value={stall.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-berry-600/50 px-3 py-1.5 text-sm text-berry-700 transition-colors hover:bg-berry-600/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-berry-600"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
