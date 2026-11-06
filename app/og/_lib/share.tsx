/**
 * Share images (PRD §7.5, CLAUDE.md "Trailer & share policy"): built from key art only, never film frames.
 *   OG    1200×630   /og/{edition}/{movie|tv}/{slug}
 *   Story 1080×1920  /story/{edition}/{movie|tv}/{slug}   (text kept out of the top/bottom 250 px IG safe zones)
 * Availability line uses confirmed language data only (computeShortAnswer).
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { imageUrl } from "@/lib/images";
import { dubTerm, subTerm } from "@/lib/lang";
import { serviceStyle } from "@/lib/services";
import { computeShortAnswer, type AnswerOffer, type LangState } from "@/lib/short-answer";
import { siteUrl } from "@/lib/site";

const C = {
  orange: "#FF5A1F",
  ink: "#0A0A0D",
  surface: "#15151B",
  line: "#26262F",
  text: "#FFFFFF",
  text2: "#A1A1AD",
  dub: "#3B82F6",
  available: "#4ADE80",
};

// ───────────────────────── Static files ─────────────────────────

/**
 * Reads a file from /public. On Workers there is no filesystem: static files come from the ASSETS
 * binding. `next dev` falls back to the local disk.
 */
async function readPublic(path: string): Promise<ArrayBuffer | null> {
  try {
    const assets = (getCloudflareContext().env as { ASSETS?: { fetch: (req: Request) => Promise<Response> } }).ASSETS;
    if (assets) {
      const res = await assets.fetch(new Request(new URL(path, "https://assets.local")));
      if (res.ok) return await res.arrayBuffer();
    }
  } catch {
    // No Cloudflare context (e.g. plain Node) — try the disk below.
  }
  try {
    const { readFile } = await import("node:fs/promises");
    const buf = await readFile(`${process.cwd()}/public${path}`);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

// ───────────────────────── Fonts (vendored TTF, OFL — public/fonts) ─────────────────────────

type FontDef = { name: string; data: ArrayBuffer; weight: 700 | 800 | 900; style: "normal" };

async function loadFont(file: string, name: string, weight: FontDef["weight"]): Promise<FontDef | null> {
  const data = await readPublic(`/fonts/${file}`);
  // null → ImageResponse default font
  return data ? { name, weight, style: "normal", data } : null;
}

// Cache resolved bytes only — a pending promise must not cross Worker requests.
let fontCache: FontDef[] | null = null;
/** Brand fonts are required: the patched next/og has no bundled fallback font (ADR 0002). */
async function fonts(): Promise<FontDef[]> {
  if (fontCache) return fontCache;
  const list = (
    await Promise.all([
      loadFont("Manrope-700.ttf", "Manrope", 700),
      loadFont("Manrope-800.ttf", "Manrope", 800),
      loadFont("Nunito-900.ttf", "Nunito", 900),
    ])
  ).filter((f): f is FontDef => f !== null);
  if (list.length === 0) throw new Error("share image fonts missing (public/fonts)");
  fontCache = list;
  return list;
}

// ───────────────────────── Images ─────────────────────────

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Data URI for a stored image path: local /sample/* from disk, TMDB over HTTP. Null on any failure. */
async function imageData(path: string | null, size: string): Promise<string | null> {
  if (!path) return null;
  try {
    if (path.startsWith("/sample/")) {
      const safe = path.replace(/\.\.+/g, "");
      const data = await readPublic(safe);
      if (!data) return null;
      const ext = safe.split(".").pop()?.toLowerCase() ?? "jpg";
      return `data:${MIME[ext] ?? "image/jpeg"};base64,${Buffer.from(data).toString("base64")}`;
    }
    const url = imageUrl(path, size);
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

// ───────────────────────── Data ─────────────────────────

export type ShareData = {
  edition: Edition;
  name: string;
  year: number | null;
  type: "movie" | "tv";
  seasons: number;
  path: string;
  poster: string | null;
  backdrop: string | null;
  /** e.g. ["türkçe dublaj", "türkçe altyazı"] — confirmed only */
  langChips: { label: string; kind: "dub" | "sub" }[];
  /** e.g. "on Netflix · +2 more" */
  availability: string;
  service: { name: string; slug: string } | null;
};

/**
 * Lightweight share image for hosts whose CPU limit can't fit a resvg PNG render (Freebuff Sites /
 * Workers — ADR 0002): the title's own key art (backdrop for OG, poster for Story), served as-is.
 */
export async function keyArtResponse(editionCode: string, type: string, rawSlug: string, prefer: "backdrop" | "poster"): Promise<Response> {
  const e = getEdition(editionCode);
  const slug = rawSlug.replace(/\.png$/i, "");
  if (!e || (type !== "movie" && type !== "tv") || !/^[a-z0-9-]{1,200}$/.test(slug)) return new Response("Not found", { status: 404 });
  const loc = await db.titleLocalization.findUnique({ where: { lang_slug: { lang: e.contentLang, slug } }, select: { titleId: true } });
  const title = loc ? await db.title.findUnique({ where: { id: loc.titleId }, select: { type: true, posterPath: true, backdropPath: true } }) : null;
  if (!title || title.type !== type) return new Response("Not found", { status: 404 });
  const path = prefer === "backdrop" ? (title.backdropPath ?? title.posterPath) : (title.posterPath ?? title.backdropPath);
  if (!path) return new Response("Not found", { status: 404 });
  if (path.startsWith("/sample/")) {
    const data = await readPublic(path.replace(/\.\.+/g, ""));
    if (!data) return new Response("Not found", { status: 404 });
    const ext = path.split(".").pop()?.toLowerCase() ?? "jpg";
    return new Response(data, { headers: { "content-type": MIME[ext] ?? "image/jpeg", ...HEADERS } });
  }
  const url = imageUrl(path, prefer === "backdrop" ? "w1280" : "w780");
  return url ? Response.redirect(url, 302) : new Response("Not found", { status: 404 });
}

export async function loadShareData(editionCode: string, type: string, rawSlug: string): Promise<ShareData | null> {
  const e = getEdition(editionCode);
  if (!e || (type !== "movie" && type !== "tv")) return null;
  const slug = rawSlug.replace(/\.png$/i, "");
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null;

  const loc = await db.titleLocalization.findUnique({ where: { lang_slug: { lang: e.contentLang, slug } }, select: { titleId: true, name: true } });
  if (!loc) return null;
  const title = await db.title.findUnique({
    where: { id: loc.titleId },
    include: {
      offers: {
        where: { countryCode: e.country, isActive: true, seasonId: null, episodeId: null },
        include: { service: true, languages: { where: { lang: e.contentLang } } },
      },
      _count: { select: { seasons: true } },
    },
  });
  if (!title || title.type !== type) return null;

  const offers: AnswerOffer[] = title.offers.map((o) => {
    const state = (kind: "audio" | "subtitle"): LangState => o.languages.find((l) => l.kind === kind)?.status ?? "unknown";
    return {
      serviceSlug: o.service.slug,
      serviceName: o.service.name,
      type: o.type,
      price: o.price ? Number(o.price) : null,
      currency: o.currency,
      url: o.url,
      audio: state("audio"),
      subtitle: state("subtitle"),
    };
  });
  const answer = computeShortAnswer(offers);
  const otherServices = (slug: string) => new Set(offers.filter((o) => o.serviceSlug !== slug).map((o) => o.serviceSlug)).size;

  let langChips: ShareData["langChips"] = [];
  let availability = `Not streaming in ${e.countryName} yet`;
  let service: ShareData["service"] = null;
  if (answer.kind !== "none") {
    const o = answer.offer;
    service = { name: o.serviceName, slug: o.serviceSlug };
    const more = otherServices(o.serviceSlug);
    const suffix = more > 0 ? ` · +${more} more` : "";
    if (o.audio === "confirmed_yes") langChips.push({ label: dubTerm(e.contentLang), kind: "dub" });
    if (o.subtitle === "confirmed_yes") langChips.push({ label: subTerm(e.contentLang), kind: "sub" });
    if (answer.kind === "rent_only") availability = `Rent or buy on ${o.serviceName}${suffix}`;
    else if (o.type === "free" || o.type === "ads") availability = `Free on ${o.serviceName}${suffix}`;
    else availability = `on ${o.serviceName}${suffix}`;
    if (answer.kind === "yes_unconfirmed") availability = `Streaming ${availability}`;
    langChips = langChips.slice(0, 2);
  }

  const [poster, backdrop] = await Promise.all([imageData(title.posterPath, "w500"), imageData(title.backdropPath, "w1280")]);
  return {
    edition: e,
    name: loc.name,
    year: title.year,
    type: title.type,
    seasons: title._count.seasons,
    path: paths.title(e, title.type, slug),
    poster,
    backdrop,
    langChips,
    availability,
    service,
  };
}

// ───────────────────────── Pieces ─────────────────────────

function Logo({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.22, fontFamily: "Nunito", fontWeight: 900, fontSize: size, color: C.text, letterSpacing: "-0.03em" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size * 1.12,
          height: size * 1.12,
          borderRadius: size * 0.3,
          background: C.orange,
          paddingBottom: size * 0.08,
          lineHeight: 1,
        }}
      >
        s
      </div>
      <div style={{ display: "flex" }}>sofo</div>
    </div>
  );
}

function Chip({ label, kind, size }: { label: string; kind: "dub" | "sub"; size: number }) {
  const dub = kind === "dub";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: size * 2,
        padding: `0 ${size * 0.8}px`,
        borderRadius: 999,
        fontSize: size,
        fontWeight: 800,
        color: dub ? C.text : C.text,
        background: dub ? C.dub : "rgba(255,255,255,0.14)",
        border: dub ? "none" : "1px solid rgba(255,255,255,0.25)",
      }}
    >
      {label}
    </div>
  );
}

