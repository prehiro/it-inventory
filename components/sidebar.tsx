"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import type { ReactElement } from "react";
import { useState } from "react";
import { ParticlesBg } from "@/components/particles-bg";

type NavItem = { href: string; label: string; icon: ReactElement };
type NavGroup = { label: string; icon: ReactElement; children: NavItem[] };

const I = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  receive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
      <path d="M5 17H3V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v13h-3" />
      <path d="M15 8h3l3 3v3h-3" />
    </svg>
  ),
  release: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  return: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M9 17V9m4 8V5m4 12v-6" strokeLinecap="round" />
    </svg>
  ),
  ledger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  master: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  employee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    admin: pathname.startsWith("/admin"),
  }));

  function toggle(group: string) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: I.dashboard },
    { href: "/receive", label: "Receive", icon: I.receive },
    { href: "/release", label: "Release", icon: I.release },
    { href: "/return", label: "Return", icon: I.return },
    { href: "/pc-ledger", label: "PC Ledger", icon: I.ledger },
  ];

  const adminGroup: NavGroup = {
    label: "Admin",
    icon: I.admin,
    children: [
      { href: "/admin/users", label: "User Management", icon: I.users },
      { href: "/admin/master-data", label: "Master Data Item", icon: I.master },
      { href: "/admin/employee-no-list", label: "Employee No List", icon: I.employee },
      { href: "/admin/audit-trail", label: "Audit Trail", icon: I.audit },
    ],
  };

  if (role === "ADMIN" || role === "MANAGER")
    items.push({ href: "/reports", label: "Reports", icon: I.reports });

  return (
    <aside className="sidebar-surface fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <ParticlesBg contained className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          IT
        </div>
        <span className="relative z-10 text-sm font-semibold text-slate-900 dark:text-slate-100">Inventory</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
                active ? "nav-link-active" : ""
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          );
        })}

        {role === "ADMIN" && (
          <div>
            <button
              onClick={() => toggle("admin")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
                pathname.startsWith("/admin") ? "nav-link-active" : ""
              }`}
            >
              {I.admin}
              <span className="flex-1 text-left">Admin</span>
              <span className={`transition-transform ${openGroups.admin ? "rotate-180" : ""}`}>
                {I.chevronDown}
              </span>
            </button>
            {openGroups.admin && (
              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700">
                {adminGroup.children.map((child) => {
                  const active = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition ${
                        active
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        v0.1 · Internal
      </div>
    </aside>
  );
}
