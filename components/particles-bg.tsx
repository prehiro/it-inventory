"use client";

import { useEffect, useCallback, useRef } from "react";

export function ParticlesBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const initParticles = useCallback((canvas: HTMLCanvasElement, isDark: boolean) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const count = 140;
    const connectionDist = 150;
    const mouseConnectionDist = 220;
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
        r: 1 + Math.random() * 2.5,
      });
    }

    const mouse = mouseRef.current;

    function animate() {
      ctx!.clearRect(0, 0, w, h);

      // draw connections between particles
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx!.beginPath();
            ctx!.moveTo(dots[i].x, dots[i].y);
            ctx!.lineTo(dots[j].x, dots[j].y);
            ctx!.strokeStyle = colors.line + (0.35 * (1 - dist / connectionDist)) + ")";
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }
        }
      }

      // draw connections to mouse
      if (mouse.x > 0 && mouse.x < w && mouse.y > 0 && mouse.y < h) {
        const nearest: { dot: Dot; dist: number }[] = [];
        for (const d of dots) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseConnectionDist) {
            nearest.push({ dot: d, dist });
          }
        }
        nearest.sort((a, b) => a.dist - b.dist);

        for (let i = 0; i < Math.min(6, nearest.length); i++) {
          const n = nearest[i];
          ctx!.beginPath();
          ctx!.moveTo(mouse.x, mouse.y);
          ctx!.lineTo(n.dot.x, n.dot.y);
          ctx!.strokeStyle = colors.line + (0.6 * (1 - n.dist / mouseConnectionDist)) + ")";
          ctx!.lineWidth = 1.2;
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
        ctx!.fillStyle = colors.particle + "0.7)";
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    const onResize = () => {
      cancelAnimationFrame(animRef.current);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
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
    />
  );
}
