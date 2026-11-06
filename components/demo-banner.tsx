import { DEMO_DATA } from "@/lib/site";

/** Site-wide notice while the catalogue is sample data (lib/site.ts DEMO_DATA). */
export function DemoBanner() {
  if (!DEMO_DATA) return null;
  return (
    <div role="note" className="bg-leaving px-4 py-1.5 text-center text-[13px] font-bold text-ink">
      Demo preview — titles, prices and dub information are sample data, not real availability.
    </div>
  );
}
