import { DEMO_DATA } from "@/lib/site";

/** Site-wide notice while the catalogue is sample data (lib/site.ts DEMO_DATA). */
export function DemoBanner() {
  if (!DEMO_DATA) return null;
  return (
    <div role="note" className="border-b border-leaving/20 bg-[#1d1708] px-4 py-1.5 text-center text-xs leading-5 font-semibold text-leaving">
      <span lang="en" className="mr-2 rounded-[5px] bg-leaving px-1.5 py-px text-[10px] font-extrabold tracking-[0.08em] text-ink uppercase">
        Demo
      </span>
      Titles, prices and dub information are sample data, not real availability.
    </div>
  );
}
