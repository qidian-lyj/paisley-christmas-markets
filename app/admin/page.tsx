import { createClient } from "@/lib/supabase/server";
import { CategoryChip, StatusBadge } from "@/components/badges";
import { formatDateTime } from "@/lib/format";
import { reviewApplicationAction } from "./actions";
import type { Application } from "@/lib/types";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Application[]>();
  const applications = data ?? [];

  const pending = applications.filter(
    (application) => application.status === "pending"
  );
  const reviewed = applications.filter(
    (application) => application.status !== "pending"
  );

  return (
    <div className="space-y-14">
      <section>
        <h2 className="font-display text-2xl">
          Pending review{" "}
          <span className="text-ink/45">({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-ink/70">
            Nothing waiting. New submissions appear here automatically.
          </p>
        ) : (
          <ul className="mt-6 space-y-8">
            {pending.map((application) => (
              <li
                key={application.id}
                className="border-t border-ink/10 pt-6"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="font-medium">
                    {application.business_name}
                  </h3>
                  <CategoryChip category={application.category} />
                  <StatusBadge status={application.status} />
                  <span className="text-xs text-ink/55">
                    Submitted {formatDateTime(application.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-4">
                  {application.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={application.image_url}
                      alt={`${application.business_name} photo`}
                      className="h-24 w-36 flex-none rounded-md object-cover"
                    />
                  )}
                  <p className="max-w-3xl leading-relaxed text-ink/75">
                    {application.pitch}
                  </p>
                </div>

                {application.price_info && (
                  <p className="mt-2 text-xs font-medium text-pine-800">
                    Pricing: {application.price_info}
                  </p>
                )}

                <p className="mt-2 text-sm text-ink/60">
                  {application.contact_name},{" "}
                  <a
                    href={`mailto:${application.email}`}
                    className="underline underline-offset-2"
                  >
                    {application.email}
                  </a>
                  {application.phone ? `, ${application.phone}` : null}
                </p>

                <div className="mt-4 flex gap-3">
                  <form action={reviewApplicationAction}>
                    <input type="hidden" name="id" value={application.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="approved"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={reviewApplicationAction}>
                    <input type="hidden" name="id" value={application.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="rejected"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-berry-600 px-4 py-2 text-sm font-medium text-berry-700 transition-colors hover:bg-berry-600/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-600"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">Reviewed</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-xs text-ink/55">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Business
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Category
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-ink/10"
                  >
                    <td className="py-2.5 pr-4 font-medium">
                      {application.business_name}
                    </td>
                    <td className="py-2.5 pr-4">
                      <CategoryChip category={application.category} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="py-2.5 pr-4 text-ink/60">
                      {formatDateTime(application.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
