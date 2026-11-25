import { GlobeIcon } from "@/components/icons";
import type { Edition } from "@/lib/editions";
import { EDITIONS } from "@/lib/editions";

/** "Edition: Türkiye" — a GET form so switching works without JS once more editions go live. */
export function EditionLabel({ edition }: { edition: Edition }) {
  const all = Object.values(EDITIONS);
  if (all.length < 2)
    return (
      <span className="tag">
        <GlobeIcon className="size-3.5" />
        Edition: {edition.countryName}
      </span>
    );
  return (
    <form method="get" className="inline-flex items-center gap-2">
      <label htmlFor="edition" className="text-[13px] text-text-2">
        Edition:
      </label>
      <select id="edition" name="edition" defaultValue={edition.code} className="field !h-9 !w-auto !rounded-full !px-3.5 !text-[13px]">
        {all.map((e) => (
          <option key={e.code} value={e.code}>
            {e.countryName}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex h-9 items-center rounded-full bg-text/10 px-4 text-[13px] font-medium transition-colors hover:bg-text/16">
        Go
      </button>
    </form>
  );
}
