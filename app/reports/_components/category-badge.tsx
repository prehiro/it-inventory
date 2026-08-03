/** CategoryBadge — tinted FA / NCA / GENERAL badge (shared by report tables). */
export function CategoryBadge({ category }: { category: string }) {
  const cls =
    category === "FA"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400"
      : category === "NCA"
        ? "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/15 dark:text-purple-400"
        : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {category}
    </span>
  );
}
