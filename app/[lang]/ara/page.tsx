import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { OutboundLink } from "@/components/outbound-link";
import { RecentSearchChips } from "@/components/search/recent-search-chips";
import { RememberSearch } from "@/components/search/remember-search";
import { RequestTitleForm } from "@/components/search/request-title-form";
import { SearchCombobox } from "@/components/search/search-combobox";
import { DubBadge, SubBadge } from "@/components/ui/badges";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { PosterGrid } from "@/components/ui/poster-grid";
import { PosterImage } from "@/components/ui/poster-image";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { TitleCard } from "@/lib/catalog";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { initials } from "@/lib/format";
import { dubTerm, subTerm } from "@/lib/lang";
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

  return (
    <div className="mx-auto max-w-site px-4 pt-4 pb-12 md:px-7 md:pt-8">
      <h1 className="sr-only">{q.trim() ? `Search results for “${q.trim()}”` : "Search"}</h1>
      <div className="mx-auto max-w-3xl">
        <SearchCombobox key={q} action={action} variant="page" defaultValue={q} autoFocus={!q.trim()} keepParams={audio ? { audio } : undefined} />
        <AudioChips edition={edition} q={q.trim()} audio={audio} />
      </div>

      {result ? (
        <>
          <RememberSearch q={q.trim()} />
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
    <ChipRow className="mt-3">
      <ChipLink href={href()} active={!audio} scroll={false}>
        Any audio
      </ChipLink>
      <ChipLink href={href("dub")} active={audio === "dub"} scroll={false}>
        <span className="size-2 rounded-full bg-dub" aria-hidden="true" />
        {dubTerm(edition.contentLang)}
      </ChipLink>
      <ChipLink href={href("sub")} active={audio === "sub"} scroll={false}>
        {subTerm(edition.contentLang)}
      </ChipLink>
    </ChipRow>
  );
}

// ───────────────────────── Empty query ─────────────────────────

async function EmptyQuery({ edition }: { edition: Edition }) {
  const trending = await getTrendingSearches(edition, 8);
  const r = edition.routes;
  const browse = [
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.dubHub, label: dubTerm(edition.contentLang) },
    { href: r.subHub, label: subTerm(edition.contentLang) },
    { href: r.newLeaving, label: "New & leaving" },
  ];
  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <RecentSearchChips action={r.search} />
      {trending.length ? (
        <section aria-labelledby="trending-h" className="mb-8">
          <h2 lang="en" id="trending-h" className="mb-3 text-xs font-extrabold tracking-[0.08em] text-text-3 uppercase">
            Trending in {edition.countryName}
          </h2>
          <ol className="grid gap-1 sm:grid-cols-2">
            {trending.map((t, i) => (
              <li key={t}>
                <Link
                  href={paths.search(edition, t)}
                  className="flex items-center gap-3 rounded-input px-3 py-2.5 text-[15px] font-semibold hover:bg-surface hover:text-text"
                >
                  <span className="w-6 text-sm font-extrabold text-text-3">#{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  <span className="text-text-3" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <section aria-labelledby="browse-h">
        <h2 lang="en" id="browse-h" className="mb-3 text-xs font-extrabold tracking-[0.08em] text-text-3 uppercase">
          Browse
        </h2>
        <ChipRow>
          {browse.map((b) => (
            <ChipLink key={b.href} href={b.href}>
              {b.label}
            </ChipLink>
          ))}
        </ChipRow>
      </section>
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
      <div className="mx-auto mt-8 max-w-3xl space-y-6">
        {suggestion ? <DidYouMean edition={edition} suggestion={suggestion} audio={audio} /> : null}
        {audio ? (
          <div className="rounded-panel border border-line bg-surface p-6">
            <p className="text-lg font-extrabold">
              No {audioLabel} matches for “{shown}”
            </p>
            <p className="mt-1.5 text-sm text-text-2">We only show languages the service has confirmed. Try any audio.</p>
            <ButtonLink href={paths.search(edition, shown)} variant="secondary" className="mt-4">
              Show all audio
            </ButtonLink>
          </div>
        ) : (
          <NoResults edition={edition} q={shown} />
        )}
        {trending.length ? (
          <section aria-labelledby="try-h">
            <h2 lang="en" id="try-h" className="mb-3 text-xs font-extrabold tracking-[0.08em] text-text-3 uppercase">
              People are searching for
            </h2>
            <ChipRow>
              {trending.map((t) => (
                <ChipLink key={t} href={paths.search(edition, t)}>
                  {t}
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
  const counts = [
    titles.length && `${titles.length} ${titles.length === 1 ? "title" : "titles"}`,
    people.length && `${people.length} ${people.length === 1 ? "person" : "people"}`,
    franchises.length && `${franchises.length} ${franchises.length === 1 ? "franchise" : "franchises"}`,
    collections.length && `${collections.length} ${collections.length === 1 ? "collection" : "collections"}`,
  ].filter(Boolean);

  return (
    <div className="mt-6 md:mt-8">
      <p className="mb-4 text-sm text-text-2">
        Results for <span className="font-bold text-text">“{shown}”</span>
        {audioLabel ? ` with ${audioLabel}` : ""} · {counts.join(" · ")} in {edition.countryName}
      </p>

      {suggestion ? (
        <div className="mb-5">
          <DidYouMean edition={edition} suggestion={suggestion} audio={audio} />
        </div>
      ) : null}

      {result.audioHint && !audio ? (
        <p className="mb-5 text-sm text-text-2">
          Looking for {result.audioHint === "dub" ? dubTerm(edition.contentLang) : subTerm(edition.contentLang)}?{" "}
          <Link href={`${edition.routes.search}?q=${encodeURIComponent(shown)}&audio=${result.audioHint}`} className="font-bold text-orange">
            Show only confirmed {result.audioHint === "dub" ? "dubs" : "subtitles"} →
          </Link>
        </p>
      ) : null}

      {top ? <TopResult edition={edition} card={top} offer={topOffer} label={result.strong ? "Top result" : "Closest match"} /> : null}

      {rest.length ? (
        <section aria-labelledby="more-h" className="mt-8">
          <SectionHeader id="more-h" title="More matches" />
          <PosterGrid cards={rest} edition={edition} />
        </section>
      ) : null}

      {franchises.length ? (
        <section aria-labelledby="fr-h" className="mt-10">
          <SectionHeader id="fr-h" title="Franchises" sub="Watch order" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {franchises.map((f) => (
              <li key={f.id}>
                <Link
                  href={paths.franchise(edition, f.slug)}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:border-text-3 hover:text-text"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-button bg-orange-deep text-lg text-orange" aria-hidden="true">
                    ▤
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold">{f.name}</span>
                    <span className="block text-xs text-text-2">
                      Watch order · {f.count} {f.count === 1 ? "title" : "titles"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {collections.length ? (
        <section aria-labelledby="col-h" className="mt-10">
          <SectionHeader id="col-h" title="Collections" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={paths.list(edition, c.slug)}
                  className="flex h-full flex-col justify-between gap-2 rounded-card border border-line bg-surface p-4 hover:border-text-3 hover:text-text"
                >
                  <span className="font-extrabold">{c.name}</span>
                  <span className="text-xs text-text-2">{c.count} titles · sofo editors</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {people.length ? (
        <section aria-labelledby="ppl-h" className="mt-10">
          <SectionHeader id="ppl-h" title="People" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.id}>
                <Link
                  href={paths.person(edition, p.slug)}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 hover:border-text-3 hover:text-text"
                >
                  {/* No photos (licensing) — initials only. */}
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-extrabold text-text-2" aria-hidden="true">
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold">{p.name}</span>
                    <span className="block truncate text-xs text-text-2">
                      {[p.knownFor, p.credits ? `${p.credits} ${p.credits === 1 ? "title" : "titles"} on sofo` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 rounded-panel border border-line bg-surface p-5 md:p-6" aria-labelledby="req-h">
        <h2 id="req-h" className="font-extrabold">
          Can&apos;t find what you&apos;re looking for?
        </h2>
        <p className="mt-1 mb-4 text-sm text-text-2">
          Tell us the title — we&apos;ll add it once it&apos;s on a legal service in {edition.countryName}.
        </p>
        <RequestTitleForm action={requestTitle} lang={edition.code} defaultTitle="" countryName={edition.countryName} />
      </section>
    </div>
  );
}

function DidYouMean({ edition, suggestion, audio }: { edition: Edition; suggestion: string; audio: AudioFilter | undefined }) {
  const href = `${edition.routes.search}?q=${encodeURIComponent(suggestion)}${audio ? `&audio=${audio}` : ""}`;
  return (
    <p className="text-[17px] font-semibold">
      Did you mean{" "}
      <Link href={href} className="font-extrabold text-orange">
        {suggestion}
      </Link>
      ?
    </p>
  );
}

function NoResults({ edition, q }: { edition: Edition; q: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-5 md:p-6">
      <h2 className="text-lg font-extrabold">No title called “{q}”</h2>
      <p className="mt-1.5 mb-4 text-sm text-text-2">
        Check the spelling, try the original title, or ask us to add it. We only list titles on legal services in {edition.countryName}.
      </p>
      <RequestTitleForm action={requestTitle} lang={edition.code} defaultTitle={q} countryName={edition.countryName} />
    </div>
  );
}

type TopOffer = Awaited<ReturnType<typeof getTopOffer>>;

function TopResult({ edition, card, offer, label }: { edition: Edition; card: TitleCard; offer: TopOffer; label: string }) {
  const href = paths.title(edition, card.type, card.slug);
  const meta = [card.year, card.type === "movie" ? "Movie" : "Series", card.genres[0], card.score ? `TMDB ${card.score.toFixed(1)}` : null]
    .filter(Boolean)
    .join(" · ");
  const langNote =
    offer?.kind === "yes_audio"
      ? `${dubTerm(edition.contentLang)} ✓`
      : offer?.kind === "yes_subtitle"
        ? `${subTerm(edition.contentLang)} ✓ · no confirmed dub`
        : offer
          ? "Turkish audio not confirmed by the service"
          : null;

  return (
    <article className="flex gap-4 rounded-panel border border-line bg-surface p-3 md:gap-6 md:p-5" aria-labelledby="top-h">
      <Link href={href} className="w-[104px] shrink-0 md:w-[150px]" tabIndex={-1} aria-hidden="true">
        <PosterImage path={card.posterPath} alt="" priority sizes="150px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <span lang="en" className="mb-2 self-start rounded-chip bg-orange px-2 py-0.5 text-[11px] font-extrabold tracking-[0.06em] text-ink uppercase">{label}</span>
        <h2 id="top-h" className="text-xl leading-tight font-extrabold tracking-[-0.02em] md:text-3xl">
          <Link href={href} className="hover:text-orange-tint">
            {card.name}
          </Link>
        </h2>
        <p className="mt-1 text-[13px] text-text-2 md:text-sm">{meta}</p>
        {card.dub || card.sub ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.dub ? <DubBadge>{dubTerm(edition.contentLang)}</DubBadge> : null}
            {card.sub ? <SubBadge>{subTerm(edition.contentLang)}</SubBadge> : null}
          </div>
        ) : null}

        <div className="mt-auto pt-3">
          {offer ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <OutboundLink
                href={offer.offer.url}
                service={offer.offer.serviceSlug}
                title={card.slug}
                country={edition.country}
                lang={offer.kind === "yes_audio" ? edition.contentLang : undefined}
                offerType={offer.offer.type}
                className={`${buttonClass("primary")} w-full md:w-auto`}
              >
                <ServiceLogo slug={offer.offer.serviceSlug} name={offer.offer.serviceName} size={20} />
                {offerVerb(offer.offer.type)} on {offer.offer.serviceName} ↗
              </OutboundLink>
              <div className="min-w-0 text-xs text-text-2">
                {langNote ? <div>{langNote}</div> : null}
                {offer.checkedAt ? <CheckedAt at={offer.checkedAt} /> : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-2">Not on a service in {edition.countryName} right now.</p>
          )}
          <Link href={href} className="mt-3 inline-block text-sm font-bold text-text-2">
            All details &amp; where to watch →
          </Link>
        </div>
      </div>
    </article>
  );
}
