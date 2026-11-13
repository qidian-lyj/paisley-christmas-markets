import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth-actions";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "What's on" },
  { href: "/traders", label: "Traders" },
  { href: "/apply", label: "Apply for a stall" },
] as const;

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = (profileRow as { role: string } | null)?.role === "admin";
  }

  return (
    <header className="border-b-4 border-berry-600 bg-pine-950 text-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
        <Link
          href="/"
          className="font-display text-lg text-gold-300 sm:text-xl"
        >
          Paisley Christmas Markets
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-paper/80">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-gold-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-md bg-gold-400 px-3 py-1.5 font-medium text-pine-950 transition-colors hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="text-paper/80 transition-colors hover:text-gold-300"
              >
                Account
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-paper/80 transition-colors hover:text-gold-300"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-paper/80 transition-colors hover:text-gold-300"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-berry-600 px-3 py-1.5 font-medium text-paper transition-colors hover:bg-berry-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
