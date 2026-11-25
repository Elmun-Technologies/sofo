import { ArrowRightIcon, SearchIcon } from "@/components/icons";

/** Plain GET form into the search page — works without JS. */
export function HeroSearch({ action, placeholder, label, audio, className = "" }: { action: string; placeholder: string; label: string; audio?: "dub" | "sub"; className?: string }) {
  return (
    <form action={action} role="search" className={`group/hs relative ${className}`}>
      {audio ? <input type="hidden" name="audio" value={audio} /> : null}
      <SearchIcon className="pointer-events-none absolute top-1/2 left-5 size-[18px] -translate-y-1/2 text-text-3 transition-colors group-focus-within/hs:text-text" />
      <input
        type="search"
        name="q"
        autoComplete="off"
        enterKeyHint="search"
        aria-label={label}
        placeholder={placeholder}
        className="h-[52px] w-full min-w-0 rounded-full border border-hairline-strong bg-text/[0.04] pr-14 pl-12 text-[15px] font-medium text-text transition duration-200 ease-out outline-none placeholder:font-normal placeholder:text-text-3 hover:border-text/25 focus:border-text/60 focus:bg-text/[0.06] md:h-14 md:text-base [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-text text-ink transition duration-200 ease-out hover:bg-text/85 active:scale-95 md:size-11"
      >
        <ArrowRightIcon className="size-[18px]" />
      </button>
    </form>
  );
}
