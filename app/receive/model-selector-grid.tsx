"use client";

type Model = { id: string; type: string; model: string; brand: string; category: string };

const CAT_STYLE: Record<string, { gradient: string; border: string; badge: string; iconBg: string; neon: string }> = {
  NCA: {
    gradient: "bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/60 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-800/20",
    border: "border-amber-200/80 hover:border-amber-300 dark:border-amber-700/40 dark:hover:border-amber-600/60",
    badge: "bg-amber-500 text-white dark:bg-amber-600 dark:text-white",
    iconBg: "bg-white/70 text-amber-600 dark:bg-slate-800/60 dark:text-amber-400",
    neon: "rgba(245,158,11,0.55)",
  },
  GENERAL: {
    gradient: "bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/60 dark:from-purple-950/30 dark:via-purple-900/20 dark:to-purple-800/20",
    border: "border-purple-200/80 hover:border-purple-300 dark:border-purple-700/40 dark:hover:border-purple-600/60",
    badge: "bg-purple-500 text-white dark:bg-purple-600 dark:text-white",
    iconBg: "bg-white/70 text-purple-600 dark:bg-slate-800/60 dark:text-purple-400",
    neon: "rgba(147,51,234,0.55)",
  },
  FA: {
    gradient: "bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 dark:from-emerald-950/30 dark:via-emerald-900/20 dark:to-emerald-800/20",
    border: "border-emerald-200/80 hover:border-emerald-300 dark:border-emerald-700/40 dark:hover:border-emerald-600/60",
    badge: "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white",
    iconBg: "bg-white/70 text-emerald-600 dark:bg-slate-800/60 dark:text-emerald-400",
    neon: "rgba(16,185,129,0.55)",
  },
};

export function TypeIcon({ type, className, neon }: { type: string; className?: string; neon?: string }) {
  const cls = className ?? "h-6 w-6";
  const hasBreath = className?.includes("animate-icon-breath");
  const breathStyle = hasBreath ? ({ ["--neon" as string]: neon ?? "rgba(6,111,209,0.55)" } as React.CSSProperties) : undefined;
  switch (type.toUpperCase()) {
    case "PC":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="9" y1="22" x2="15" y2="22" />
          <line x1="12" y1="18" x2="12" y2="20" />
          <rect x="8" y="6" width="8" height="6" rx="1" />
          <circle cx="12" cy="15" r="0.5" />
        </svg>
      );
    case "LAPTOP":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
          <path d="M6 16v-1h12v1" />
        </svg>
      );
    case "TABLET":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="3" />
          <path d="M12 18h.01" />
        </svg>
      );
    case "KEYBOARD":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="12" rx="2" />
          <line x1="6" y1="11" x2="6.01" y2="11" />
          <line x1="10" y1="11" x2="10.01" y2="11" />
          <line x1="14" y1="11" x2="14.01" y2="11" />
          <line x1="18" y1="11" x2="18.01" y2="11" />
          <line x1="6" y1="15" x2="18" y2="15" />
        </svg>
      );
    case "MOUSE":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="3" width="10" height="18" rx="5" />
          <line x1="12" y1="6" x2="12" y2="10" />
          <path d="M12 3a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5z" />
        </svg>
      );
    case "PROJECTOR":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="8" width="20" height="10" rx="2" />
          <circle cx="9" cy="13" r="2.5" />
          <line x1="13" y1="13" x2="20" y2="13" />
          <line x1="6" y1="18" x2="4" y2="22" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="18" y1="18" x2="20" y2="22" />
        </svg>
      );
    case "PRINTER":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 9V3h12v6" />
          <rect x="6" y="14" width="12" height="8" rx="1" />
        </svg>
      );
    case "MONITOR":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "CAMERA":
    case "DIGITAL CAMERA":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "CCTV":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 17v5" />
          <path d="M9 22h6" />
          <path d="M2 12a10 10 0 0 1 20 0" />
          <path d="M5 12h-2" />
          <path d="M21 12h-2" />
        </svg>
      );
    case "AC ADAPTOR":
    case "ADAPTOR":
    case "POWER ADAPTOR":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="2" width="8" height="6" rx="1" />
          <path d="M12 8v2" />
          <rect x="6" y="10" width="12" height="12" rx="2" />
          <line x1="10" y1="14" x2="10" y2="18" />
          <line x1="14" y1="14" x2="14" y2="18" />
        </svg>
      );
    case "KENSINGTON":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 15v7" />
          <path d="M9 22h6" />
          <path d="M12 9V5a4 4 0 0 1 4-4h1" />
          <path d="M8 7l-3 3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

export function ModelSelectorGrid({
  models,
  onSelect,
}: {
  models: Model[];
  onSelect: (id: string) => void;
}) {
  const CATEGORIES = ["NCA", "GENERAL", "FA"];

  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => {
        const items = models.filter((m) => m.category === cat).toSorted((a, b) => {
          const typeCmp = a.type.localeCompare(b.type);
          if (typeCmp !== 0) return typeCmp;
          const brandCmp = a.brand.localeCompare(b.brand);
          if (brandCmp !== 0) return brandCmp;
          return a.model.localeCompare(b.model);
        });
        if (items.length === 0) return null;
        const s = CAT_STYLE[cat];
        return (
          <div key={cat}>
            <div className="mb-2.5 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${s.badge}`}>
                {cat}
              </span>
              <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m.id)}
                  className={`group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] ${s.border} ${s.gradient}`}
                >
                  {/* Text side */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#066fd1] dark:text-slate-100 dark:group-hover:text-[#066fd1]/90">
                      {m.type}
                    </p>
                    <p className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                      {m.brand}
                    </p>
                    <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                      {m.model}
                    </p>
                  </div>

                  {/* Icon side — right */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                    <TypeIcon type={m.type} className="h-7 w-7" neon={s.neon} />
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-2 right-2 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:bg-[#066fd1]/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-[#066fd1] dark:text-[#066fd1]/80" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