function ServiceBadge({ slug, size }: { slug: string; size: number }) {
  const s = serviceStyle(slug);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: size,
        height: size,
        padding: `0 ${size * 0.2}px`,
        borderRadius: size * 0.25,
        background: s.bg,
        color: s.fg,
        fontSize: size * 0.36,
        fontWeight: 800,
      }}
    >
      {s.short}
    </div>
  );
}

function Poster({ src, width, name }: { src: string | null; width: number; name: string }) {
  const height = Math.round(width * 1.5);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={width} height={height} style={{ width, height, objectFit: "cover", borderRadius: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }} />;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        width,
        height,
        padding: width * 0.08,
        borderRadius: 24,
        background: `linear-gradient(160deg, ${C.line}, ${C.surface})`,
        color: C.text2,
        fontSize: width * 0.1,
        fontWeight: 800,
      }}
    >
      {name}
    </div>
  );
}

function Background({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
  ) : (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", background: `radial-gradient(circle at 80% 0%, #2A150D, ${C.ink} 60%)` }} />
  );
}

const meta = (d: ShareData) =>
  [d.year, d.type === "tv" ? (d.seasons ? `${d.seasons} season${d.seasons > 1 ? "s" : ""}` : "Series") : "Movie"].filter(Boolean).join(" · ");

