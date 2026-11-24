/** Route-level skeleton: keeps the header/footer stable while a page streams in. */
export default function Loading() {
  return (
    <div className="wrap py-10 md:py-16" role="status" aria-label="Loading">
      <div className="h-9 w-2/3 max-w-[480px] animate-pulse rounded-full bg-white/6" />
      <div className="mt-4 h-4 w-1/2 max-w-[360px] animate-pulse rounded-full bg-white/5" />
      <ul className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 14 }, (_, i) => (
          <li key={i} className="aspect-[2/3] animate-pulse rounded-poster bg-white/[0.045]" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </ul>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
