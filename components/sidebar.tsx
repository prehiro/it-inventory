"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M2 8h20" />
      <path d="M8 2v20" />
    </svg>
  ),
  receive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  release: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  return: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M9 17V9m4 8V5m4 12v-6" strokeLinecap="round" />
      <path d="M4 4h16v16H4z" strokeLinecap="round" />
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

/* ── Style tokens ── */
const SIDEBAR_BG = "bg-white dark:bg-[#0c1426]";
const SIDEBAR_BORDER = "border-slate-200 dark:border-[#1a2540]";
const NAV_ITEM = "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1a2540] dark:hover:text-white";
const NAV_ACTIVE = "bg-[#f0f7ff] text-[#2563eb] dark:bg-[#2563eb]/15 dark:text-white";
const CHILD_ITEM = "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
const CHILD_ACTIVE = "text-[#2563eb] font-medium dark:text-white";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    admin: true,
    inventory: true,
  }));

  function toggle(group: string) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const items: (NavItem | NavGroup)[] = [
    { href: "/", label: "Dashboard", icon: I.dashboard },
    {
      label: "Inventory",
      icon: I.inventory,
      children: [
        { href: "/receive", label: "Receive", icon: I.receive },
        { href: "/release", label: "Release", icon: I.release },
        { href: "/return", label: "Return", icon: I.return },
      ],
    },
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

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? NAV_ACTIVE : NAV_ITEM}`;

  const childCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${active ? CHILD_ACTIVE : CHILD_ITEM}`;

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r ${SIDEBAR_BG} ${SIDEBAR_BORDER}`}>
      {/* ── Logo ── */}
      <div className={`relative flex h-16 items-center gap-3 border-b px-5 dark:border-[#1a2540] border-slate-200 ${SIDEBAR_BG}`}>
        <ParticlesBg contained className="absolute inset-0 h-full w-full pointer-events-none" />
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="2" y="2" width="20" height="20" rx="3" />
            <path d="M7 7h3v10H7zM14 7h3v6h-3z" />
          </svg>
        </div>
        <div className="relative z-10">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">IT Inventory</span>
          <p className="text-[10px] leading-none text-slate-400 dark:text-slate-500">Management System</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((it) => {
          if ("children" in it) {
            const group = it as NavGroup;
            const active = group.children.some((ch) => pathname.startsWith(ch.href));
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggle(group.label.toLowerCase())}
                  className={`group relative w-full ${linkCls(active)}`}
                >
                  <span className={active ? "text-[#2563eb] dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                    {group.icon}
                  </span>
                  <span className="flex-1 text-left">{group.label}</span>
                  <span className={`transition-transform duration-200 ${openGroups[group.label.toLowerCase()] ? "rotate-180" : ""} ${active ? "text-[#2563eb] dark:text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                    {I.chevronDown}
                  </span>
                </button>
                {openGroups[group.label.toLowerCase()] && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 dark:border-[#1a2540]/60">
                    {group.children.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={childCls(childActive)}
                        >
                          <span className={`shrink-0 ${childActive ? "text-[#2563eb] dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                            {child.icon}
                          </span>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const item = it as NavItem;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkCls(active)}
            >
              <span className={active ? "text-[#2563eb] dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        {/* ── Divider ── */}
        <div className={`my-3 border-t ${SIDEBAR_BORDER}`} />

        {/* ── Admin group ── */}
        {role === "ADMIN" && (
          <div>
            <button
              onClick={() => toggle("admin")}
              className={`group relative w-full ${linkCls(pathname.startsWith("/admin"))}`}
            >
              <span className={pathname.startsWith("/admin") ? "text-[#2563eb] dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                {I.admin}
              </span>
              <span className="flex-1 text-left">Admin</span>
              <span className={`transition-transform duration-200 ${openGroups.admin ? "rotate-180" : ""} ${pathname.startsWith("/admin") ? "text-[#2563eb] dark:text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                {I.chevronDown}
              </span>
            </button>
            {openGroups.admin && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 dark:border-[#1a2540]/60">
                {adminGroup.children.map((child) => {
                  const active = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={childCls(active)}
                    >
                      <span className={`shrink-0 ${active ? "text-[#2563eb] dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                        {child.icon}
                      </span>
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className={`border-t px-5 py-3 ${SIDEBAR_BORDER}`}>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          System Online
        </div>
      </div>
    </aside>
  );
}
