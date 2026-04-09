import Link from "next/link";

export default function Work() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <h1 className="font-serif text-3xl tracking-tight text-[var(--color-ink)]">
        Work
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        The card pack lives here. Coming in Session 2.
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