/** host + path; host only when the path would wrap. */
const shortUrl = (d: ShareData, maxPath = 60) => (d.path.length > maxPath ? siteUrl().host : `${siteUrl().host}${d.path}`);

const HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" };

// ───────────────────────── OG 1200×630 ─────────────────────────

export async function renderOg(d: ShareData): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: C.ink, color: C.text, fontFamily: "Manrope" }}>
        <Background src={d.backdrop ?? d.poster} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", background: "linear-gradient(90deg, rgba(10,10,13,0.96) 0%, rgba(10,10,13,0.85) 55%, rgba(10,10,13,0.45) 100%)" }} />
        <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", padding: 56, gap: 56, alignItems: "center" }}>
          <Poster src={d.poster} width={340} name={d.name} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", justifyContent: "space-between" }}>
            <Logo size={40} />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Where to watch</div>
              <div style={{ display: "flex", fontSize: d.name.length > 28 ? 52 : 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{d.name}</div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: C.text2 }}>{meta(d)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                {d.langChips.map((c) => (
                  <Chip key={c.label} label={c.label} kind={c.kind} size={24} />
                ))}
                {d.service ? <ServiceBadge slug={d.service.slug} size={48} /> : null}
                <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>{d.availability}</div>
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: C.text2 }}>{shortUrl(d)}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await fonts(), headers: HEADERS },
  );
}

// ───────────────────────── Story 1080×1920 ─────────────────────────

/** Instagram UI overlays the top and bottom ~250 px — nothing important there. */
export const STORY_SAFE = 250;

export async function renderStory(d: ShareData): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: C.ink, color: C.text, fontFamily: "Manrope" }}>
        <Background src={d.backdrop ?? d.poster} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(180deg, rgba(10,10,13,0.55) 0%, rgba(10,10,13,0.7) 35%, rgba(10,10,13,0.97) 70%, #0A0A0D 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: STORY_SAFE,
            bottom: STORY_SAFE,
            left: 80,
            right: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, marginTop: 24 }}>
            <Poster src={d.poster} width={d.name.length > 24 ? 420 : 500} name={d.name} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", fontSize: d.name.length > 24 ? 72 : 96, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", textAlign: "center", justifyContent: "center" }}>
                {d.name}
              </div>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.text2 }}>{meta(d)}</div>
              {d.langChips.length > 0 ? (
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {d.langChips.map((c) => (
                    <Chip key={c.label} label={c.label} kind={c.kind} size={34} />
                  ))}
                </div>
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
                {d.service ? <ServiceBadge slug={d.service.slug} size={64} /> : null}
                <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>{d.availability}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Logo size={64} />
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: C.text2 }}>{`Where to watch? · ${shortUrl(d, 34)}`}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: await fonts(), headers: HEADERS },
  );
}
