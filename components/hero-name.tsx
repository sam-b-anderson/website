"use client";

import { useRef, useEffect } from "react";
import { decayState } from "@/lib/decay-state";

/**
 * Redaction weight stack, rendered bottom-to-top in the DOM.
 * STACK[0] = most degraded (Redaction 100, rendered first, bottom of visual stack)
 * STACK[CLEAN_INDEX] = clean Redaction (rendered last, on top)
 *
 * On hover, the cursor physically scrubs the clean layer away, revealing
 * progressively more degraded weights beneath. Effort-based (distance
 * traveled), not time-based.
 */
const STACK = [
  "Redaction 100",
  "Redaction 70",
  "Redaction 50",
  "Redaction 35",
  "Redaction 20",
  "Redaction 10",
  "Redaction",
] as const;
const MAX_DECAY = STACK.length - 1;
const CLEAN_INDEX = STACK.length - 1;

/* Tunables */
const DISTANCE_FOR_FULL = 3000; // px of cursor travel for full decay
const RECOVERY_DELAY_MS = 1500; // pause after cursor leaves before recovery starts (when not yet in growth phase)
const GROWTH_COOLDOWN_MS = 3000; // grace period after cursor leaves during growth phase before forest recedes
const RECOVERY_SPEED = 0.024; // recovery rate (distance decay per second as fraction of full)

