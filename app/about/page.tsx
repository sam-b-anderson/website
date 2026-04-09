import Link from "next/link";

export default function About() {
  return (
    <main
      className="paper-bg relative min-h-dvh"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="relative z-10 mx-auto flex min-h-dvh flex-col"
        style={{
          maxWidth: "56rem",
          padding: "clamp(2rem, 4vw, 4rem)",
        }}
      >
        <p className="context">Coming soon.</p>

        <Link href="/" className="nav-link mt-auto self-start">
          &larr; Back
        </Link>
      </div>
    </main>
  );
}
