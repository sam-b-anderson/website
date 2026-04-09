import Link from "next/link";
import { Flashlight } from "@/components/flashlight";

export default function Home() {
  return (
    <main className="relative min-h-dvh" style={{ background: "var(--color-bg)" }}>
      <Flashlight />

      <div
        className="front-door relative z-10 mx-auto flex min-h-dvh flex-col justify-between"
        style={{
          maxWidth: "56rem",
          padding: "clamp(2rem, 4vw, 4rem)",
        }}
      >
        {/* Top row — eyebrow + metadata */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="eyebrow font-mono">Sam Anderson</p>
          <p className="eyebrow font-mono">sambanderson.com &middot; EST. 2026</p>
        </header>

        {/* Middle — tagline + context */}
        <section className="my-auto py-16">
          {/* PLACEHOLDER TAGLINE — Sam will rewrite after seeing it live */}
          <h1 className="tagline font-serif">
            Mostly thinking. Sometimes shipping.
          </h1>
          <p className="context mt-5">
            Building the platform for physical decision-making at Bricks.
          </p>
        </section>

        {/* Bottom row — availability + nav */}
        <footer className="bottom-row flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="availability">Taking on a few engagements a year.</p>
          <nav className="flex gap-6">
            <Link href="/work" className="nav-link">
              Work
            </Link>
            <Link href="/about" className="nav-link">
              About
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
