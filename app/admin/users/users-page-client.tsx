"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserRoleAction, deleteUserAction, type UserActionResult } from "@/app/actions/users";
import type { Role } from "@/lib/types";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type UserRow = {
  employeeNumber: string;
  name: string;
  department: string | null;
  role: string;
};

type Stats = {
  total: number;
  admins: number;
  managers: number;
  operators: number;
};

/* ──────────────────────────────────────────
   Role badge config
   ────────────────────────────────────────── */
const ROLE_STYLE: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  ADMIN: {
    label: "Admin",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-300",
    ring: "ring-indigo-600/20 dark:ring-indigo-400/30",
  },
  MANAGER: {
    label: "Manager",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-600/20 dark:ring-amber-400/30",
  },
  OPERATOR: {
    label: "Operator",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-600/20 dark:ring-emerald-400/30",
  },
};

/* ──────────────────────────────────────────
   Main page component
   ────────────────────────────────────────── */
export function UsersPageClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Stats
  const stats: Stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    managers: users.filter((u) => u.role === "MANAGER").length,
    operators: users.filter((u) => u.role === "OPERATOR").length,
  };

  // Filter
  const filtered = users.filter((u) => {
    const matchesSearch = !search.trim() ||
      u.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Refresh list after actions
  async function refresh() {
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.ok) setUsers(json.users);
  }

  return (
    <div className="space-y-8">

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", count: stats.total, icon: <UsersIcon />, color: "bg-slate-50 dark:bg-slate-800/50", textColor: "text-slate-900 dark:text-slate-100", iconBg: "bg-slate-200 dark:bg-slate-700", iconColor: "text-slate-600 dark:text-slate-300" },
          { label: "Admins", count: stats.admins, icon: <ShieldIcon />, color: "bg-indigo-50 dark:bg-indigo-500/10", textColor: "text-indigo-700 dark:text-indigo-300", iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconColor: "text-indigo-600 dark:text-indigo-400" },
          { label: "Managers", count: stats.managers, icon: <BriefcaseIcon />, color: "bg-amber-50 dark:bg-amber-500/10", textColor: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-100 dark:bg-amber-500/20", iconColor: "text-amber-600 dark:text-amber-400" },
          { label: "Operators", count: stats.operators, icon: <UsersIcon />, color: "bg-emerald-50 dark:bg-emerald-500/10", textColor: "text-emerald-700 dark:text-emerald-300", iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
        ].map((card) => (
          <div key={card.label} className={`flex items-center gap-3.5 rounded-2xl px-5 py-4 shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-800/60 ${card.color}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${card.textColor}`}>{card.count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, emp #, dept…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="OPERATOR">Operator</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showCreate ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* ── Create user drawer ── */}
      {showCreate && (
        <CreateUserCard onCreated={() => { setShowCreate(false); refresh(); }} />
      )}

      {/* ── User table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee #</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    {search || roleFilter ? "No users match your filters." : "No users yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <UserRowComponent
                    key={u.employeeNumber}
                    user={u}
                    onUpdated={refresh}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Showing {filtered.length} of {users.length} users
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Create user card
   ────────────────────────────────────────── */
function CreateUserCard({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState<UserActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await createUserAction(Object.fromEntries(formData.entries()));
      if (result.ok) onCreated();
      return result;
    },
    null,
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white shadow-md ring-1 ring-indigo-200/60 dark:from-slate-800 dark:to-slate-900 dark:ring-indigo-500/20">
      <div className="border-b border-indigo-100 px-6 py-4 dark:border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Create New User</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add a new system user with role-based access</p>
          </div>
        </div>
      </div>
      <form action={formAction} className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4 lg:grid-cols-6">
        <input name="employeeNumber" required placeholder="Emp #" className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
        <input name="name" required placeholder="Full name" className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
        <input name="department" placeholder="Department" className="col-span-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
        <select name="role" defaultValue="OPERATOR" className="col-span-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <option value="OPERATOR">Operator</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <input name="password" type="password" required placeholder="Temp password (min 6)" className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
        <div className="col-span-2 flex items-center gap-3 md:col-span-4 lg:col-span-6">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
                Creating…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Create User
              </>
            )}
          </button>
          {state && !state.ok && (
            <span className="text-sm text-rose-600 dark:text-rose-400">{state.error}</span>
          )}
          {state?.ok && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              User created
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────
   User row with inline role edit + delete
   ────────────────────────────────────────── */
function UserRowComponent({ user, onUpdated }: { user: UserRow; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.OPERATOR;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function changeRole(role: string) {
    setBusy(true);
    await updateUserRoleAction(user.employeeNumber, role);
    setBusy(false);
    setOpen(false);
    onUpdated();
  }

  async function handleDelete() {
    if (!confirm(`Delete user "${user.name}" (${user.employeeNumber})?`)) return;
    setBusy(true);
    await deleteUserAction(user.employeeNumber);
    setBusy(false);
    onUpdated();
  }

  return (
    <tr className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-6 py-4">
        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{user.employeeNumber}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.name}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">{user.department ?? <span className="italic text-slate-300 dark:text-slate-600">—</span>}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="relative inline-block" ref={menuRef}>
          <button
            onClick={() => !busy && setOpen(!open)}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition hover:opacity-80 disabled:opacity-60 ${roleStyle.bg} ${roleStyle.text} ${roleStyle.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              user.role === "ADMIN" ? "bg-indigo-500" :
              user.role === "MANAGER" ? "bg-amber-500" :
              "bg-emerald-500"
            }`} />
            {roleStyle.label}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              {["ADMIN", "MANAGER", "OPERATOR"].map((r) => {
                const s = ROLE_STYLE[r] ?? ROLE_STYLE.OPERATOR;
                const active = user.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => changeRole(r)}
                    className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium transition ${
                      active
                        ? "bg-slate-50 dark:bg-slate-700"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      r === "ADMIN" ? "bg-indigo-500" :
                      r === "MANAGER" ? "bg-amber-500" :
                      "bg-emerald-500"
                    }`} />
                    <span className="flex-1">{s.label}</span>
                    {active && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 text-indigo-600" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right">
        <button
          onClick={handleDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete
        </button>
      </td>
    </tr>
  );
}

/* ──────────────────────────────────────────
   Icons
   ────────────────────────────────────────── */
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
