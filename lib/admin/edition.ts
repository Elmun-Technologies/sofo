import { EDITIONS, getEdition, type Edition } from "../editions";

/** Admin works on one edition at a time (`?edition=tr`); defaults to the first live edition. */
export function adminEdition(param: string | string[] | undefined): Edition {
  const code = Array.isArray(param) ? param[0] : param;
  return (code && getEdition(code)) || Object.values(EDITIONS)[0]!;
}

export function editionForList(lang: string, countryCode: string): Edition | undefined {
  return Object.values(EDITIONS).find((e) => e.contentLang === lang && e.country === countryCode);
}

/** Admin href that keeps the edition param. */
export function adminHref(path: string, e: Edition, extra: Record<string, string> = {}): string {
  const qs = new URLSearchParams({ ...(e.code === Object.keys(EDITIONS)[0] ? {} : { edition: e.code }), ...extra }).toString();
  return qs ? `${path}?${qs}` : path;
}
