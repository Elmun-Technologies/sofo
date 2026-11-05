/** Ranked single-series bar list (one hue, values in text ink, native tooltip on each row). */
export function BarList({ rows, empty = "No data", unit = "" }: { rows: { label: React.ReactNode; key: string; value: number }[]; empty?: string; unit?: string }) {
  if (rows.length === 0) return <p className="py-3 text-sm text-text-3">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.key} title={`${r.key}: ${r.value}${unit}`} className="group relative flex h-8 items-center gap-3 rounded-[8px] px-2 hover:bg-surface-2">
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 left-0 rounded-r-[4px] bg-orange/20 group-hover:bg-orange/30"
            style={{ width: `${(r.value / max) * 100}%` }}
          />
          <span className="relative min-w-0 grow truncate text-sm">{r.label}</span>
          <span className="relative text-sm font-bold text-text-2 tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
