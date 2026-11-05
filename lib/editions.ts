/**
 * Editions = country catalogues (/tr, later /us, /fr...). UI copy defaults to English;
 * localized titles, slugs and language terms come from the edition.
 */
export type Edition = {
  /** URL segment, e.g. "tr" */
  code: string;
  /** ISO 3166-1 alpha-2 country of the catalogue */
  country: string;
  countryName: string;
  /** Content language (TitleLocalization.lang, slugs) */
  contentLang: string;
  /** hreflang value for this edition's pages */
  hreflang: string;
  /** Short label shown in the edition switcher, e.g. "TR · EN" */
  switcherLabel: string;
  routes: EditionRoutes;
  segments: EditionSegments;
  /** Service slugs every title is compared against ("not on …") */
  coreServices: string[];
};

export type EditionRoutes = {
  home: string;
  search: string;
  movies: string;
  series: string;
  anime: string;
  kids: string;
  dubHub: string;
  subHub: string;
  collections: string;
  newLeaving: string;
  trailers: string;
  releases: string;
  myList: string;
  about: string;
  privacy: string;
};

/** Localized path segments for entity pages. */
export type EditionSegments = {
  movie: string;
  tv: string;
  season: string;
  list: string;
  franchise: string;
  person: string;
};

const tr: Edition = {
  code: "tr",
  country: "TR",
  countryName: "Türkiye",
  contentLang: "tr",
  hreflang: "tr",
  switcherLabel: "TR · EN",
  routes: {
    home: "/tr",
    search: "/tr/ara",
    movies: "/tr/filmler",
    series: "/tr/diziler",
    anime: "/tr/anime",
    kids: "/tr/cocuk",
    dubHub: "/tr/turkce-dublaj",
    subHub: "/tr/turkce-altyazi",
    collections: "/tr/turkce-dublaj#collections",
    newLeaving: "/tr/yeni-ve-ayrilanlar",
    trailers: "/tr/fragmanlar",
    releases: "/tr/yakinda-dijitalde",
    myList: "/tr/listem",
    about: "/tr/hakkinda",
    privacy: "/tr/gizlilik",
  },
  segments: { movie: "film", tv: "dizi", season: "sezon", list: "turkce-dublaj", franchise: "seri", person: "kisi" },
  coreServices: ["netflix", "prime-video", "disney-plus", "hbo-max", "tod", "tabii", "exxen", "gain"],
};

/** Live editions. Only TR in MVP. */
export const EDITIONS: Record<string, Edition> = { tr };

/** Planned editions — listed in the footer, not routable yet. */
export const PLANNED_EDITIONS = ["United States", "Deutschland", "France", "España", "Brasil"];

export function getEdition(code: string): Edition | undefined {
  return Object.hasOwn(EDITIONS, code) ? EDITIONS[code] : undefined;
}

export function editionCodes(): string[] {
  return Object.keys(EDITIONS);
}

export const paths = {
  title: (e: Edition, type: "movie" | "tv", slug: string) => `/${e.code}/${e.segments[type]}/${slug}`,
  season: (e: Edition, slug: string, n: number) => `/${e.code}/${e.segments.tv}/${slug}/${e.segments.season}-${n}`,
  list: (e: Edition, slug: string) => `/${e.code}/${e.segments.list}/${slug}`,
  service: (e: Edition, slug: string) => `/${e.code}/${slug}`,
  franchise: (e: Edition, slug: string) => `/${e.code}/${e.segments.franchise}/${slug}`,
  person: (e: Edition, slug: string) => `/${e.code}/${e.segments.person}/${slug}`,
  search: (e: Edition, q?: string) => (q ? `${e.routes.search}?q=${encodeURIComponent(q)}` : e.routes.search),
};
