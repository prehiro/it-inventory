"use client";

import Link from "next/link";

/* ──────────────────────────────────────────
   ReportsPagination — server-side pagination (blue-600)
   ────────────────────────────────────────── */
export function ReportsPagination({
  page,
  totalPages,
  total,
  pageSize,
  query,
  basePath = "/reports",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  query: string;
  basePath?: string;
}) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span>Showing {total.toLocaleString()} row{total === 1 ? "" : "s"}</span>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const makeHref = (p: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(p));
    return `${basePath}?${q.toString()}`;
  };

  // Page number window: current ±2, always include first & last
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
  }
  const dedup: (number | "...")[] = [];
  for (const p of pages) {
    const prev = dedup[dedup.length - 1];
    if (typeof prev === "number" && typeof p === "number" && p - prev > 1) dedup.push("...");
    dedup.push(p);
  }

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition disabled:opacity-40 disabled:cursor-not-allowed";
  const pageBtn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
      active
        ? "bg-blue-600 font-semibold text-white shadow-sm"
        : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-400 dark:text-slate-500">
        Showing <span className="font-medium text-slate-600 dark:text-slate-300">{start.toLocaleString()}</span>–
        <span className="font-medium text-slate-600 dark:text-slate-300">{end.toLocaleString()}</span> of{" "}
        <span className="font-medium text-slate-600 dark:text-slate-300">{total.toLocaleString()}</span> rows
      </span>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <Link
          href={makeHref(page - 1)}
          aria-disabled={page <= 1}
          className={`${navBtn} border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        {dedup.map((p, i) =>
          typeof p === "number" ? (
            <Link key={p} href={makeHref(p)} className={pageBtn(p === page)} aria-current={p === page ? "page" : undefined}>
              {p}
            </Link>
          ) : (
            <span key={`e-${i}`} className="px-1 text-sm text-slate-400">
              …
            </span>
          )
        )}

        <Link
          href={makeHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={`${navBtn} border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          aria-label="Next page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </nav>
    </div>
  );
}
