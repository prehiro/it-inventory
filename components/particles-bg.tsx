"use client";

import { useEffect, useCallback, useRef } from "react";

export function ParticlesBg({
  className,
  contained = false,
}: {
  className?: string;
  contained?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const initParticles = useCallback((canvas: HTMLCanvasElement, isDark: boolean) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    if (contained) {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = canvas.width = parent.clientWidth;
      h = canvas.height = parent.clientHeight;
    } else {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    const count = contained ? 40 : 150;
    const connectionDist = contained ? 90 : 140;
    const mouseConnectionDist = contained ? 120 : 200;
    const colors = isDark
      ? { particle: "rgba(0,245,255,", line: "rgba(0,217,255," }
      : { particle: "rgba(2,119,189,", line: "rgba(2,136,209," };

    type Dot = { x: number; y: number; vx: number; vy: number; r: number };
    const dots: Dot[] = [];

    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (contained ? 0.3 : 0.7),
        vy: (Math.random() - 0.5) * (contained ? 0.3 : 0.7),
        r: (contained ? 0.6 : 0.8) + Math.random() * (contained ? 1 : 2.2),
      });
    }

    const mouse = mouseRef.current;

    // Throttle: skip every other frame for contained mode
    let skipFrame = false;

    function animate() {
      ctx!.clearRect(0, 0, w, h);

      // For contained (sidebar), skip every other frame = ~30fps
      if (contained) {
        skipFrame = !skipFrame;
        if (skipFrame) {
          animRef.current = requestAnimationFrame(animate);
          return;
        }
      }

      // draw connections — only every 2nd frame for contained
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx!.beginPath();
            ctx!.moveTo(dots[i].x, dots[i].y);
            ctx!.lineTo(dots[j].x, dots[j].y);
            ctx!.strokeStyle = colors.line + (contained ? 0.15 : 0.25) * (1 - dist / connectionDist) + ")";
            ctx!.lineWidth = contained ? 0.3 : 0.4;
            ctx!.stroke();
          }
        }
      }

      // draw connections to mouse — only if mouse is in bounds
      let mx = mouse.x;
      let my = mouse.y;
      if (contained) {
        const rect = canvas.getBoundingClientRect();
        mx -= rect.left;
        my -= rect.top;
      }
      if (mx >= 0 && mx <= w && my >= 0 && my <= h) {
        const nearest: { dot: Dot; dist: number }[] = [];
        for (const d of dots) {
          const dx = d.x - mx;
          const dy = d.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseConnectionDist) {
            nearest.push({ dot: d, dist });
          }
        }
        nearest.sort((a, b) => a.dist - b.dist);

        for (let i = 0; i < Math.min(2, nearest.length); i++) {
          const n = nearest[i];
          ctx!.beginPath();
          ctx!.moveTo(mx, my);
          ctx!.lineTo(n.dot.x, n.dot.y);
          ctx!.strokeStyle = colors.line + (contained ? 0.25 : 0.4) * (1 - n.dist / mouseConnectionDist) + ")";
          ctx!.lineWidth = contained ? 0.5 : 0.8;
          ctx!.stroke();
        }
      }

      // draw particles
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = colors.particle + (contained ? 0.3 : 0.5) + ")";
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    // Defer first frame to allow React to paint
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
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

    const onResize = () => {
      if (cleanup) cleanup();
      cleanup = initParticles(canvas, detectDark());
    };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

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
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "fixed inset-0 pointer-events-none"}
    />
  );
}
