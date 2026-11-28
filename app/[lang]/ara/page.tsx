import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowRightIcon, ArrowUpRightIcon, ChevronRightIcon, FilmIcon, LayersIcon, ListIcon, SearchIcon, StarIcon, TrendingIcon, TvIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { RecentSearchChips } from "@/components/search/recent-search-chips";
import { RememberSearch } from "@/components/search/remember-search";
import { RequestTitleForm } from "@/components/search/request-title-form";
import { SearchCombobox } from "@/components/search/search-combobox";
import { Pill } from "@/components/ui/badges";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { PosterGrid } from "@/components/ui/poster-grid";
import { PosterImage } from "@/components/ui/poster-image";
import { SectionHeader } from "@/components/ui/section-header";
import type { TitleCard } from "@/lib/catalog";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { initials } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getTopOffer, getTrendingSearches, parseAudio, recordSearch, searchAll, type AudioFilter, type SearchResult } from "@/lib/search";
import { offerVerb } from "@/lib/services";
import { requestTitle } from "./actions";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "");

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/ara">): Promise<Metadata> {
  const q = first((await searchParams).q).trim().slice(0, 100);
  return {
    title: q ? `“${q}” — search` : "Search",
    // PRD §6: search results are never indexed.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[lang]/ara">) {
  const edition = getEdition((await params).lang);
  if (!edition) notFound();
  const sp: SP = await searchParams;
  const q = first(sp.q).slice(0, 200);
  const audio = parseAudio(first(sp.audio));
  const action = edition.routes.search;

  const result = q.trim() ? await searchAll(edition, q, { audio, limit: 30 }) : null;

  // One SearchStat +1 per submitted search (aggregate, no personal data). Filter changes are refinements, not new searches.
  if (result?.query && !audio) {
    const zero = result.total === 0;
    after(() => recordSearch(edition, result.query, zero).catch((err) => console.error("search_stat", err)));
  }

  const shown = q.trim();

  return (
    <div className="wrap pt-6 pb-16 md:pt-12 md:pb-24">
      <header className="max-w-[820px]">
        <p lang="en" className="overline text-text-3">
          Search · {edition.countryName}
        </p>
        <h1 className="text-h1 mt-3 break-words">
          {shown ? (
            <>
              <span className="sr-only">Search results for “{shown}”</span>
              <span aria-hidden="true">
                <span className="text-text-3">Results for</span> “{shown}”
              </span>
            </>
          ) : (
            <>
              <span className="sr-only">Search</span>
              <span aria-hidden="true">
                Find it. <span className="text-text-3">In your language.</span>
              </span>
            </>
          )}
        </h1>
        <div className="mt-6 md:mt-8">
          <SearchCombobox key={q} action={action} variant="page" defaultValue={q} autoFocus={!shown} keepParams={audio ? { audio } : undefined} />
        </div>
        <AudioChips edition={edition} q={shown} audio={audio} />
      </header>

      {result ? (
        <>
          <RememberSearch q={shown} />
          <Results edition={edition} result={result} audio={audio} />
        </>
      ) : (
        <EmptyQuery edition={edition} />
      )}
    </div>
  );
}

function AudioChips({ edition, q, audio }: { edition: Edition; q: string; audio: AudioFilter | undefined }) {
  const href = (a?: AudioFilter) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (a) sp.set("audio", a);
    const s = sp.toString();
    return s ? `${edition.routes.search}?${s}` : edition.routes.search;
  };
  return (
    <ChipRow className="mt-4">
      <ChipLink href={href()} active={!audio} scroll={false}>
        Any audio
      </ChipLink>
      <ChipLink href={href("dub")} active={audio === "dub"} scroll={false}>
        <span className="size-1.5 rounded-full bg-dub" aria-hidden="true" />
        <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
      </ChipLink>
      <ChipLink href={href("sub")} active={audio === "sub"} scroll={false}>
        <span className={`size-1.5 rounded-full ${audio === "sub" ? "bg-ink/50" : "bg-text/70"}`} aria-hidden="true" />
        <span lang={edition.hreflang}>{subTerm(edition.contentLang)}</span>
      </ChipLink>
    </ChipRow>
  );
}

/** Small-caps group label above a block. */
function Label({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 lang="en" id={id} className="overline text-text-3">
      {children}
    </h2>
  );
}

// ───────────────────────── Empty query ─────────────────────────

