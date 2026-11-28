import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, GlobeIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { EditionSuggest } from "@/components/retention/edition-suggest";
import { serviceOptions } from "@/components/retention/service-names";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
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

const PROMISES = [
  { title: "Legal services only", body: "Every link opens the title on the official service. We never host video and never link to pirate sites." },
  { title: "Your language, confirmed", body: "Audio and subtitles are shown only when the service confirms them. Otherwise you see “not confirmed” — never a guess." },
  { title: "Checked daily", body: "Catalogs, prices and languages are re-checked every day, and every result shows when it was last checked." },
];

const pad = (n: number) => String(n).padStart(2, "0");

// Edition picker at "/". No IP auto-redirect — the user chooses (the banner only suggests).
export default function EditionPicker() {
  const live = Object.values(EDITIONS);
  const first = live[0];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="wrap flex h-16 items-center justify-between md:h-20">
        <Link href="/">
          <Logo className="text-[26px] md:text-[28px]" />
        </Link>
        <span className="tag">
          <GlobeIcon className="size-3.5" />
          UI · English
        </span>
      </header>

      <main className="grow">
        <div className="wrap">
          <EditionSuggest
            editions={live.map((e) => ({ code: e.code, country: e.country, countryName: e.countryName, home: e.routes.home, langs: [e.contentLang] }))}
          />
        </div>

        {/* The promise */}
        <section className="wrap pt-12 pb-14 md:pt-24 md:pb-24">
          <ul className="flex flex-wrap gap-2">
            <li className="tag">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
              Legal services only
            </li>
            <li className="tag">Checked daily</li>
            <li className="tag max-sm:hidden">Free · no account</li>
          </ul>
          <div className="mt-7 grid gap-8 md:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-16">
            <h1 className="text-display max-w-[13ch]">
              Every movie. Every service. <span className="text-text-3">Your language.</span>
            </h1>
            <div>
              <p className="max-w-md text-base text-text-2 md:text-lg md:leading-relaxed">
                sofo shows where a movie or series is streaming legally — and whether it has audio or subtitles in your language.
              </p>
              {first ? (
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link href={first.routes.home} className={`${buttonClass("primary", "lg")} max-sm:w-full`}>
                    Open sofo {first.countryName}
                    <ArrowRightIcon className="size-[18px]" />
                  </Link>
                  <a href="#editions" className="link !font-medium max-sm:hidden">
                    All editions
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* 01 — editions */}
        <section id="editions" aria-labelledby="editions-h" className="wrap scroll-mt-6 pb-14 md:pb-24">
          <div className="rule" />
          <div className="grid gap-x-10 gap-y-3 pt-6 pb-8 md:grid-cols-[160px_minmax(0,1fr)] md:pt-8 md:pb-12 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,360px)]">
            <span aria-hidden="true" className="tnum text-sm text-text-3">
              01.
            </span>
            <h2 id="editions-h" className="text-h1">
              Choose your edition
            </h2>
            <p className="max-w-sm text-[15px] text-text-2 md:col-start-2 lg:col-start-3 lg:self-end">Each country has its own catalog, prices and languages.</p>
          </div>

          <ul className="grid gap-3 md:gap-4">
            {live.map((e) => (
              <li key={e.code}>
                <Link
                  href={e.routes.home}
                  className="group relative block rounded-hero border border-hairline-strong bg-surface p-6 transition-colors duration-200 hover:border-text/30 hover:bg-surface-2 md:p-10"
                >
                  <span className="flex items-center gap-3">
                    <span className="tag !border-available/40 !text-available">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
                      Live
                    </span>
                    <span className="tnum text-sm text-text-3">{e.country}</span>
                  </span>
                  <span aria-hidden="true" className="absolute top-5 right-5 flex size-12 items-center justify-center rounded-full bg-text text-ink transition-transform duration-200 ease-out group-hover:scale-105 md:top-9 md:right-9 md:size-14">
                    <ArrowUpRightIcon className="size-5 md:size-6" />
                  </span>
                  <span className="mt-8 grid gap-6 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
                    <span className="block min-w-0">
                      <span className="text-display block">{e.countryName}</span>
                      <span className="mt-3 block text-[15px] text-text-2 md:text-base">
                        {localLangName(e.contentLang)} · English — {e.coreServices.length} services checked daily
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5" aria-hidden="true">
                      {serviceOptions(e.coreServices).map((s) => (
                        <ServiceLogo key={s.slug} slug={s.slug} name="" size={32} />
                      ))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p lang="en" className="overline mt-10 mb-4 text-text-3 md:mt-14">
            On the way · {PLANNED.length} editions
          </p>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {PLANNED.map((p) => (
              <li key={p.code} className="flex min-w-0 flex-col justify-between gap-6 rounded-card border border-hairline p-4 md:gap-8 md:p-5">
                <span className="flex items-center justify-between gap-2">
                  <span aria-hidden="true" className="tnum text-sm text-text-3">
                    {p.code}
                  </span>
                  <span className="tag !h-6 !px-2.5 !text-[11px] !text-text-3">
                    Soon<span className="sr-only"> — not available yet</span>
                  </span>
                </span>
                <span className="block min-w-0">
                  <span className="block truncate text-[17px] leading-tight font-medium tracking-[-0.02em] text-text md:text-xl">{p.name}</span>
                  <span className="mt-1 block truncate text-xs text-text-3 md:text-[13px]">{p.langs}</span>
                </span>
              </li>
            ))}
            {first ? (
              <li className="min-w-0">
                <Link
                  href={`${first.routes.about}#contact`}
                  className="group flex h-full flex-col justify-between gap-6 rounded-card border border-dashed border-hairline-strong p-4 transition-colors duration-200 hover:border-text/30 md:gap-8 md:p-5"
                >
                  <ArrowRightIcon className="size-4 self-end text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
                  <span className="block min-w-0">
                    <span className="block truncate text-[17px] leading-tight font-medium tracking-[-0.02em] md:text-xl">Your country?</span>
                    <span className="mt-1 block truncate text-xs text-text-3 md:text-[13px]">Tell us where to go next</span>
                  </span>
                </Link>
              </li>
            ) : null}
          </ul>
        </section>

        {/* 02 — what we promise */}
        <section aria-labelledby="promise-h" className="wrap pb-16 md:pb-28">
          <div className="rule" />
          <div className="grid gap-x-10 gap-y-3 pt-6 pb-8 md:grid-cols-[160px_minmax(0,1fr)] md:pt-8 md:pb-12 lg:grid-cols-[240px_minmax(0,1fr)]">
            <span aria-hidden="true" className="tnum text-sm text-text-3">
              02.
            </span>
            <h2 id="promise-h" className="text-h1 max-w-[18ch]">
              A guide, not a streaming site
            </h2>
          </div>
          <ol className="grid gap-3 md:grid-cols-3 md:gap-4">
            {PROMISES.map((p, i) => (
              <li key={p.title} className="panel flex flex-col p-6 md:min-h-[280px] md:p-8">
                <span aria-hidden="true" className="numeral text-text-3">
                  {pad(i + 1)}
                </span>
                <span className="mt-8 block md:mt-auto">
                  <span className="text-h3 block">{p.title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-text-2 md:text-[15px]">{p.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {first ? (
        <footer className="wrap">
          <div className="rule" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-6 text-[13px] text-text-3 md:py-8">
            <Link href={first.routes.about} className="text-text-2">
              About
            </Link>
            <Link href={first.routes.privacy} className="text-text-2">
              Privacy (KVKK)
            </Link>
            <Link href={`${first.routes.privacy}#terms`} className="text-text-2">
              Terms
            </Link>
            <span className="max-md:basis-full md:ml-auto">Metadata &amp; images: TMDB · availability checked daily</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
