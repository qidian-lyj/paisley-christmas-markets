import {
  CATEGORY_LABELS,
  type ApplicationStatus,
  type TraderCategory,
} from "@/lib/types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    pending: "border-gold-400 bg-gold-300/40 text-ink",
    approved: "border-pine-700/50 bg-pine-700/10 text-pine-800",
    rejected: "border-berry-600/40 bg-berry-600/10 text-berry-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function CategoryChip({ category }: { category: TraderCategory }) {
  return (
    <span className="inline-flex items-center rounded-full border border-pine-900/15 bg-white px-2.5 py-0.5 text-xs text-pine-800">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
