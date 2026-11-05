import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { EditionSuggest } from "@/components/retention/edition-suggest";
import { EDITIONS } from "@/lib/editions";
import { localLangName } from "@/lib/lang";
import { buildAlternates } from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: { absolute: "sofo — choose your edition" },
  description: "Find where to watch any movie or series — in your country and your language. Pick your sofo edition.",
  alternates: buildAlternates(
    "/",
    Object.fromEntries(Object.values(EDITIONS).map((e) => [e.hreflang, e.routes.home])),
  ),
};

/** Planned editions (board Editions) — shown as "soon", not routable. */
const PLANNED: { code: string; name: string; langs: string }[] = [
  { code: "US", name: "United States", langs: "English · Español" },
  { code: "DE", name: "Deutschland", langs: "Deutsch · English" },
  { code: "FR", name: "France", langs: "Français" },
  { code: "ES", name: "España", langs: "Español" },
  { code: "MX", name: "México", langs: "Español" },
  { code: "BR", name: "Brasil", langs: "Português" },
  { code: "UA", name: "Україна", langs: "Українська · English" },
  { code: "UZ", name: "Oʻzbekiston", langs: "Oʻzbekcha · Русский" },
  { code: "SA", name: "Saudi Arabia", langs: "العربية · English" },
  { code: "AZ", name: "Azərbaycan", langs: "Azərbaycanca" },
  { code: "KZ", name: "Қазақстан", langs: "Қазақша · Русский" },
];

// Edition picker at "/". No IP auto-redirect — the user chooses (the banner only suggests).
export default function EditionPicker() {
  const live = Object.values(EDITIONS);
  const first = live[0];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line-soft">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between px-4 md:h-[70px] md:px-7">
          <Link href="/" aria-label="sofo — home" className="hover:text-text">
            <Logo className="text-[26px] md:text-[28px]" />
          </Link>
          <span className="rounded-button bg-surface px-3 py-2 text-xs font-extrabold text-text md:text-sm">UI · English</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-site grow px-4 pt-5 pb-12 md:px-7 md:pt-6">
        <EditionSuggest
          editions={live.map((e) => ({ code: e.code, country: e.country, countryName: e.countryName, home: e.routes.home, langs: [e.contentLang] }))}
        />

        <div className="mt-6 flex flex-col gap-1 md:mt-12 md:flex-row md:items-baseline md:gap-3">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[28px]">Choose your edition</h1>
          <p className="text-sm text-text-2 md:text-[15px]">Each country has its own catalog, prices and languages</p>
        </div>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
          {live.map((e) => (
            <li key={e.code}>
              <Link
                href={e.routes.home}
                className="flex h-[78px] items-center gap-3.5 rounded-card border border-orange bg-orange-deep px-4 hover:border-orange-hover hover:text-text md:px-5"
              >
                <CodeBadge code={e.country} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-extrabold">{e.countryName}</span>
                  <span className="block truncate text-xs text-text-2 md:text-sm">{localLangName(e.contentLang)} · English</span>
                </span>
                <span className="rounded-chip bg-orange px-2 py-0.5 text-[11px] font-extrabold text-ink">LIVE</span>
              </Link>
            </li>
          ))}
          {PLANNED.map((p) => (
            <li
              key={p.code}
              className="flex h-[78px] items-center gap-3.5 rounded-card border border-line bg-surface px-4 md:px-5"
            >
              <CodeBadge code={p.code} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-extrabold text-text">{p.name}</span>
                <span className="block truncate text-xs text-text-2 md:text-sm">{p.langs}</span>
              </span>
              <span className="text-xs font-bold text-text-3">Soon<span className="sr-only"> — not available yet</span></span>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-sm text-text-2">
          sofo shows where a movie or series is streaming legally — and whether it has audio or subtitles in your language. We never host
          video and never guess a language the service doesn&apos;t confirm.
        </p>
      </main>

      {first ? (
        <footer className="border-t border-line-soft">
          <div className="mx-auto flex max-w-site flex-wrap gap-x-5 gap-y-2 px-4 py-5 text-xs text-text-3 md:px-7">
            <Link href={first.routes.about} className="text-text-2">
              About
            </Link>
            <Link href={first.routes.privacy} className="text-text-2">
              Privacy (KVKK)
            </Link>
            <Link href={`${first.routes.privacy}#terms`} className="text-text-2">
              Terms
            </Link>
            <span className="md:ml-auto">Metadata &amp; images: TMDB · availability checked daily</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function CodeBadge({ code }: { code: string }) {
  return (
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-extrabold md:size-11">
      {code}
    </span>
  );
}
