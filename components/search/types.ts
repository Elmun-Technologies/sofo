/** JSON payload of GET /api/search (autocomplete). Shared by the route handler and the client combobox. */
export type SuggestTitle = {
  id: number;
  name: string;
  year: number | null;
  kind: "Movie" | "Series";
  href: string;
  poster: string | null;
  service: string | null;
  dub: boolean;
  sub: boolean;
};

export type SuggestGroupItem = { name: string; href: string; meta: string };

export type SuggestPayload = {
  q: string;
  suggestion: { name: string; href: string } | null;
  titles: SuggestTitle[];
  people: SuggestGroupItem[];
  franchises: SuggestGroupItem[];
  collections: SuggestGroupItem[];
  /** Only for an empty query */
  trending: string[];
};
