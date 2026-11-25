import { ChevronDownIcon, SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";

/** Home hero search: plain GET form to the results page (works without JS). */
export function HeroSearch({ action, langLabel }: { action: string; langLabel: string }) {
  return (
    <form role="search" action={action} className="mx-auto mt-7 w-full max-w-[820px] md:mt-9">
      <div className="group/search relative">
        <div className="relative flex items-center gap-1.5 rounded-full border border-white/15 bg-surface/90 p-1.5 pl-5 backdrop-blur-xl transition duration-200 group-focus-within/search:border-white/60 group-focus-within/search:shadow-[0_0_0_5px_rgb(255_255_255/0.07)] md:gap-2 md:p-2 md:pl-6">
          <SearchIcon className="size-5 shrink-0 text-text-2 transition-colors group-focus-within/search:text-white md:size-[22px]" />
          <label htmlFor="hero-q" className="sr-only">
            Search
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Search a title…"
            className="h-11 min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-text-3 md:h-12 md:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          <label className="relative shrink-0">
            <span className="sr-only">Audio language</span>
            <select
              name="audio"
              defaultValue="dub"
              className="h-10 appearance-none rounded-full bg-white/8 pr-8 pl-4 text-[13px] font-medium outline-none transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white md:h-12 md:pr-9 md:pl-5 md:text-sm"
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
          <button type="submit" aria-label="Search" className={`${buttonClass("primary", "md")} size-10 !px-0 md:hidden`}>
            <SearchIcon className="size-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
