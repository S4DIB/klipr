"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow mb-3">Something broke</p>
        <h1 className="display text-4xl text-text-hi">An unexpected error occurred</h1>
        <p className="mt-3 text-text-mid">Try again, or head back home.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="h-11 rounded-full bg-volt-500 px-6 text-sm font-medium text-white hover:bg-volt-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="grid h-11 place-items-center rounded-full border border-line px-6 text-sm text-text-hi hover:border-volt-400"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