async function EmptyQuery({ edition }: { edition: Edition }) {
  const trending = await getTrendingSearches(edition, 8);
  const r = edition.routes;
  const browse: { href: string; label: string; local?: boolean; dot?: string }[] = [
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.dubHub, label: dubTerm(edition.contentLang), local: true, dot: "bg-dub" },
    { href: r.subHub, label: subTerm(edition.contentLang), local: true, dot: "bg-text/70" },
    { href: r.newLeaving, label: "New & leaving", dot: "bg-leaving" },
  ];
  return (
    <div className="mt-10 md:mt-16">
      <RecentSearchChips action={r.search} />
      <div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {trending.length ? (
          <section aria-labelledby="trending-h" className="panel p-5 md:p-8">
            <Label id="trending-h">Trending in {edition.countryName}</Label>
            <ol className="mt-4 grid sm:grid-flow-col sm:grid-cols-2 sm:gap-x-8 md:mt-5" style={{ gridTemplateRows: `repeat(${Math.ceil(trending.length / 2)}, auto)` }}>
              {trending.map((t, i) => (
                <li key={t} className={`border-hairline ${i === trending.length - 1 ? "" : i === Math.ceil(trending.length / 2) - 1 ? "border-b sm:border-b-0" : "border-b"}`}>
                  <Link href={paths.search(edition, t)} className="group flex items-center gap-4 py-3.5 text-[15px] font-medium md:py-4 md:text-base">
                    <span className="tnum w-6 shrink-0 text-sm text-text-3">{String(i + 1).padStart(2, "0")}</span>
                    <span lang={edition.hreflang} className="min-w-0 flex-1 truncate">
                      {t}
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <section aria-labelledby="browse-h" className={`panel flex flex-col p-5 md:p-8 ${trending.length ? "" : "lg:col-span-2"}`}>
          <Label id="browse-h">Browse</Label>
          <ul className="mt-4 flex flex-wrap gap-2 md:mt-5">
            {browse.map((b) => (
              <li key={b.href}>
                <ChipLink href={b.href}>
                  {b.dot ? <span aria-hidden="true" className={`size-1.5 rounded-full ${b.dot}`} /> : null}
                  <span lang={b.local ? edition.hreflang : undefined}>{b.label}</span>
                </ChipLink>
              </li>
            ))}
          </ul>
          <p className="mt-auto max-w-sm pt-8 text-sm text-text-3">
            Type a title, a person or a phrase like “anime <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>”. We only list legal services in {edition.countryName}.
          </p>
        </section>
      </div>
    </div>
  );
}

// ───────────────────────── Results ─────────────────────────

async function Results({ edition, result, audio }: { edition: Edition; result: SearchResult; audio: AudioFilter | undefined }) {
  const { titles, people, franchises, collections, suggestion, query } = result;
  const shown = query;
  const audioLabel = audio === "dub" ? dubTerm(edition.contentLang) : audio === "sub" ? subTerm(edition.contentLang) : null;

  if (result.total === 0) {
    const trending = suggestion ? [] : await getTrendingSearches(edition, 5);
    return (
      <div className="mt-8 max-w-[820px] space-y-8 md:mt-12">
        {suggestion ? <DidYouMean edition={edition} suggestion={suggestion} audio={audio} /> : null}
        {audio ? (
          <div className="panel p-6 md:p-10">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-text/6 text-text-2">
              <SearchIcon />
            </span>
            <p className="text-h2 mt-5">
              No <span lang={edition.hreflang}>{audioLabel}</span> matches for “{shown}”
            </p>
            <p className="mt-2 max-w-md text-[15px] text-text-2">We only show languages the service has confirmed. Try any audio.</p>
            <ButtonLink href={paths.search(edition, shown)} className="mt-6">
              Show all audio
            </ButtonLink>
          </div>
        ) : (
          <NoResults edition={edition} q={shown} />
        )}
        {trending.length ? (
          <section aria-labelledby="try-h">
            <Label id="try-h">People are searching for</Label>
            <ChipRow className="mt-4">
              {trending.map((t) => (
                <ChipLink key={t} href={paths.search(edition, t)}>
                  <TrendingIcon className="size-3.5 text-text-3" />
                  <span lang={edition.hreflang}>{t}</span>
                </ChipLink>
              ))}
            </ChipRow>
          </section>
        ) : null}
      </div>
    );
  }

  const [top, ...rest] = titles;
  const topOffer = top ? await getTopOffer(edition, top.id) : null;
  const hasAside = franchises.length + collections.length + people.length > 0;

  return (
    <div className="mt-8 md:mt-10">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-hairline-strong pt-4">
        <p className="tnum text-sm text-text-2">
          <span className="sr-only">
            Results for “{shown}”{audioLabel ? ` with ${audioLabel}` : ""} ·{" "}
          </span>
          Results in {edition.countryName}
          {audioLabel ? (
            <>
              {" "}
              · <span lang={edition.hreflang}>{audioLabel}</span> only
            </>
          ) : null}
        </p>
        {result.audioHint && !audio ? (
          <p className="text-sm text-text-2 md:ml-auto">
            Looking for <span lang={edition.hreflang}>{result.audioHint === "dub" ? dubTerm(edition.contentLang) : subTerm(edition.contentLang)}</span>?{" "}
            <Link href={`${edition.routes.search}?q=${encodeURIComponent(shown)}&audio=${result.audioHint}`} className="link inline-flex items-center gap-1 !font-medium">
              Show only confirmed {result.audioHint === "dub" ? "dubs" : "subtitles"}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </p>
        ) : null}
      </div>

      {suggestion ? (
        <div className="mt-6">
          <DidYouMean edition={edition} suggestion={suggestion} audio={audio} />
        </div>
      ) : null}

      <div className={`mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-10 md:mt-8 ${hasAside ? "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <div className="min-w-0">
          {top ? <TopResult edition={edition} card={top} offer={topOffer} label={result.strong ? "Top result" : "Closest match"} /> : null}

          {rest.length ? (
            <section aria-labelledby="more-h" className={top ? "mt-10 md:mt-16" : ""}>
              <SectionHeader id="more-h" title="More matches" />
              <PosterGrid cards={rest} edition={edition} dense={hasAside} />
            </section>
          ) : null}
        </div>

        {hasAside ? (
          <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 md:gap-4 lg:sticky lg:top-36 lg:self-start" aria-label="Related results">
            {franchises.length ? (
              <section aria-labelledby="fr-h" className="panel p-2">
                <GroupHead id="fr-h" title="Franchises" sub="Watch order" />
                <ul>
                  {franchises.map((f) => (
                    <li key={f.id}>
                      <RowLink href={paths.franchise(edition, f.slug)} icon={<LayersIcon className="size-[18px]" />} name={f.name} meta="Watch order" />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {collections.length ? (
              <section aria-labelledby="col-h" className="panel p-2">
                <GroupHead id="col-h" title="Collections" />
                <ul>
                  {collections.map((c) => (
                    <li key={c.id}>
                      <RowLink href={paths.list(edition, c.slug)} icon={<ListIcon className="size-[18px]" />} name={c.name} meta="Collection · sofo editors" localLang={edition.hreflang} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {people.length ? (
              <section aria-labelledby="ppl-h" className="panel p-2">
                <GroupHead id="ppl-h" title="People" />
                <ul>
                  {people.map((p) => (
                    <li key={p.id}>
                      {/* No photos (licensing) — initials only. */}
                      <RowLink
                        href={paths.person(edition, p.slug)}
                        icon={<span className="text-xs font-semibold">{initials(p.name)}</span>}
                        name={p.name}
                        meta={p.knownFor ?? undefined}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>

      <section className="panel mt-12 grid gap-6 p-6 md:mt-20 md:grid-cols-2 md:items-center md:gap-12 md:p-10" aria-labelledby="req-h">
        <div>
          <h2 id="req-h" className="text-h2">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-2 max-w-md text-[15px] text-text-2">
            Tell us the title — we&apos;ll add it once it&apos;s on a legal service in {edition.countryName}.
          </p>
        </div>
        <RequestTitleForm action={requestTitle} lang={edition.code} defaultTitle="" countryName={edition.countryName} />
      </section>
    </div>
  );
}

function GroupHead({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
      <h2 lang="en" id={id} className="overline text-text-3">
        {title}
      </h2>
      {sub ? <span className="text-xs text-text-3">{sub}</span> : null}
    </div>
  );
}

function RowLink({ href, icon, name, meta, localLang }: { href: string; icon: React.ReactNode; name: string; meta?: string; localLang?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3.5 rounded-[18px] px-4 py-3 transition-colors duration-200 hover:bg-text/5">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-text/6 text-text-2">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span lang={localLang} className="block truncate text-[15px] font-medium">
          {name}
        </span>
        {meta ? <span className="tnum block truncate text-xs text-text-3">{meta}</span> : null}
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
    </Link>
  );
}

function DidYouMean({ edition, suggestion, audio }: { edition: Edition; suggestion: string; audio: AudioFilter | undefined }) {
  const href = `${edition.routes.search}?q=${encodeURIComponent(suggestion)}${audio ? `&audio=${audio}` : ""}`;
  return (
    <p className="text-[17px] text-text-2 md:text-lg">
      Did you mean{" "}
      <Link href={href} className="link !font-medium">
        {suggestion}
      </Link>
      ?
    </p>
  );
}

function NoResults({ edition, q }: { edition: Edition; q: string }) {
  return (
    <div className="panel p-6 md:p-10">
      <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-text/6 text-text-2">
        <SearchIcon />
      </span>
      <h2 className="text-h2 mt-5 break-words">No title called “{q}”</h2>
      <p className="mt-2 mb-6 max-w-lg text-[15px] text-text-2">
        Check the spelling, try the original title, or ask us to add it. We only list titles on legal services in {edition.countryName}.
      </p>
      <RequestTitleForm action={requestTitle} lang={edition.code} defaultTitle={q} countryName={edition.countryName} />
    </div>
  );
}

type TopOffer = Awaited<ReturnType<typeof getTopOffer>>;

function TopResult({ edition, card, offer, label }: { edition: Edition; card: TitleCard; offer: TopOffer; label: string }) {
  const href = paths.title(edition, card.type, card.slug);
  const backdrop = imageUrl(card.backdropPath, "w1280");
  const meta = [card.year, card.type === "movie" ? "Movie" : "Series", card.genres[0]].filter(Boolean);
  const TypeIcon = card.type === "movie" ? FilmIcon : TvIcon;

  return (
    <article className="panel relative isolate overflow-hidden" aria-labelledby="top-h">
      {backdrop ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image src={backdrop} alt="" fill priority sizes="(max-width: 1024px) 100vw, 980px" className="object-cover object-[70%_20%] opacity-40 md:opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-transparent" />
        </div>
      ) : null}
      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 gap-y-5 p-4 sm:grid-cols-[132px_minmax(0,1fr)] md:grid-cols-[176px_minmax(0,1fr)] md:gap-x-8 md:p-8">
        <Link href={href} className="self-start sm:row-span-2" tabIndex={-1} aria-hidden="true">
          <PosterImage path={card.posterPath} alt="" priority sizes="176px" />
        </Link>
        <div className="min-w-0 self-center sm:self-start">
          <p lang="en" className="overline flex items-center gap-2 text-text-3">
            <TypeIcon className="size-3.5" />
            {label}
          </p>
          <h2 id="top-h" className="mt-2 text-[22px] leading-[1.1] font-medium tracking-[-0.03em] md:mt-3 md:text-[40px]">
            <Link href={href}>{card.name}</Link>
          </h2>
          <p className="tnum mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-2 md:mt-3 md:text-sm">
            {card.score ? (
              <span className="inline-flex items-center gap-1 text-text">
                <StarIcon className="size-3.5 text-leaving" />
                <span className="sr-only">TMDB </span>
                {card.score.toFixed(1)}
              </span>
            ) : null}
            {meta.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 || card.score ? <span aria-hidden="true" className="size-[3px] rounded-full bg-text-3" /> : null}
                {m}
              </span>
            ))}
          </p>
          {card.dub || card.sub ? (
            <div className="mt-3 flex flex-wrap gap-1.5 md:mt-4">
              {card.dub ? (
                <Pill tone="dub">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" />
                  <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
                </Pill>
              ) : null}
              {card.sub ? (
                <Pill>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-text/70" />
                  <span lang={edition.hreflang}>{subTerm(edition.contentLang)}</span>
                </Pill>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:self-end">
          <TopActions edition={edition} card={card} offer={offer} href={href} />
        </div>
      </div>
    </article>
  );
}

/** CTA row of the top result: outbound "Watch on …" (the only orange on the page) + details + what we confirmed and when. */
function TopActions({ edition, card, offer, href }: { edition: Edition; card: TitleCard; offer: TopOffer; href: string }) {
  const lang = edition.contentLang;
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
        {offer ? (
          <OutboundLink
            href={offer.offer.url}
            service={offer.offer.serviceSlug}
            title={card.slug}
            country={edition.country}
            lang={offer.kind === "yes_audio" ? lang : undefined}
            offerType={offer.offer.type}
            className={`${buttonClass("accent", "lg")} max-sm:h-12 max-sm:w-full`}
          >
            {offerVerb(offer.offer.type)} on {offer.offer.serviceName}
            <ArrowUpRightIcon className="size-[18px]" />
          </OutboundLink>
        ) : null}
        <ButtonLink href={href} variant={offer ? "glass" : "primary"} size="lg" className="max-sm:h-12 max-sm:w-full">
          All details &amp; where to watch
        </ButtonLink>
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-2">
        {offer ? (
          <>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${offer.kind === "yes_audio" || offer.kind === "yes_subtitle" ? "bg-available" : "bg-leaving"}`} />
            {offer.kind === "yes_audio" ? (
              <span>
                <span lang={edition.hreflang}>{dubTerm(lang)}</span> confirmed
              </span>
            ) : offer.kind === "yes_subtitle" ? (
              <span>
                <span lang={edition.hreflang}>{subTerm(lang)}</span> confirmed · no confirmed dub
              </span>
            ) : (
              <span className="text-leaving">{langName(lang)} audio not confirmed by the service</span>
            )}
            {offer.checkedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <CheckedAt at={offer.checkedAt} />
              </>
            ) : null}
          </>
        ) : (
          <span>Not on a service in {edition.countryName} right now.</span>
        )}
      </p>
    </>
  );
}
