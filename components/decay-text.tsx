"use client";

import React, { useEffect, useRef } from "react";
import { decayState, MAX_DECAY } from "@/lib/decay-state";

/**
 * DecayText — secondary text that goes through its own Redaction weight
 * progression as the hero name is scrubbed. Reads decay level from shared
 * state, applies stacked-layer crossfade similar to the hero name.
 *
 * The "clean" font (default Inter) is the starting point. As decay
 * progresses, the text passes through progressively degraded Redaction
 * weights, ending at Redaction 70 (slightly less heavy than the hero's
 * Redaction 100).
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
  /** Decay level offset — secondary text starts decaying after the hero
      has already started. Higher = more delay. */
  delay?: number;
  /** Override the clean (starting) font. */
  cleanFont?: string;
}

export function DecayText({
  children,
  className,
  delay = 1,
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
    let lastLevel = -1;

    const tick = () => {
      const level = decayState.level;
      if (level !== lastLevel) {
        /* Apply delay — secondary text only starts decaying after hero
           has reached `delay` decay level */
        const adjusted = Math.max(0, level - delay);
        const range = MAX_DECAY - delay;
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
        lastLevel = level;
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
