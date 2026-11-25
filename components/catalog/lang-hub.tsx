import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/title/faq";
import { LangMark } from "@/components/ui/badges";
import { ChipLink } from "@/components/ui/chip";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { getPublishedLists } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { checkedLabel } from "@/lib/format";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getLangHub, type LangKindKey } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import type { LangState } from "@/lib/short-answer";
import { cap, catalogHref } from "./catalog-url";
import { CollectionCard } from "./collection-card";
import { HeroSearch } from "./hero-search";
import { PosterStack } from "./poster-stack";
import { ServiceTile } from "./service-tile";

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

function copy(e: Edition, k: LangKindKey) {
  const lang = langName(e.contentLang);
  const term = k === "dub" ? dubTerm(e.contentLang) : subTerm(e.contentLang);
  return k === "dub"
    ? {
        term,
        what: `${lang} audio`,
        short: `${lang} dub`,
        lead: `Watch in ${lang}.`,
        newTitle: `Newly dubbed into ${lang}`,
        path: e.routes.dubHub,
        faq: [
          {
            q: "Dublaj or altyazı — what's the difference?",
            a: `Dublaj means the voices are in ${lang}. Altyazı means the original voices with ${lang} text on screen. We show both separately for every service, because a title can have one without the other.`,
          },
          {
            q: `How do you know a title has ${lang} audio?`,
            a: `We only mark a dub when the service itself lists ${lang} audio for that title in ${e.countryName}. If the service doesn't say, we show "Not confirmed by the service" — we never guess.`,
          },
          {
            q: "Why is a dub on one service but not another?",
            a: "Each service licenses its own audio tracks. The same movie can come with a dub on one platform and only subtitles on another — that's why we check per service, every day.",
          },
        ],
      }
    : {
        term,
        what: `${lang} subtitles`,
        short: `${lang} subtitles`,
        lead: `Watch with ${lang} subtitles.`,
        newTitle: `New with ${lang} subtitles`,
        path: e.routes.subHub,
        faq: [
          {
            q: "Altyazı or dublaj — what's the difference?",
            a: `Altyazı keeps the original voices and adds ${lang} text on screen. Dublaj replaces the voices with ${lang} ones. We show both separately for every service.`,
          },
          {
            q: `How do you know a title has ${lang} subtitles?`,
            a: `Only when the service lists ${lang} subtitles for that title in ${e.countryName}. If it doesn't, we show "Not confirmed by the service".`,
          },
          {
            q: "Why do anime often get subtitles first?",
            a: "Subtitles are faster to produce, so many series arrive with altyazı and get a dub weeks or months later. We record the date a dub appears on each title's history.",
          },
        ],
      };
}

export async function langHubMetadata(e: Edition, k: LangKindKey): Promise<Metadata> {
  const c = copy(e, k);
  const hub = await getLangHub(e, k);
  return {
    title: `${cap(c.term)} — ${fmt(hub.total)} movies & series with ${c.what} in ${e.countryName}`,
    description: `Every movie and series with ${c.what} confirmed by the service in ${e.countryName}: Netflix, Disney+, Prime Video, HBO Max and Crunchyroll. Checked every day.`,
    alternates: buildAlternates(c.path, { [e.hreflang]: c.path }),
  };
}

