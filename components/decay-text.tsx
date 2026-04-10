"use client";

import React, { useEffect, useRef } from "react";
import { decayState } from "@/lib/decay-state";

/**
 * DecayText — secondary text that goes through its own Redaction weight
 * progression during the FOREST GROWTH phase. Does not decay during the
 * scrubbing phase — only starts decaying once the forest begins growing.
 *
 * Reads decayState.forestProgress (0..1) to determine its position in
 * the decay stack.
 */

const STACK = [
  '"Inter Variable", system-ui, sans-serif',
  '"Redaction", "Times New Roman", serif',
  '"Redaction 10", "Times New Roman", serif',
  '"Redaction 20", "Times New Roman", serif',
  '"Redaction 35", "Times New Roman", serif',
  '"Redaction 50", "Times New Roman", serif',
  '"Redaction 70", "Times New Roman", serif',
];
const STACK_MAX = STACK.length - 1;
const CLEAN_INDEX = 0;

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Forest progress offset (0..1) — text starts decaying after the
      forest has reached this progress. 0 = decays immediately with growth. */
  delay?: number;
  /** Override the clean (starting) font. */
  cleanFont?: string;
}

export function DecayText({
  children,
  className,
  delay = 0,
  cleanFont,
}: Props) {
  const layersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    let rafId = 0;
    let lastT = -1;

    const tick = () => {
      const fp = decayState.forestProgress;
      if (fp !== lastT) {
        /* Apply delay — text only starts decaying after forest progress
           passes the delay threshold */
        const adjusted = Math.max(0, fp - delay);
        const range = 1 - delay;
        const t = range > 0 ? Math.min(1, adjusted / range) : 0;
        const targetPos = t * STACK_MAX;

        for (let i = 0; i < STACK.length; i++) {
          const el = layersRef.current[i];
          if (!el) continue;
          let opacity: number;
          if (i === CLEAN_INDEX && targetPos <= 0) {
            opacity = 1;
          } else if (i === STACK_MAX && targetPos >= STACK_MAX) {
            opacity = 1;
          } else {
            /* Ellipse curve — same as hero name */
            const diff = Math.abs(targetPos - i);
            opacity = diff >= 1 ? 0 : Math.sqrt(1 - diff * diff);
          }
          el.style.opacity = String(opacity);
        }
        lastT = fp;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [delay]);

  const stack = cleanFont ? [cleanFont, ...STACK.slice(1)] : STACK;

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
        maxWidth: "none",
        verticalAlign: "baseline",
      }}
    >
      {stack.map((font, i) => (
        <span
          key={i}
          ref={(el) => {
            layersRef.current[i] = el;
          }}
          aria-hidden={i !== CLEAN_INDEX}
          style={{
            fontFamily: font,
            opacity: i === CLEAN_INDEX ? 1 : 0,
            position: i === CLEAN_INDEX ? "relative" : "absolute",
            left: i === CLEAN_INDEX ? undefined : 0,
            top: i === CLEAN_INDEX ? undefined : 0,
            display: "block",
          }}
        >
          {children}
        </span>
      ))}
    </span>
  );
}
