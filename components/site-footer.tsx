import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-pine-950 text-paper/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-gold-300">
            Paisley Christmas Markets
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            A traditional German-style Christmas market in the heart of
            Paisley.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-paper">Visit</p>
          <p className="mt-2">4–25 December 2026</p>
          <p>Open daily, 10am–8pm, free entry</p>
          <p>Paisley Abbey &amp; County Square</p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-paper">Traders</p>
          <p className="mt-2">Applications for 2026 are open.</p>
          <Link
            href="/apply"
            className="mt-1 inline-block text-gold-300 underline underline-offset-2"
          >
            Apply for a stall
          </Link>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/50">
          Proof of concept for COMP10020 Internet Technologies, Coursework 2.
          Built with Next.js, Supabase and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
