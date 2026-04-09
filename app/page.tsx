import Link from "next/link";
import { HeroName } from "@/components/hero-name";

export default function Home() {
  return (
    <main
      className="paper-bg relative min-h-dvh"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="front-door relative z-10 mx-auto flex min-h-dvh flex-col"
        style={{
          maxWidth: "56rem",
          padding: "clamp(2rem, 4vw, 4rem)",
        }}
      >
        {/* Top row — metadata only, right-aligned */}
        <header className="flex justify-end">
          <p className="eyebrow font-mono">
            sambanderson.com &middot; EST. 2026
          </p>
        </header>

        {/* Middle — hero name + context */}
        <section style={{ marginTop: "clamp(4rem, 10vh, 8rem)" }}>
          <HeroName />
          <p className="context mt-5">
            Building the platform for physical decision-making at Bricks.
          </p>
        </section>

        {/* Bottom row — availability + nav, pushed to bottom */}
        <footer className="bottom-row mt-auto flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="availability">Taking on a few engagements a year.</p>
          <nav className="flex gap-6">
            <Link href="/work" className="nav-link">
              Work
            </Link>
            <Link href="/projects" className="nav-link">
              Projects
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
