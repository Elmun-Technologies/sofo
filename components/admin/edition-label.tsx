import type { Edition } from "@/lib/editions";
import { EDITIONS } from "@/lib/editions";

/** "Edition: Türkiye" — a GET form so switching works without JS once more editions go live. */
export function EditionLabel({ edition }: { edition: Edition }) {
  const all = Object.values(EDITIONS);
  if (all.length < 2) return <span>Edition: {edition.countryName}</span>;
  return (
    <form method="get" className="inline-flex items-center gap-2">
      <label htmlFor="edition">Edition:</label>
      <select id="edition" name="edition" defaultValue={edition.code} className="rounded-input border border-line bg-surface px-2 py-1">
        {all.map((e) => (
          <option key={e.code} value={e.code}>
            {e.countryName}
          </option>
        ))}
      </select>
      <button type="submit" className="text-orange">Go</button>
    </form>
  );
}
