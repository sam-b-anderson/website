"use client";

import { useEffect, useRef } from "react";
import { decayState, MAX_DECAY } from "@/lib/decay-state";

/**
 * Forest reveal — a full-viewport canvas that draws an organic forest mass
 * creeping from the bottom-right corner as the hero name decays.
 *
 * The reveal uses Perlin noise to create an irregular, mossy boundary.
 * Progress is driven by the shared decay state — scrubbing the hero name
 * grows the forest, recovery retreats it.
 *
 * The canvas writes both forest color and alpha directly in one pass
 * (no CSS mask dataURL round-trip).
 */

/* Noise scale — higher = more detailed mossy edge */
const NOISE_FREQ = 0.025;
const NOISE_OCTAVES = 6;

/* Map decayLevel (0..6) to forest progress.
   Negative start means the spread begins OFF-SCREEN while the text is
   still decaying, so it doesn't snap into view at max decay. */
const PROGRESS_MIN = -0.2; /* off-screen */
const PROGRESS_MAX = 1.1;

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

    /* ---- Pre-computed per-pixel static values ----
       The noise pattern and distance field don't depend on progress.
       Pre-compute them once so the per-frame work is just thresholding. */
    let W = window.innerWidth;
    let H = window.innerHeight;
    const DOWNSCALE = 4;

    let fieldW = Math.ceil(W / DOWNSCALE);
    let fieldH = Math.ceil(H / DOWNSCALE);
    /* For each pixel, stores (dist - noiseOffset) — lower values reveal first */
    let thresholdField = new Float32Array(fieldW * fieldH);

    const buildField = () => {
      fieldW = Math.ceil(W / DOWNSCALE);
      fieldH = Math.ceil(H / DOWNSCALE);
      thresholdField = new Float32Array(fieldW * fieldH);

      for (let py = 0; py < fieldH; py++) {
        for (let px = 0; px < fieldW; px++) {
          const rx = px * DOWNSCALE;
          const ry = py * DOWNSCALE;
          /* Normalized distance from bottom-right corner (0..~1.41) */
          const dx = (W - rx) / W;
          const dy = (H - ry) / H;
          const dist = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
          /* Noise offset adds irregularity to the boundary */
          const n = fbm(px * NOISE_FREQ, py * NOISE_FREQ, NOISE_OCTAVES) * 0.5 + 0.5;
          const edgeNoise = n * 0.5;
          /* When threshold > dist - edgeNoise, pixel is revealed */
          thresholdField[py * fieldW + px] = dist - edgeNoise;
        }
      }
    };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.ceil(W / DOWNSCALE);
      canvas.height = Math.ceil(H / DOWNSCALE);
      buildField();
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---- Render forest canvas ---- */
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const d = imgData.data;

    const renderForest = (progress: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const threshold = progress * 1.5;

      for (let i = 0; i < w * h; i++) {
        /* Distance from bottom-right for color gradient
           Using the threshold field: dist - edgeNoise is stored */
        const fieldVal = thresholdField[i];
        const reveal = threshold - fieldVal;
        const alpha = Math.max(0, Math.min(1, reveal * 3.5));

        /* Forest color varies by distance from bottom-right (more opaque = deeper)
           Approximate the radial gradient with sRGB values */
        const centerness = Math.max(0, 1 - fieldVal); /* 0..~1, higher near corner */
        /* Dark mossy green → lighter distant green */
        const r = Math.round(lerp(70, 45, centerness));
        const g = Math.round(lerp(90, 60, centerness));
        const b = Math.round(lerp(55, 38, centerness));

        const idx = i * 4;
        d[idx] = r;
        d[idx + 1] = g;
        d[idx + 2] = b;
        d[idx + 3] = Math.round(alpha * 255);
      }

      ctx.putImageData(imgData, 0, 0);
    };

    /* ---- Main loop ---- */
    let rafId = 0;
    let lastProgress = -999;

    const tick = () => {
      const t = Math.max(0, Math.min(1, decayState.level / MAX_DECAY));
      const progress = PROGRESS_MIN + t * (PROGRESS_MAX - PROGRESS_MIN);

      /* Only re-render if progress changed meaningfully */
      if (Math.abs(progress - lastProgress) > 0.003) {
        renderForest(progress);
        lastProgress = progress;
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
        zIndex: 2, /* above paper-bg (z:1), below content (z:10) */
      }}
    />
  );
}
