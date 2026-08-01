"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ParticlesBg } from "@/components/particles-bg";

export default function LoginPage() {
  const router = useRouter();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn("credentials", {
      employeeNumber,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid employee number or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden">
      {/* ── Light gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />

      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden dark:opacity-30">
        <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] animate-[blob_18s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-[#2563eb]/10 to-sky-200/30 blur-[80px] dark:from-[#2563eb]/20 dark:to-sky-800/20" />
        <div className="absolute -bottom-20 right-0 h-[350px] w-[350px] animate-[blob_22s_ease-in-out_infinite_reverse] rounded-full bg-gradient-to-tr from-indigo-200/30 to-purple-200/20 blur-[80px] dark:from-indigo-800/20 dark:to-purple-800/10" />
        <div className="absolute left-1/2 top-0 h-[250px] w-[250px] animate-[blob_15s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-emerald-100/20 to-cyan-200/20 blur-[70px] dark:from-emerald-800/10 dark:to-cyan-800/10" />
      </div>

      {/* ── Subtle dot grid ── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle, rgba(37,99,235,0.3) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <ParticlesBg />

      {/* ── Content ── */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-6">
        <div className="flex w-full max-w-5xl items-center gap-16 lg:gap-24">
          {/* ── Left brand ── */}
          <div className="hidden lg:block flex-1 max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-white">
                  <rect x="2" y="2" width="20" height="20" rx="3" />
                  <path d="M7 7h3v10H7zM14 7h3v6h-3z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-white">IT Inventory</span>
                <p className="text-xs text-slate-400 dark:text-slate-500">Management System</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Manage your<br />IT equipments with ease
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Track inventory from procurement to disposal. Monitor deployments, repairs, and returns — all in one place.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  ), text: "Real-time asset tracking"
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  ), text: "Full audit trail & history"
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  ), text: "Role-based access control"
                },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb]/10 text-[#2563eb] dark:bg-[#2563eb]/20">
                    {item.icon}
                  </span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="hidden lg:block h-80 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-slate-700" />

          {/* ── Right: Login card ── */}
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-white">
                  <rect x="2" y="2" width="20" height="20" rx="3" />
                  <path d="M7 7h3v10H7zM14 7h3v6h-3z" />
                </svg>
              </div>
              <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">IT Inventory</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
              <div className="px-7 py-8 sm:px-8">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sign in</h2>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Enter your credentials below</p>

                <form method="post" onSubmit={handleSubmit} className="mt-7 space-y-4">
                  <div>
                    <label htmlFor="employeeNumber" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Employee Number
                    </label>
                    <input
                      id="employeeNumber" name="employeeNumber" type="text" autoComplete="username" required
                      value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)}
                      placeholder="ADM001"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500 dark:hover:border-slate-600 dark:focus:border-[#2563eb] dark:focus:ring-[#2563eb]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <input
                      id="password" name="password" type="password" autoComplete="current-password" required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500 dark:hover:border-slate-600 dark:focus:border-[#2563eb] dark:focus:ring-[#2563eb]/20"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-600 dark:border-rose-800/40 dark:bg-rose-500/10 dark:text-rose-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit" disabled={pending}
                    className="group relative w-full overflow-hidden rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0585d1] active:scale-[0.98] disabled:opacity-60"
                  >
                    {/* Shine sweep — glass reflect */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-[200%]" />
                    {/* Bottom glass highlight */}
                    <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {pending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                          </svg>
                          Signing in&hellip;
                        </>
                      ) : (
                        <>
                          Sign in
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 px-8 py-3 dark:border-slate-800">
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">Authorized personnel only</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(25px, -35px) scale(1.08); }
          50% { transform: translate(-30px, 15px) scale(0.92); }
          75% { transform: translate(20px, 30px) scale(1.04); }
        }
      `}</style>
    </main>
  );
}