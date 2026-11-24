import { ChevronDownIcon, SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";

/** Home hero search: plain GET form to the results page (works without JS). */
export function HeroSearch({ action, langLabel }: { action: string; langLabel: string }) {
  return (
    <form role="search" action={action} className="mx-auto mt-7 w-full max-w-[820px] md:mt-9">
      <div className="group/search relative">
        {/* Brand glow behind the field */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-[22px] bg-gradient-to-r from-orange/70 via-orange/25 to-dub/50 opacity-60 blur-[14px] transition-opacity duration-300 group-focus-within/search:opacity-100" />
        <div className="relative flex items-center gap-1.5 rounded-panel border border-white/15 bg-surface/95 p-1.5 pl-4 shadow-pop backdrop-blur-xl transition-colors duration-200 group-focus-within/search:border-orange md:gap-2 md:p-2 md:pl-5">
          <SearchIcon className="size-5 shrink-0 text-text-2 transition-colors group-focus-within/search:text-orange md:size-[22px]" />
          <label htmlFor="hero-q" className="sr-only">
            Search
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Search a movie, series or anime…"
            className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:text-text-3 md:h-12 md:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          <label className="relative shrink-0">
            <span className="sr-only">Audio language</span>
            <select
              name="audio"
              defaultValue="dub"
              className="h-10 appearance-none rounded-button bg-white/8 pr-8 pl-3 text-[13px] font-extrabold outline-none transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-orange md:h-12 md:pr-9 md:pl-4 md:text-sm"
            >
              <option value="dub">{langLabel} dub</option>
              <option value="sub">{langLabel} subs</option>
              <option value="">Any language</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-text-2" />
          </label>
          <button type="submit" className={`${buttonClass("primary", "lg")} max-md:hidden`}>
            Search
          </button>
          <button type="submit" aria-label="Search" className={`${buttonClass("primary", "md")} w-10 !px-0 md:hidden`}>
            <SearchIcon className="size-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