/* Color interpolation — text shifts from warm near-black to warm gray */
const COLOR_CLEAN = { l: 18, c: 0.008, h: 60 };
const COLOR_DECAYED = { l: 52, c: 0.018, h: 70 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getDecayColor(d: number): string {
  const t = Math.min(1, d / MAX_DECAY);
  const eased = t * t * (3 - 2 * t);
  const l = lerp(COLOR_CLEAN.l, COLOR_DECAYED.l, eased);
  const c = lerp(COLOR_CLEAN.c, COLOR_DECAYED.c, eased);
  const h = lerp(COLOR_CLEAN.h, COLOR_DECAYED.h, eased);
  return `oklch(${l}% ${c} ${h})`;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  lightness: number;
}

export function HeroName() {
  const heroRef = useRef<HTMLHeadingElement>(null);
  const layersRef = useRef<HTMLSpanElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---- state ---- */
    let decayLevel = 0;
    let totalDistance = 0;
    let isOnHero = false;
    let lastX = 0;
    let lastY = 0;
    let frameDist = 0;
    let isGrowing = false; // true during growth phase (forest growing or paused in cooldown)
    let isRecovering = false; // true after growth phase ends, while text recovers
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTime = performance.now();
    let rafId = 0;
    const dust: DustParticle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---- apply opacity + color for current decayLevel ---- */
    const applyDecay = () => {
      /* Publish to shared state so forest-reveal + decay-text can read it */
      decayState.level = decayLevel;
      decayState.isGrowing = isGrowing;
      /* Publish to CSS variable for the bottom-row border fade */
      document.documentElement.style.setProperty(
        "--decay-progress",
        String(decayLevel / MAX_DECAY),
      );

      hero.style.transition = "none";
      hero.style.color = getDecayColor(decayLevel);
      for (let i = 0; i < STACK.length; i++) {
        const el = layersRef.current[i];
        if (!el) continue;
        el.style.transition = "none";
        const center = MAX_DECAY - i;
        let opacity: number;
        if (i === CLEAN_INDEX && decayLevel <= 0) {
          opacity = 1;
        } else if (i === 0 && decayLevel >= MAX_DECAY) {
          opacity = 1;
        } else {
          /* Ellipse curve — keeps combined visual opacity ~1 throughout */
          const diff = Math.abs(decayLevel - center);
          opacity = diff >= 1 ? 0 : Math.sqrt(1 - diff * diff);
        }
        el.style.opacity = String(opacity);
      }
    };

    /* ---- Lock container to clean text dimensions, then flip clean to absolute ---- */
    const lockDimensions = () => {
      const clean = layersRef.current[CLEAN_INDEX];
      if (!clean) return;
      const rect = hero.getBoundingClientRect();
      hero.style.width = rect.width + "px";
      hero.style.height = rect.height + "px";
      clean.style.position = "absolute";
      clean.style.left = "0";
      clean.style.top = "0";
      applyDecay();
    };

    /* Wait for fonts to load so measurements use real Redaction metrics */
    document.fonts.ready.then(lockDimensions);

    /* ---- dust particles ---- */
    const spawnDust = (x: number, y: number, count: number) => {
      if (decayLevel >= MAX_DECAY - 0.05) return;
      const c = Math.min(Math.floor(count), 3);
      for (let i = 0; i < c; i++) {
        const angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
        const speed = 0.3 + Math.random() * 0.8;
        const size = 0.8 + Math.random() * 1.5;
        const lightness = 30 + Math.random() * 25;
        dust.push({
          x: x + (Math.random() - 0.5) * 6,
          y,
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * speed * 0.5,
          size,
          life: 1,
          decay: 0.02 + Math.random() * 0.03,
          lightness,
        });
      }
    };

    const tickDust = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) {
          dust.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.4;
        ctx.fillStyle = `oklch(${p.lightness}% 0.008 70)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /* ---- main loop ---- */
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      /* Scrubbing — accumulate distance, only meaningful before growth phase.
         Once isGrowing is true, scrubbing stops affecting decayLevel. */
      if (isOnHero && !isGrowing) {
        totalDistance += frameDist;
        const normalizedDist = Math.min(1, totalDistance / DISTANCE_FOR_FULL);
        decayLevel = Math.min(MAX_DECAY, Math.sqrt(normalizedDist) * MAX_DECAY);

        /* Trigger growth phase when fully decayed */
        if (decayLevel >= MAX_DECAY - 0.05) {
          decayLevel = MAX_DECAY;
          isGrowing = true;
        }

        if (frameDist > 2) {
          spawnDust(lastX, lastY, Math.min(frameDist / 3, 8));
        }
      }

      /* Recovery — only after growth phase has ended (or after a partial scrub) */
      if (isRecovering) {
        totalDistance = Math.max(
          0,
          totalDistance - DISTANCE_FOR_FULL * RECOVERY_SPEED * dt,
        );
        const normalizedDist = Math.min(1, totalDistance / DISTANCE_FOR_FULL);
        decayLevel = Math.max(0, Math.sqrt(normalizedDist) * MAX_DECAY);
        if (decayLevel <= 0.01) {
          decayLevel = 0;
          totalDistance = 0;
          isRecovering = false;
        }
      }

      frameDist = 0;
      applyDecay();
      tickDust();
      rafId = requestAnimationFrame(tick);
    };

    /* ---- pointer handlers ---- */
    const onEnter = () => {
      isOnHero = true;
      /* Cancel any in-flight cooldown or recovery — returning the cursor
         either resumes growth (if cooldown was active) or lets the user
         scrub again (if recovery was active). */
      isRecovering = false;
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      frameDist += Math.sqrt(dx * dx + dy * dy);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onLeave = () => {
      isOnHero = false;
      if (recoveryTimer) clearTimeout(recoveryTimer);

      if (isGrowing) {
        /* Growth phase active — wait 3s, then end growth and start recovery.
           If user returns within 3s, this timer is cancelled and growth resumes. */
        recoveryTimer = setTimeout(() => {
          isGrowing = false;
          isRecovering = true;
        }, GROWTH_COOLDOWN_MS);
      } else if (decayLevel > 0) {
        /* Normal partial-scrub recovery */
        recoveryTimer = setTimeout(() => {
          isRecovering = true;
        }, RECOVERY_DELAY_MS);
      }
    };

    hero.addEventListener("pointerenter", onEnter);
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      hero.removeEventListener("pointerenter", onEnter);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafId);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
      <h1 ref={heroRef} className="hero-name font-serif">
        {STACK.map((fontFamily, i) => {
          const isClean = i === CLEAN_INDEX;
          return (
            <span
              key={fontFamily}
              ref={(el) => {
                if (el) layersRef.current[i] = el;
              }}
              className="hero-name-layer"
              aria-hidden={!isClean}
              style={{
                fontFamily: `"${fontFamily}", "Times New Roman", serif`,
                opacity: isClean ? 1 : 0,
                position: isClean ? "relative" : "absolute",
                left: isClean ? undefined : 0,
                top: isClean ? undefined : 0,
              }}
            >
              Sam Anderson
            </span>
          );
        })}
        <span className="sr-only">Sam Anderson</span>
      </h1>
    </>
  );
}
