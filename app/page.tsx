import Link from "next/link";
import { HeroName } from "@/components/hero-name";
import { ForestReveal } from "@/components/forest-reveal";
import { DecayText } from "@/components/decay-text";

export default function Home() {
  return (
    <main
      className="paper-bg relative min-h-dvh"
      style={{ background: "var(--color-bg)" }}
    >
      <ForestReveal />
      <div
        className="front-door relative z-10 mx-auto flex min-h-dvh flex-col"
        style={{
          maxWidth: "56rem",
          padding: "clamp(2rem, 4vw, 4rem)",
        }}
      >
        {/* Top row — metadata only, right-aligned */}
        <header className="flex justify-end">
          <DecayText
            className="eyebrow font-mono"
            delay={0.15}
            cleanFont='"JetBrains Mono", monospace'
          >
            sambanderson.com &middot; EST. 2026
          </DecayText>
        </header>

        {/* Middle — hero name + context */}
        <section style={{ marginTop: "clamp(4rem, 10vh, 8rem)" }}>
          <HeroName />
          <DecayText className="context mt-5" delay={0}>
            Building digital products that shape how the physical world
            operates.
          </DecayText>
        </section>

        {/* Bottom row — availability + nav, pushed to bottom */}
        <footer className="bottom-row mt-auto flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <DecayText className="availability" delay={0.15}>
            Open to a few engagements this year.
          </DecayText>
          <nav className="flex gap-6">
            <Link href="/work" className="nav-link">
              <DecayText delay={0.3}>Work</DecayText>
            </Link>
            <Link href="/projects" className="nav-link">
              <DecayText delay={0.3}>Projects</DecayText>
            </Link>
            <Link href="/about" className="nav-link">
              <DecayText delay={0.3}>About</DecayText>
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