export async function LangHub({ edition: e, kind: k }: { edition: Edition; kind: LangKindKey }) {
  const c = copy(e, k);
  const [hub, lists] = await Promise.all([getLangHub(e, k), getPublishedLists(e)]);
  const audio = k === "dub" ? "dub" : "sub";
  const lang = langName(e.contentLang);
  const heroCards = (hub.recent.length >= 3 ? hub.recent : hub.movies.concat(hub.series)).filter((x) => x.posterPath);
  const liveServices = hub.services.filter((s) => s.count > 0).length;
  const tab = (active: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition duration-200 ease-out ${
      active ? "bg-white text-ink hover:text-ink" : "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text hover:ring-white/30"
    }`;
  const states: { status: LangState; name: string; text: string }[] = [
    { status: "confirmed_yes", name: "Confirmed", text: `The service itself lists ${c.what} for this title in ${e.countryName}. Only then do we say yes.` },
    { status: "confirmed_no", name: "Not offered", text: `The service tells us the title comes without ${c.what}. A dash, nothing more.` },
    { status: "unknown", name: "Not confirmed", text: "The service hasn't said either way yet. We show exactly that — never a guess." },
  ];

  return (
    <>
      <header className="wrap pt-6 pb-8 md:pt-12 md:pb-14">
        <div className="flex items-end justify-between gap-12">
          <div className="min-w-0 flex-1">
            <nav aria-label="Language" className="flex flex-wrap gap-2">
              <Link href={e.routes.dubHub} aria-current={k === "dub" ? "page" : undefined} className={tab(k === "dub")}>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" />
                <span lang={e.hreflang}>{cap(dubTerm(e.contentLang))}</span>
              </Link>
              <Link href={e.routes.subHub} aria-current={k === "sub" ? "page" : undefined} className={tab(k === "sub")}>
                <span aria-hidden="true" className={`size-1.5 rounded-full ${k === "sub" ? "bg-ink/50" : "bg-white/70"}`} />
                <span lang={e.hreflang}>{cap(subTerm(e.contentLang))}</span>
              </Link>
            </nav>
            <h1 className="text-display mt-6 max-w-[15ch] md:mt-8 lg:max-w-[18ch]">
              {c.lead}{" "}
              <span className="text-text-3">
                <span className="md:hidden">{fmt(hub.total)} titles.</span>
                <span className="hidden md:inline">
                  {fmt(hub.total)} movies &amp; series{k === "dub" ? ` with ${c.what}` : ""}.
                </span>
              </span>
            </h1>
            <p className="tnum mt-5 flex items-start gap-2 text-[13px] text-text-2 md:mt-6 md:text-sm">
              <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-available md:mt-2" />
              <span>
                On {liveServices} services in {e.countryName} · checked every day
                {hub.lastCheckedAt ? ` · ${checkedLabel(hub.lastCheckedAt).replace(/^Checked/, "last check")}` : ""}
              </span>
            </p>
            <HeroSearch
              action={e.routes.search}
              label={`Search titles with ${c.what}`}
              audio={k}
              placeholder={`Search only titles with ${c.short}…`}
              className="mt-6 max-w-[560px] md:mt-8"
            />
          </div>
          <PosterStack cards={heroCards} />
        </div>
      </header>

      <section className="wrap py-6 md:py-10" aria-labelledby="by-service">
        <div className="rule mb-6 md:mb-8" />
        <SectionHeader id="by-service" title="By service" sub={`Titles with ${c.what} confirmed on each platform`} />
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {hub.services.map((s) => (
            <li key={s.slug}>
              <ServiceTile
                href={catalogHref(e.routes.movies, { service: s.slug, audio })}
                slug={s.slug}
                name={s.name}
                logoPath={s.logoPath}
                count={s.count}
                label={`${k === "dub" ? "dubbed" : "subtitled"} title${s.count === 1 ? "" : "s"}`}
              />
            </li>
          ))}
        </ul>
      </section>

      <PosterRow
        title={c.newTitle}
        sub="Last 30 days"
        cards={hub.recent}
        edition={e}
        badge={k === "dub" ? () => "new-dub" : undefined}
        href={e.routes.newLeaving}
      />
      <PosterRow title={`Movies — ${c.short}`} cards={hub.movies} edition={e} href={catalogHref(e.routes.movies, { audio })} />
      <PosterRow title={`Series — ${c.short}`} cards={hub.series} edition={e} href={catalogHref(e.routes.series, { audio })} />
      <PosterRow title={`Anime — ${c.short}`} cards={hub.anime} edition={e} href={catalogHref(e.routes.anime, { audio })} />
      <PosterRow title={`For kids — ${c.short}`} cards={hub.kids} edition={e} href={e.routes.kids} />

      {lists.length ? (
        <section id="collections" className="wrap scroll-mt-24 py-6 md:py-10" aria-labelledby="collections-title">
          <SectionHeader id="collections-title" title="Collections" sub="Picked by our editors" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {lists.map((l) => (
              <li key={l.id}>
                <CollectionCard edition={e} list={l} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* The wedge, explained: three states, never a guess. */}
      <section className="wrap py-8 md:py-14" aria-labelledby="lang-states">
        <div className="rule" />
        <div className="grid gap-x-10 gap-y-6 pt-6 md:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
          <div>
            <h2 id="lang-states" className="text-h2">
              How we show {lang} {k === "dub" ? "audio" : "subtitles"}
            </h2>
            <p className="mt-3 max-w-sm text-[15px] text-text-2">Language data comes from each service, per title and per country. There are only three things we will ever tell you.</p>
          </div>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-3 md:gap-3">
            {states.map((s, i) => (
              <li key={s.name} className="card flex flex-col p-5 md:min-h-[220px] md:p-6">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex h-7 items-center">
                    <LangMark status={s.status} />
                  </span>
                  <span aria-hidden="true" className="tnum text-xs text-text-3">
                    0{i + 1}
                  </span>
                </span>
                <h3 className="text-h3 mt-5 md:mt-auto md:pt-8">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-2">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 pt-4 pb-14 md:pt-6 md:pb-24 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <SectionHeader title={`About ${c.short} on streaming`} />
          <Faq items={c.faq} />
        </div>
        <aside className="panel h-fit p-5 md:p-6 lg:mt-[52px]">
          <h2 className="text-h3">Keep exploring</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              { href: k === "dub" ? e.routes.subHub : e.routes.dubHub, label: cap(k === "dub" ? subTerm(e.contentLang) : dubTerm(e.contentLang)), local: true },
              { href: e.routes.kids, label: "Kids" },
              { href: e.routes.newLeaving, label: "New & leaving" },
              ...hub.services.slice(0, 4).map((s) => ({ href: paths.service(e, s.slug), label: s.name })),
            ].map((l) => (
              <li key={l.href}>
                <ChipLink href={l.href}>
                  <span lang={"local" in l && l.local ? e.hreflang : undefined}>{l.label}</span>
                </ChipLink>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-text-3">
            Language data comes from each service. When a service doesn&apos;t say, we show &ldquo;Not confirmed by the service&rdquo; — never a
            guess.
          </p>
        </aside>
      </section>
    </>
  );
}
