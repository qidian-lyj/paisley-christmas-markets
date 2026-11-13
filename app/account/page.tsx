import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryChip, StatusBadge } from "@/components/badges";
import { formatDateTime } from "@/lib/format";
import type { Application, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, applicationsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Application[]>(),
  ]);

  const profile = profileResult.data as Profile | null;
  const applications = applicationsResult.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="border-b-2 border-gold-400 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">Your account</h1>
        <p className="mt-3 text-ink/70">
          Signed in as {user.email}
          {profile?.full_name ? ` — ${profile.full_name}` : null}
        </p>
        {profile?.role === "admin" && (
          <p className="mt-2 text-sm">
            <Link
              href="/admin"
              className="text-berry-700 underline underline-offset-2"
            >
              Open the admin dashboard
            </Link>
          </p>
        )}
      </header>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">Your applications</h2>
          <Link
            href="/apply"
            className="text-sm text-berry-700 underline underline-offset-2"
          >
            Apply for another stall
          </Link>
        </div>

        {applications.length === 0 ? (
          <p className="mt-6 text-ink/70">
            You haven&apos;t applied yet.{" "}
            <Link
              href="/apply"
              className="text-berry-700 underline underline-offset-2"
            >
              Apply for a stall
            </Link>{" "}
            to trade at this year&apos;s market.
          </p>
        ) : (
          <ul className="mt-6 space-y-6">
            {applications.map((application) => (
              <li
                key={application.id}
                className="border-t border-ink/10 pt-5"
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
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {application.pitch}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
