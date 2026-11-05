"use client";

import { useState } from "react";
import { track } from "@/lib/client/analytics";

type Props = {
  /** YouTube video key (official video only) */
  videoKey: string;
  title: string;
  /** Video language (Video.lang), e.g. "en" — shown as a corner badge */
  lang?: string | null;
  /** Duration label, e.g. "2:35" */
  duration?: string | null;
  /** Content drawn on the facade only — removed once the player loads (never overlay the player). */
  overlay?: React.ReactNode;
  /** Play button position: centre (default) or bottom-left for hero layouts */
  playPosition?: "center" | "bottom-left";
  /** CSS aspect ratio class, default 16:9 */
  aspect?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Official YouTube trailer (CLAUDE.md "Trailer & share policy"):
 * click-to-load facade → youtube-nocookie iframe. No autoplay, no download, nothing drawn over the player.
 */
export function TrailerPlayer({ videoKey, title, lang, duration, overlay, playPosition = "center", aspect = "aspect-video", className = "", priority }: Props) {
  const [playing, setPlaying] = useState(false);

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

  return (
    <div className={`group relative overflow-hidden rounded-card bg-surface-2 ${aspect} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, not re-hosted or optimised by us */}
      <img
        src={`https://i.ytimg.com/vi/${encodeURIComponent(videoKey)}/hqdefault.jpg`}
        alt=""
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
      {lang ? (
        <span className={`absolute top-2.5 right-2.5 rounded-chip px-2 py-0.5 text-[11px] font-extrabold ${lang === "tr" ? "bg-dub text-white" : "bg-black/70 text-white"}`}>
          {lang.toUpperCase()}
        </span>
      ) : null}
      {duration ? (
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-chip bg-black/75 px-2 py-0.5 text-[11px] font-extrabold text-white">
          <PlayGlyph className="size-2.5" /> {duration}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setPlaying(true);
          track("trailer_play", { video: videoKey, title, lang: lang ?? undefined });
        }}
        aria-label={`Play trailer: ${title}`}
        className={`absolute inset-0 flex ${playPosition === "center" ? "items-center justify-center" : "items-end justify-start p-5 md:p-6"}`}
      >
        <span
          className={`inline-flex items-center justify-center rounded-full bg-white text-ink shadow-lg transition group-hover:scale-105 ${
            playPosition === "center" ? "size-14" : "size-14 md:size-[60px]"
          }`}
        >
          <PlayGlyph className="ml-0.5 size-5" />
        </span>
      </button>
    </div>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}
