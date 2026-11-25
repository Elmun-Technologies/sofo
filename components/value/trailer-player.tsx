"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/icons";
import { track } from "@/lib/client/analytics";

type Props = {
  /** YouTube video key (official video only) */
  videoKey: string;
  title: string;
  /** Video language (Video.lang), e.g. "en" — shown as a corner tag */
  lang?: string | null;
  /** Language that gets the dub dot on its tag (the edition language) */
  highlightLang?: string;
  /** Duration label, e.g. "2:35" */
  duration?: string | null;
  /** Content drawn on the facade only — removed once the player loads (never overlay the player). */
  overlay?: React.ReactNode;
  /** Shown on the facade when YouTube's thumbnail is unavailable; defaults to `title` */
  fallbackLabel?: React.ReactNode;
  /** Play button position: centre (default) or bottom-left for hero layouts */
  playPosition?: "center" | "bottom-left";
  /** Play button size */
  playSize?: "md" | "lg";
  /** CSS aspect ratio class, default 16:9 */
  aspect?: string;
  className?: string;
  priority?: boolean;
};

const TAG = "inline-flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11px] leading-none font-medium text-white ring-1 ring-text/12 ring-inset backdrop-blur-md";

/**
 * Official YouTube trailer (CLAUDE.md "Trailer & share policy"):
 * click-to-load facade → youtube-nocookie iframe. No autoplay, no download, nothing drawn over the player.
 */
export function TrailerPlayer({
  videoKey,
  title,
  lang,
  highlightLang = "tr",
  duration,
  overlay,
  fallbackLabel,
  playPosition = "center",
  playSize = "md",
  aspect = "aspect-video",
  className = "",
  priority,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(false);

  if (playing) {
    return (
      <div className={`relative overflow-hidden rounded-card bg-black ${aspect} ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?rel=0`}
          title={title}
          className="absolute inset-0 size-full"
          allow="encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  const big = playSize === "lg";

  return (
    <div className={`group relative isolate overflow-hidden rounded-card bg-[#16171b] ${aspect} ${className}`}>
      {/* Resting surface: reads as a deliberate title card until (or unless) the thumbnail arrives. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.07)_0%,transparent_55%)]" />
      {thumb ? null : (
        <p aria-hidden="true" className={`absolute top-0 left-0 line-clamp-2 max-w-[78%] font-medium tracking-[-0.02em] text-white/55 ${big ? "p-5 text-lg md:p-7 md:text-2xl" : "p-4 text-sm"}`}>
          {fallbackLabel ?? title}
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, not re-hosted or optimised by us */}
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setThumb(true);
        }}
        src={`https://i.ytimg.com/vi/${encodeURIComponent(videoKey)}/hqdefault.jpg`}
        alt=""
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setThumb(true)}
        className={`absolute inset-0 size-full object-cover transition duration-500 ease-out group-hover:scale-[1.03] ${thumb ? "opacity-100" : "opacity-0"}`}
      />
      {thumb ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" /> : null}
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-text/8 ring-inset" />

      {lang ? (
        <span className={`${TAG} absolute ${big ? "top-4 right-4 md:top-6 md:right-6" : "top-3 right-3"}`}>
          {lang === highlightLang ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" /> : null}
          <span lang="en">{lang.toUpperCase()}</span>
        </span>
      ) : null}
      {duration ? <span className={`${TAG} tnum absolute ${big ? "right-4 bottom-4 md:right-6 md:bottom-6" : "right-3 bottom-3"}`}>{duration}</span> : null}

      <button
        type="button"
        onClick={() => {
          setPlaying(true);
          track("trailer_play", { video: videoKey, title, lang: lang ?? undefined });
        }}
        aria-label={`Play trailer: ${title}`}
        className={`absolute inset-0 flex rounded-[inherit] ${playPosition === "center" ? "items-center justify-center" : big ? "items-end justify-start p-4 md:p-6" : "items-end justify-start p-3"}`}
      >
        <span
          className={`inline-flex items-center justify-center rounded-full bg-text text-ink transition duration-200 ease-out group-hover:scale-105 group-active:scale-95 ${
            big ? "size-14 md:size-[72px]" : playPosition === "center" ? "size-12" : "size-10"
          }`}
        >
          <PlayIcon className={`ml-0.5 ${big ? "size-5 md:size-7" : playPosition === "center" ? "size-5" : "size-4"}`} />
        </span>
      </button>
    </div>
  );
}

/** Small non-interactive thumbnail (lists that link to a trailer). Shows a quiet play mark when the thumbnail is unavailable. */
export function TrailerThumb({ videoKey, className = "" }: { videoKey: string; className?: string }) {
  const [thumb, setThumb] = useState(false);
  return (
    <span className={`relative block aspect-video shrink-0 overflow-hidden rounded-[10px] bg-surface-2 ${className}`}>
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.07)_0%,transparent_60%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, not re-hosted or optimised by us */}
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setThumb(true);
        }}
        src={`https://i.ytimg.com/vi/${encodeURIComponent(videoKey)}/mqdefault.jpg`}
        alt=""
        loading="lazy"
        onLoad={() => setThumb(true)}
        className={`absolute inset-0 size-full object-cover ${thumb ? "opacity-100" : "opacity-0"}`}
      />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-text/15 backdrop-blur-sm ring-inset">
          <PlayIcon className="ml-px size-3" />
        </span>
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-text/8 ring-inset" />
    </span>
  );
}
