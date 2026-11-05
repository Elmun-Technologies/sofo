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
};

export type EditionRoutes = {
  home: string;
  search: string;
  catalog: string;
  movies: string;
  series: string;
  anime: string;
  kids: string;
  collections: string;
  newLeaving: string;
  myList: string;
  about: string;
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
    catalog: "/tr/katalog",
    movies: "/tr/katalog?tip=film",
    series: "/tr/katalog?tip=dizi",
    anime: "/tr/katalog?tur=anime",
    kids: "/tr/cocuk",
    collections: "/tr/turkce-dublaj",
    newLeaving: "/tr/yeni-ve-ayrilanlar",
    myList: "/tr/listem",
    about: "/tr/hakkinda",
  },
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
