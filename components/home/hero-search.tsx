import { SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";

/** Home hero search: plain GET form to the results page (works without JS). */
export function HeroSearch({ action, langLabel }: { action: string; langLabel: string }) {
  return (
    <form role="search" action={action} className="mx-auto mt-7 w-full max-w-[860px]">
      <div className="flex items-center gap-2 rounded-panel border border-orange/60 bg-surface p-1.5 pl-4 shadow-[0_0_0_6px_rgba(255,90,31,0.08)] md:gap-3 md:p-2 md:pl-5">
        <SearchIcon className="size-5 shrink-0 text-orange md:size-[22px]" />
        <label htmlFor="hero-q" className="sr-only">
          Search
        </label>
        <input
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search movies, series, anime, people…"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-text-3 md:h-12 md:text-lg"
        />
        <label className="relative shrink-0">
          <span className="sr-only">Audio language</span>
          <select
            name="audio"
            defaultValue="dub"
            className="h-9 appearance-none rounded-button bg-surface-2 pr-7 pl-3 text-[13px] font-extrabold outline-none md:h-12 md:pr-8 md:pl-4 md:text-sm"
          >
            <option value="dub">{langLabel} dub</option>
            <option value="sub">{langLabel} subs</option>
            <option value="">Any language</option>
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs md:right-3">
            ▾
          </span>
        </label>
        <span className="hidden md:block">
          <button type="submit" className={`${buttonClass("primary")} h-12 px-6 text-base`}>
            Search
          </button>
        </span>
      </div>
    </form>
  );
}
