"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * Redaction weight tiers — 0 (clean) through 100 (most degraded).
 * Each maps to a font-family defined in globals.css.
 */
const WEIGHTS = [
  "Redaction",
  "Redaction 10",
  "Redaction 20",
  "Redaction 35",
  "Redaction 50",
  "Redaction 70",
  "Redaction 100",
] as const;

/* Timing tunables */
const STEP_FORWARD_MS = 200; // ms per decay step on hover
const STEP_REVERSE_MS = 100; // ms per recovery step on leave
const FADE_DURATION_MS = 250; // CSS transition duration for each layer

export function HeroName() {
  const layersRef = useRef<HTMLSpanElement[]>([]);
  const activeIndex = useRef(0);
  const stepping = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAnimate = useRef(false);

  const stopStepping = useCallback(() => {
    if (stepping.current !== null) {
      clearTimeout(stepping.current);
      stepping.current = null;
    }
  }, []);

  const stepTo = useCallback(
    (target: number) => {
      stopStepping();

      const direction = target > activeIndex.current ? 1 : -1;
      const delay = direction === 1 ? STEP_FORWARD_MS : STEP_REVERSE_MS;

      function tick() {
        const current = activeIndex.current;
        if (current === target) {
          stepping.current = null;
          return;
        }

        if (direction === 1) {
          /* Forward: fade IN the next layer on top (layers accumulate) */
          const next = current + 1;
          layersRef.current[next].style.opacity = "1";
          activeIndex.current = next;
        } else {
          /* Reverse: fade OUT the current top layer (layers peel off) */
          layersRef.current[current].style.opacity = "0";
          activeIndex.current = current - 1;
        }

        stepping.current = setTimeout(tick, delay);
      }

      tick();
    },
    [stopStepping],
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia("(pointer: fine)");
    canAnimate.current = !reducedMotion.matches && finePointer.matches;
  }, []);

  const onEnter = useCallback(() => {
    if (!canAnimate.current) return;
    stepTo(WEIGHTS.length - 1);
  }, [stepTo]);

  const onLeave = useCallback(() => {
    if (!canAnimate.current) return;
    stepTo(0);
  }, [stepTo]);

  return (
    <h1
      className="hero-name"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {WEIGHTS.map((fontFamily, i) => (
        <span
          key={fontFamily}
          ref={(el) => {
            if (el) layersRef.current[i] = el;
          }}
          aria-hidden={i !== 0}
          className="hero-name-layer"
          style={{
            fontFamily: `"${fontFamily}", "Times New Roman", serif`,
            opacity: i === 0 ? 1 : 0,
            transition: `opacity ${FADE_DURATION_MS}ms ease`,
          }}
        >
          Sam Anderson
        </span>
      ))}
      <span className="sr-only">Sam Anderson</span>
    </h1>
  );
}
