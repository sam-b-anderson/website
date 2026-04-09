import Link from "next/link";

export default function Projects() {
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
        <h1 className="hero-name font-serif">Projects</h1>

        <ul className="mt-8 flex flex-col gap-3">
          <li>
            <a href="https://mnth.io" target="_blank" rel="noopener noreferrer" className="nav-link">
              mnth.io
            </a>
          </li>
          <li>
            <a href="https://aislespy.app" target="_blank" rel="noopener noreferrer" className="nav-link">
              AisleSpy.app
            </a>
          </li>
          <li>
            <a href="https://nexustoolkit.com" target="_blank" rel="noopener noreferrer" className="nav-link">
              NexusToolkit.com
            </a>
          </li>
        </ul>

        <Link href="/" className="nav-link mt-auto self-start">
          &larr; Back
        </Link>
      </div>
    </main>
  );
}
