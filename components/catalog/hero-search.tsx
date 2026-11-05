import { SearchIcon } from "@/components/icons";

/** Plain GET form into the search page — works without JS. */
export function HeroSearch({ action, placeholder, label, className = "" }: { action: string; placeholder: string; label: string; className?: string }) {
  return (
    <form action={action} role="search" className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-orange" />
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={placeholder}
        className="h-12 w-full rounded-input border border-line bg-ink/80 pr-4 pl-11 text-[15px] text-text placeholder:text-text-3 focus:border-orange focus:outline-none md:h-14"
      />
    </form>
  );
}
