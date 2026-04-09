import Link from "next/link";

export default function Work() {
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
        <h1 className="hero-name font-serif">Work</h1>

        <ul className="mt-8 flex flex-col gap-3">
          <li className="context">Bricks 2025</li>
          <li className="context">Equips 2021</li>
          <li className="context">MapMyCustomers 2019</li>
          <li className="context">Teach For America 2017</li>
        </ul>

        <Link href="/" className="nav-link mt-auto self-start">
          &larr; Back
        </Link>
      </div>
    </main>
  );
}
