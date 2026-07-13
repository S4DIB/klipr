import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="display text-7xl text-volt-grad">404</p>
        <h1 className="display mt-2 text-3xl text-text-hi">Page not found</h1>
        <p className="mt-3 text-text-mid">
          The page you&rsquo;re after doesn&rsquo;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-grid h-11 place-items-center rounded-full bg-volt-500 px-6 text-sm font-medium text-white hover:bg-volt-400"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
