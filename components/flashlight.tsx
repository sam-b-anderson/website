"use client";

import { useEffect, useRef } from "react";

export function Flashlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (reducedMotion.matches) return;

    const el = ref.current;
    if (!el) return;

    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    let isVisible = false;
    let rafId = 0;

    function animate() {
      const dx = target.x - current.x;
      const dy = target.y - current.y;

      /* Damping factor — controls how quickly the light follows the cursor */
      const damping = 0.15;

      current.x += dx * damping;
      current.y += dy * damping;

      el!.style.setProperty("--mx", `${(current.x * 100).toFixed(2)}%`);
      el!.style.setProperty("--my", `${(current.y * 100).toFixed(2)}%`);

      rafId = requestAnimationFrame(animate);
    }

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = e.clientY / window.innerHeight;

      if (!isVisible) {
        isVisible = true;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      isVisible = false;
      el.style.opacity = "0";
    };

    const onEnter = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = e.clientY / window.innerHeight;
      current.x = target.x;
      current.y = target.y;
      isVisible = true;
      el.style.opacity = "1";
    };

    document.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    rafId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-0 mix-blend-soft-light"
      style={{
        transition: "opacity 400ms ease",
        backgroundImage: `radial-gradient(
          circle 300px at var(--mx, 50%) var(--my, 50%),
          oklch(99% 0.015 85 / 0.9) 0%,
          oklch(99% 0.015 85 / 0.4) 30%,
          oklch(99% 0.015 85 / 0.1) 55%,
          transparent 75%
        )`,
      }}
    />
  );
}
