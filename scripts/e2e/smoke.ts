/**
 * HTTP smoke test (no browser): run against any deployment —
 *   pnpm smoke -- --base=http://localhost:3000        (local)
 *   pnpm smoke -- --base=https://sofo.tv               (production, also from the Coolify terminal)
 * Checks the pages, SEO tags, structured data and outbound links the PRD acceptance criteria rely on.
 * Exit code 1 on any failure.
 */
const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith("--base="))?.slice(7) ?? process.env.SMOKE_BASE ?? "http://localhost:3000").replace(/\/+$/, "");
const edition = args.find((a) => a.startsWith("--edition="))?.slice(10) ?? "tr";

type Check = { name: string; ok: boolean; detail?: string };
const results: Check[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

async function get(path: string): Promise<{ status: number; body: string; url: string }> {
  const res = await fetch(base + path, { redirect: "follow", headers: { "user-agent": "sofo-smoke/1.0" } });
  return { status: res.status, body: await res.text(), url: res.url };
}

const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`, "i").exec(tag)?.[1] ?? null;

async function main() {
  // 1. Core pages render.
  const pages = [`/`, `/${edition}`, `/${edition}/filmler`, `/${edition}/diziler`, `/${edition}/turkce-dublaj`, `/${edition}/yeni-ve-ayrilanlar`, `/${edition}/netflix`, `/${edition}/ara?q=dune`, `/robots.txt`, `/sitemap.xml`];
  for (const p of pages) {
    const r = await get(p);
    check(`GET ${p} → 200`, r.status === 200, `status ${r.status}`);
  }

  // 2. Unknown URL → real 404.
  const missing = await get(`/${edition}/smoke-test-missing-page-${Date.now()}`);
  check("unknown URL → 404", missing.status === 404, `status ${missing.status}`);

  // 3. robots points at the sitemap.
  const robots = await get("/robots.txt");
  check("robots.txt lists the sitemap", /sitemap:\s*\S+\/sitemap\.xml/i.test(robots.body));

  // 4. Pick a movie and a series from the catalogue.
  const titles: string[] = [];
  for (const [list, kind] of [[`/${edition}/filmler`, "film"], [`/${edition}/diziler`, "dizi"]] as const) {
    const r = await get(list);
    const href = new RegExp(`href="(/${edition}/${kind}/[a-z0-9-]+)"`).exec(r.body)?.[1];
    check(`catalogue ${list} links to a ${kind} page`, !!href);
    if (href) titles.push(href);
  }

  // 5. Title pages: H1, canonical, hreflang, JSON-LD, outbound links.
  for (const path of titles) {
    const r = await get(path);
    check(`${path} → 200`, r.status === 200, `status ${r.status}`);
    check(`${path} has one <h1>`, (r.body.match(/<h1[\s>]/g) ?? []).length === 1);
    const canonical = /<link rel="canonical"[^>]*>/.exec(r.body)?.[0];
    check(`${path} canonical is self`, !!canonical && (attr(canonical, "href") ?? "").endsWith(path), canonical ?? "missing");
    const hreflangs = [...r.body.matchAll(/<link rel="alternate" hrefLang="([^"]+)"/gi)].map((m) => m[1]);
    check(`${path} hreflang includes ${edition} + x-default`, hreflangs.includes(edition) && hreflangs.includes("x-default"), hreflangs.join(","));
    const ld = [...r.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? "").join("\n");
    check(`${path} JSON-LD Movie/TVSeries`, /"@type":"(Movie|TVSeries)"/.test(ld));
    check(`${path} JSON-LD WatchAction`, /"@type":"WatchAction"/.test(ld));
    const outbound = [...r.body.matchAll(/<a [^>]*href="(https:\/\/[^"]+)"[^>]*target="_blank"[^>]*>/g)].map((m) => m[0]);
    const watch = outbound.filter((a) => !/themoviedb|youtube|t\.me|google/.test(attr(a, "href") ?? ""));
    check(`${path} has an outbound "watch" link`, watch.length > 0);
    check(`${path} outbound links are rel=noopener nofollow`, watch.every((a) => /rel="[^"]*noopener[^"]*nofollow|rel="[^"]*nofollow[^"]*noopener/.test(a)));
    check(`${path} shows a checked date`, /Checked (today|yesterday|\d)/.test(r.body));
    check(`${path} never links pirate mirrors`, !/href="[^"]*(izle|torrent|dizibox|hdfilmcehennemi)[^"]*"/i.test(r.body.replace(/turkce-|dizi\//g, "")));
  }

  // 6. Sitemap only lists live pages of this site.
  const sitemap = await get("/sitemap.xml");
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");
  check("sitemap has title URLs", locs.some((l) => /\/(film|dizi)\//.test(l)), `${locs.length} URLs`);
  const sample = locs.filter((l) => /\/(film|dizi)\//.test(l)).slice(0, 3);
  for (const loc of sample) {
    const path = new URL(loc).pathname;
    const r = await get(path);
    check(`sitemap URL ${path} → 200 and indexable`, r.status === 200 && !/<meta name="robots" content="[^"]*noindex/.test(r.body), `status ${r.status}`);
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${!r.ok && r.detail ? ` — ${r.detail}` : ""}`);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${base}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
