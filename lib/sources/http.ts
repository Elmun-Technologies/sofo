/**
 * Shared fetch for external APIs (TMDB, Streaming Availability).
 * Every source module in lib/sources/* must go through this: retry with backoff + simple rate limit.
 */
export type FetchJsonOptions = {
  headers?: Record<string, string>;
  retries?: number;
  /** Minimum gap between requests to the same host, ms */
  minIntervalMs?: number;
};

const lastCallByHost = new Map<string, number>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { headers, retries = 3, minIntervalMs = 250 } = opts;
  const host = new URL(url).host;

  for (let attempt = 0; ; attempt++) {
    const wait = (lastCallByHost.get(host) ?? 0) + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallByHost.set(host, Date.now());

    try {
      const res = await fetch(url, { headers });
      if (res.ok) return (await res.json()) as T;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= retries) throw new HttpError(res.status, url);
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500);
    } catch (err) {
      if (err instanceof HttpError || attempt >= retries) throw err;
      await sleep(2 ** attempt * 500);
    }
  }
}
