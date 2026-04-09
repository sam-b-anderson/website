import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <h1 className="font-serif text-4xl tracking-tight text-[var(--color-ink)]">
        Sam Anderson
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Head of Product at Bricks. Site in progress — more soon.
      </p>
      <nav className="mt-6 flex gap-6 text-sm">
        <Link
          href="/work"
          className="text-[var(--color-accent)] hover:underline"
        >
          Work &rarr;
        </Link>
        <Link
          href="/about"
          className="text-[var(--color-accent)] hover:underline"
        >
          About &rarr;
        </Link>
      </nav>
    </main>
  );
}
