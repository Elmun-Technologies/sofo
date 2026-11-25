/** Ranked single-series bar list (one neutral hue, values in text ink, native tooltip on each row). */
export function BarList({ rows, empty = "No data", unit = "" }: { rows: { label: React.ReactNode; key: string; value: number }[]; empty?: string; unit?: string }) {
  if (rows.length === 0) return <p className="py-2 text-sm text-text-3">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="-mx-2 space-y-0.5">
      {rows.map((r) => (
        <li key={r.key} title={`${r.key}: ${r.value}${unit}`} className="group relative flex h-9 items-center gap-3 px-2">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-0 min-w-1 rounded-[8px] bg-white/[0.07] transition-colors duration-150 group-hover:bg-white/[0.12]"
            style={{ width: `${(r.value / max) * 100}%` }}
          />
          <span className="relative min-w-0 grow truncate text-sm">{r.label}</span>
          <span className="tnum relative text-sm font-medium text-text-2">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
