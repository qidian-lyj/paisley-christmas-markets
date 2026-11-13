import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApplicationForm } from "@/components/application-form";

export const metadata: Metadata = { title: "Apply for a stall" };

const infoRule = "border-t-2 border-gold-400 pt-4";

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="border-b-2 border-gold-400 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">
          Apply for a stall
        </h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Sell your food, drink, crafts or gifts to thousands of visitors
          across three festive weeks in Paisley.
        </p>
      </header>

      {user ? (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_17rem]">
          <ApplicationForm />
          <aside className="space-y-6 text-sm">
            <div className={infoRule}>
              <h2 className="font-display text-lg">Stall fee</h2>
              <p className="mt-1 leading-relaxed text-ink/70">
                £30 for a 3×3 m pitch, payable once your application is
                approved.
              </p>
            </div>
            <div className={infoRule}>
              <h2 className="font-display text-lg">Key dates</h2>
              <p className="mt-1 leading-relaxed text-ink/70">
                Applications close on 20 November. We review within five
                working days.
              </p>
            </div>
            <div className={infoRule}>
              <h2 className="font-display text-lg">What happens next</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed text-ink/70">
                <li>Submit this form.</li>
                <li>The market team reviews your application.</li>
                <li>Track the decision on your account page.</li>
                <li>Approved stalls appear on the Traders page.</li>
              </ol>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-10 max-w-2xl border-t-2 border-gold-400 pt-8">
          <p className="leading-relaxed text-ink/75">
            Traders apply with an account, so you can track your application
            and your approved stall stays linked to you. Log in or create an
            account — it takes a minute.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-md bg-berry-600 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-berry-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-600"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-pine-900/25 px-5 py-2.5 text-sm font-medium transition-colors hover:border-pine-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
            >
              Create an account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
