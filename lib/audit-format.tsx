import type { ComponentType, SVGProps } from "react";

type Tone = "indigo" | "emerald" | "amber" | "rose" | "slate";

const TONE_CLASS: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  inbox: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M4 13h4l2 3h4l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13 7 5h10l2 8v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  down: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  swap: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export interface AuditView {
  label: string;
  tone: Tone;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  summary: string;
}

function parse(details: string): Record<string, string> {
  try {
    const o = JSON.parse(details);
    return typeof o === "object" && o ? o : {};
  } catch {
    return {};
  }
}

export function auditView(action: string, details: string): AuditView {
  const d = parse(details);
  switch (action) {
    case "CREATED_MODEL":
      return { label: "Model added", tone: "indigo", icon: ICONS.plus, summary: `${d.brand ?? ""} ${d.model ?? ""}`.trim() || "—" };
    case "UPDATED_MODEL":
      return { label: "Model updated", tone: "indigo", icon: ICONS.swap, summary: `${d.brand ?? ""} ${d.model ?? ""}`.trim() || "—" };
    case "DELETED_MODEL":
      return { label: "Model removed", tone: "rose", icon: ICONS.trash, summary: d.id ?? "—" };
    case "RECEIVED_ITEM":
      return { label: "Item received", tone: "emerald", icon: ICONS.inbox, summary: d.serialNumber ?? "—" };
    case "RELEASED_ITEM":
      return { label: "Item released", tone: "indigo", icon: ICONS.up, summary: d.serialNumber ? `${d.serialNumber} → ${d.assignee ?? ""}` : "—" };
    case "RETURNED_ITEM":
      return { label: "Item returned", tone: "slate", icon: ICONS.down, summary: d.serialNumber ? `${d.serialNumber} by ${d.pic ?? ""}` : "—" };
    case "CREATED_USER":
      return { label: "User created", tone: "indigo", icon: ICONS.plus, summary: d.employeeNumber ? `${d.employeeNumber} (${d.role ?? ""})` : "—" };
    case "UPDATED_USER_ROLE":
      return { label: "Role changed", tone: "amber", icon: ICONS.swap, summary: d.employeeNumber ? `${d.employeeNumber} → ${d.role ?? ""}` : "—" };
    case "DELETED_USER":
      return { label: "User deleted", tone: "rose", icon: ICONS.trash, summary: d.employeeNumber ?? "—" };
    default:
      return { label: action, tone: "slate", icon: ICONS.swap, summary: details || "—" };
  }
}

export { TONE_CLASS };
