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
const STEP_FORWARD_MS = 200; // ms between each decay step
const STEP_REVERSE_MS = 250; // ms between each recovery step (25% slower than forward)
const CROSSFADE_MS = 120; // ms for the opacity crossfade between weights
const HOLD_BEFORE_REVERSE_MS = 1000; // ms to hold at decay before reversing

export function HeroName() {
  const layersRef = useRef<HTMLSpanElement[]>([]);
  const activeIndex = useRef(0);
  const stepping = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAnimate = useRef(false);

  const crossfadeTo = useCallback((index: number) => {
    const layers = layersRef.current;
    const prev = activeIndex.current;

    /* Fade in the new layer */
    layers[index].style.transition = `opacity ${CROSSFADE_MS}ms ease`;
    layers[index].style.opacity = "1";

    /* Fade out the old layer */
    if (prev !== index) {
      layers[prev].style.transition = `opacity ${CROSSFADE_MS}ms ease`;
      layers[prev].style.opacity = "0";
    }

    /* Clean up any other layers that might be partially visible */
    layers.forEach((el, i) => {
      if (i !== index && i !== prev) {
        el.style.transition = "none";
        el.style.opacity = "0";
      }
    });

    activeIndex.current = index;
  }, []);

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
        crossfadeTo(current + direction);
        stepping.current = setTimeout(tick, delay);
      }

      tick();
    },
    [crossfadeTo, stopStepping],
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
    stopStepping();
    stepping.current = setTimeout(() => {
      stepTo(0);
    }, HOLD_BEFORE_REVERSE_MS);
  }, [stepTo, stopStepping]);

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
          }}
        >
          Sam Anderson
        </span>
      ))}
      <span className="sr-only">Sam Anderson</span>
    </h1>
  );
}
