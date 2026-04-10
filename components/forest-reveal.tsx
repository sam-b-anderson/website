"use client";

import { useEffect, useRef } from "react";
import { decayState, MAX_DECAY } from "@/lib/decay-state";

/**
 * Forest reveal — a full-viewport canvas that grows a forest mass upward
 * from the bottom of the screen, but ONLY after the hero name has fully
 * decayed (reached Redaction 100). Once triggered, growth happens
 * automatically over time, independent of further scrubbing.
 *
 * The reveal uses Perlin noise to create an irregular, mossy boundary.
 * When the hero text drops back below max decay (recovery), the forest
 * retreats faster than it grew.
 */

/* Noise scale — higher = more detailed mossy edge */
const NOISE_FREQ = 0.025;
const NOISE_OCTAVES = 6;

/* Forest progress range — at PROGRESS_MIN the noise math produces alpha=0
   everywhere (fully invisible). At PROGRESS_MAX, alpha=1 (fully covered). */
const PROGRESS_MIN = -0.5;
const PROGRESS_MAX = 1.1;

/* Time-based growth (independent of scrubbing once triggered) */
const GROWTH_DURATION_SEC = 18; /* time to fully reclaim */
const RETREAT_DURATION_SEC = 4; /* faster retreat on recovery */

/* Trigger threshold — forest only grows when decay is at this level or higher */
const TRIGGER_LEVEL = MAX_DECAY - 0.05;

export function ForestReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---- Perlin noise setup ---- */
    const PERM = new Uint8Array(512);
    for (let i = 0; i < 256; i++) PERM[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
    }
    for (let i = 0; i < 256; i++) PERM[i + 256] = PERM[i];

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const grad = (h: number, x: number, y: number) => {
      const v = h & 3;
      return (v & 1 ? -x : x) + (v & 2 ? -y : y);
    };
    const perlin = (x: number, y: number) => {
      const xi = Math.floor(x) & 255;
      const yi = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = fade(xf);
      const v = fade(yf);
      return lerp(
        lerp(
          grad(PERM[PERM[xi] + yi], xf, yf),
          grad(PERM[PERM[xi + 1] + yi], xf - 1, yf),
          u,
        ),
        lerp(
          grad(PERM[PERM[xi] + yi + 1], xf, yf - 1),
          grad(PERM[PERM[xi + 1] + yi + 1], xf - 1, yf - 1),
          u,
        ),
        v,
      );
    };
    const fbm = (x: number, y: number, oct: number) => {
      let val = 0;
      let amp = 0.5;
      let freq = 1;
      for (let i = 0; i < oct; i++) {
        val += amp * perlin(x * freq, y * freq);
        amp *= 0.5;
        freq *= 2;
      }
      return val;
    };

    /* ---- Pre-computed per-pixel static values ---- */
    let W = window.innerWidth;
    let H = window.innerHeight;
    const DOWNSCALE = 4;

    let fieldW = Math.ceil(W / DOWNSCALE);
    let fieldH = Math.ceil(H / DOWNSCALE);
    let thresholdField = new Float32Array(fieldW * fieldH);
    let imgData = ctx.createImageData(canvas.width, canvas.height);

    const buildField = () => {
      fieldW = Math.ceil(W / DOWNSCALE);
      fieldH = Math.ceil(H / DOWNSCALE);
      thresholdField = new Float32Array(fieldW * fieldH);

      for (let py = 0; py < fieldH; py++) {
        for (let px = 0; px < fieldW; px++) {
          const ry = py * DOWNSCALE;
          /* VERTICAL distance from bottom edge — 0 at bottom, 1 at top.
             This makes the forest grow straight up from the bottom. */
          const dist = (H - ry) / H;
          const n =
            fbm(px * NOISE_FREQ, py * NOISE_FREQ, NOISE_OCTAVES) * 0.5 + 0.5;
          const edgeNoise = n * 0.5;
          thresholdField[py * fieldW + px] = dist - edgeNoise;
        }
      }
    };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.ceil(W / DOWNSCALE);
      canvas.height = Math.ceil(H / DOWNSCALE);
      imgData = ctx.createImageData(canvas.width, canvas.height);
      buildField();
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---- Render forest canvas ---- */
    const renderForest = (progress: number) => {
      const d = imgData.data;
      const w = canvas.width;
      const h = canvas.height;
      const threshold = progress * 1.5;

      for (let py = 0; py < h; py++) {
        /* Vertical color gradient — darker at the bottom, lighter higher up */
        const verticalT = py / h; /* 0 top, 1 bottom */
        const r = Math.round(lerp(75, 38, verticalT));
        const g = Math.round(lerp(95, 55, verticalT));
        const b = Math.round(lerp(60, 35, verticalT));

        for (let px = 0; px < w; px++) {
          const i = py * w + px;
          const fieldVal = thresholdField[i];
          const reveal = threshold - fieldVal;
          const alpha = Math.max(0, Math.min(1, reveal * 3.5));

          const idx = i * 4;
          d[idx] = r;
          d[idx + 1] = g;
          d[idx + 2] = b;
          d[idx + 3] = Math.round(alpha * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    /* ---- Main loop ----
       forestProgress (0..1) is independent of decay level — it grows on
       its own clock once decay reaches max, retreats when it drops. */
    let rafId = 0;
    let forestProgress = 0;
    let lastTime = performance.now();
    /* Render the initial empty state once */
    renderForest(PROGRESS_MIN);

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const isFullyDecayed = decayState.level >= TRIGGER_LEVEL;
      let needsRender = false;

      if (isFullyDecayed && forestProgress < 1) {
        forestProgress = Math.min(
          1,
          forestProgress + dt / GROWTH_DURATION_SEC,
        );
        needsRender = true;
      } else if (!isFullyDecayed && forestProgress > 0) {
        forestProgress = Math.max(
          0,
          forestProgress - dt / RETREAT_DURATION_SEC,
        );
        needsRender = true;
      }

      if (needsRender) {
        const progress =
          PROGRESS_MIN + forestProgress * (PROGRESS_MAX - PROGRESS_MIN);
        renderForest(progress);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}
