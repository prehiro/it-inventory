"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function ParticlesBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const initParticles = useCallback((canvas: HTMLCanvasElement, isDark: boolean) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const count = 120;
    const connectionDist = 150;
    const colors = isDark
      ? { particle: "rgba(0,245,255,", line: "rgba(0,217,255," }
      : { particle: "rgba(2,119,189,", line: "rgba(2,136,209," };

    type Dot = { x: number; y: number; vx: number; vy: number; r: number };
    const dots: Dot[] = [];

    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        r: 1 + Math.random() * 2,
      });
    }

    function animate() {
      ctx!.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = colors.particle + "0.7)";
        ctx!.fill();
      }

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx!.beginPath();
            ctx!.moveTo(dots[i].x, dots[i].y);
            ctx!.lineTo(dots[j].x, dots[j].y);
            ctx!.strokeStyle = colors.line + (0.4 * (1 - dist / connectionDist)) + ")";
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    const onResize = () => {
      cancelAnimationFrame(animRef.current);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      // restart animation loop but keep the dots intact
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const html = document.documentElement;
    const detectDark = () =>
      html.classList.contains("dark") ||
      html.getAttribute("data-theme") === "dark";

    let cleanup = initParticles(canvas, detectDark());

    const observer = new MutationObserver(() => {
      if (cleanup) cleanup();
      cleanup = initParticles(canvas, detectDark());
    });
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      if (cleanup) cleanup();
      observer.disconnect();
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ transition: "opacity 0.5s" }}
    />
  );
}

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
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-[#e3f2fd] via-[#90caf9] to-[#64b5f6] px-4 dark:from-[#000814] dark:via-[#003566] dark:to-[#0077b6]">
      <ParticlesBg />
      <div className="relative z-10 w-full max-w-sm animate-fade-in rounded-2xl bg-white/90 p-8 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-900/80 dark:ring-slate-700">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            IT
          </div>
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Inventory</span>
        </div>
        <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Internal IT asset management</p>

        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="employeeNumber" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Employee Number</label>
            <input
              id="employeeNumber" name="employeeNumber" type="text" autoComplete="username" required
              value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. ADM001"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
          )}
          <button
            type="submit" disabled={pending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
