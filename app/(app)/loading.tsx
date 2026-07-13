export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-ink-800" />
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-ink-850" />
        ))}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl border border-line bg-ink-850" />
        ))}
      </div>
    </div>
  );
}
