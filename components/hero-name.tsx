"use client";

import { useRef, useEffect } from "react";

export function HeroName() {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia("(pointer: fine)");

    if (!reducedMotion.matches && finePointer.matches) {
      ref.current?.classList.add("can-animate");
    }
  }, []);

  return (
    <h1 ref={ref} className="hero-name font-serif">
      <span className="hero-name-roman" aria-hidden="true">
        Sam Anderson
      </span>
      <span className="hero-name-italic" aria-hidden="true">
        Sam Anderson
      </span>
      <span className="sr-only">Sam Anderson</span>
    </h1>
  );
}
