import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  align,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";

  return (
    <div
      className={`mb-6 flex items-start gap-4 ${isCenter && !action ? "justify-center" : "justify-between"}`}
    >
      <div className={isCenter ? "flex flex-col items-center" : ""}>
        <div className={`flex items-center gap-2.5 ${isCenter ? "justify-center" : ""}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {icon && (
            <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          )}
        </div>
        {subtitle && (
          <p
            className={`mt-1 text-sm text-slate-500 dark:text-slate-400 ${isCenter ? "" : ""}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}