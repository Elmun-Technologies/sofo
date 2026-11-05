import type { Metadata } from "next";
import Link from "next/link";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { getPublishedLists } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { checkedLabel } from "@/lib/format";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getLangHub, type LangKindKey } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
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
    description: `Every movie and series with ${c.what} confirmed by the service in ${e.countryName}: Netflix, Disney+, Prime Video, HBO Max, TOD, tabii, Exxen and Gain. Checked every day.`,
    alternates: buildAlternates(c.path, { [e.hreflang]: c.path }),
  };
}

export async function LangHub({ edition: e, kind: k }: { edition: Edition; kind: LangKindKey }) {
  const c = copy(e, k);
  const [hub, lists] = await Promise.all([getLangHub(e, k), getPublishedLists(e)]);
  const audio = k === "dub" ? "dub" : "sub";
  const heroCards = (hub.recent.length >= 3 ? hub.recent : hub.movies.concat(hub.series)).filter((x) => x.posterPath);
  const tab = (active: boolean) =>
    `inline-flex h-8 items-center rounded-chip px-3.5 text-[13px] font-bold md:h-9 md:text-sm ${active ? "bg-white text-ink hover:text-ink" : "border border-line bg-surface/70 text-text hover:text-text"}`;

  return (
    <>
      <section className="mx-auto max-w-site px-4 pt-4 md:px-7 md:pt-6">
        <div className="relative flex items-center gap-8 overflow-hidden rounded-hero border border-line bg-[radial-gradient(120%_140%_at_85%_0%,#1b2a44_0%,#121826_40%,#0d0f15_75%)] px-5 py-6 md:px-10 md:py-11">
          <div className="min-w-0 grow">
            <nav aria-label="Language" className="flex flex-wrap gap-2">
              <Link href={e.routes.dubHub} aria-current={k === "dub" ? "page" : undefined} className={tab(k === "dub")}>
                {cap(dubTerm(e.contentLang))}
              </Link>
              <Link href={e.routes.subHub} aria-current={k === "sub" ? "page" : undefined} className={tab(k === "sub")}>
                {cap(subTerm(e.contentLang))}
              </Link>
            </nav>
            <h1 className="mt-4 text-[32px] leading-[1.06] font-extrabold tracking-[-0.03em] md:mt-5 md:text-[52px]">
              {c.lead}
              <br />
              <span className="md:hidden">{fmt(hub.total)} titles.</span>
              <span className="hidden md:inline">
                {fmt(hub.total)} movies &amp; series with {c.what}.
              </span>
            </h1>
            <p className="mt-3 text-[13px] text-text-2 md:text-[15px]">
              On {hub.services.filter((s) => s.count > 0).length} services in {e.countryName} · checked every day
              {hub.lastCheckedAt ? ` · ${checkedLabel(hub.lastCheckedAt).replace(/^Checked/, "last check")}` : ""}
            </p>
            <HeroSearch
              action={e.routes.search}
              label={`Search titles with ${c.what}`}
              placeholder={`Search only titles with ${c.short}…`}
              className="mt-5 max-w-xl"
            />
          </div>
          <PosterStack cards={heroCards} />
        </div>
      </section>

      <section className="mx-auto max-w-site px-4 pt-7 md:px-7 md:pt-10" aria-labelledby="by-service">
        <SectionHeader id="by-service" title="By service" />
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {hub.services.map((s, i) => (
            <li key={s.slug} className={i >= 4 ? "hidden md:block" : undefined}>
              <ServiceTile
                href={catalogHref(e.routes.movies, { service: s.slug, audio })}
                slug={s.slug}
                name={s.name}
                logoPath={s.logoPath}
                line={`${fmt(s.count)} title${s.count === 1 ? "" : "s"}`}
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
        <section id="collections" className="mx-auto max-w-site scroll-mt-20 px-4 py-5 md:px-7 md:py-7" aria-labelledby="collections-title">
          <SectionHeader id="collections-title" title="Collections" sub="Picked by our editors" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
            {lists.map((l) => (
              <li key={l.id}>
                <CollectionCard edition={e} list={l} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-site gap-6 px-4 pt-5 pb-12 md:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-8">
        <div>
          <h2 className="mb-4 text-xl font-extrabold tracking-[-0.02em] md:text-2xl">About {c.short} on streaming</h2>
          <div className="space-y-3">
            {c.faq.map((f, i) => (
              <details key={f.q} open={i === 0} className="group rounded-card border border-line bg-surface px-4 py-3.5">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-extrabold [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="text-[11px] transition group-open:rotate-90">
                    ▶
                  </span>
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-panel border border-line bg-surface p-5">
          <h2 className="text-[15px] font-extrabold">Keep exploring</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[
              { href: k === "dub" ? e.routes.subHub : e.routes.dubHub, label: cap(k === "dub" ? subTerm(e.contentLang) : dubTerm(e.contentLang)) },
              { href: e.routes.kids, label: "Kids" },
              { href: e.routes.newLeaving, label: "New & leaving" },
              ...hub.services.slice(0, 4).map((s) => ({ href: paths.service(e, s.slug), label: s.name })),
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex h-8 items-center rounded-chip border border-line px-3 text-[13px] font-bold text-text">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-text-3">
            Language data comes from each service. When a service doesn&apos;t say, we show &ldquo;Not confirmed by the service&rdquo; — never a
            guess.
          </p>
        </aside>
      </section>
    </>
  );
}
