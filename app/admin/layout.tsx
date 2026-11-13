import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const tabs = [
  { href: "/admin", label: "Applications" },
  { href: "/admin/stalls", label: "Stalls" },
  { href: "/admin/events", label: "Events" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileRow as Profile | null;

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Market admin</h1>
        <p className="mt-2 text-sm text-ink/70">
          Review trader applications and maintain the site.
        </p>
        <nav className="mt-6 flex gap-1 border-b border-ink/15">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="border-b-2 border-transparent px-3 pb-2 pt-1 text-sm text-ink/70 transition-colors hover:border-gold-400 hover:text-ink"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
