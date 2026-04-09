import Link from "next/link";

export default function About() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <h1 className="font-serif text-3xl tracking-tight text-[var(--color-ink)]">
        About
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        The machine lives here. Coming in Session 3.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[var(--color-accent)] hover:underline"
      >
        &larr; Back
      </Link>
    </main>
  );
}
