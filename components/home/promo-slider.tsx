"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
import { track } from "@/lib/client/analytics";
import { useWatchlist } from "@/lib/client/watchlist";

export type PromoSlide = {
  id: number;
  type: "movie" | "tv";
  slug: string;
  href: string;
  name: string;
  year: number | null;
  posterPath: string | null;
  backdrop: string;
  overview: string | null;
  meta: string[];
  score: number | null;
  services: { slug: string; name: string; logoPath: string | null }[];
  /** "türkçe dublaj" | "türkçe altyazı" | null — only when the service confirms it */
  langLabel: string | null;
  langKind: "dub" | "sub" | null;
  free: boolean;
};

const AUTOPLAY_MS = 7000;

/**
 * Wide promo carousel: one centred slide, dimmed neighbours peeking on both sides.
 * Native scroll-snap (swipe works without JS); arrows, dots and autoplay are enhancement.
 */
export function PromoSlider({ slides, localLang, contained = false }: { slides: PromoSlide[]; localLang: string; contained?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const n = (i + slides.length) % slides.length;
      const slide = el.children[n] as HTMLElement | undefined;
      if (!slide) return;
      el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: "smooth" });
    },
    [slides.length],
  );

  // Active slide = the one closest to the scroller's centre.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centre = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let dist = Infinity;
        [...el.children].forEach((c, i) => {
          const s = c as HTMLElement;
          const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - centre);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) go(active + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [active, paused, go, slides.length]);

  const arrow =
    "absolute top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-text/15 backdrop-blur-md transition duration-200 hover:bg-black/70 hover:scale-105 md:inline-flex";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={scroller}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto ${contained ? "gap-3 rounded-hero" : "gap-3 px-4 md:gap-5 md:px-[max(28px,calc((100vw-1216px)/2))]"}`}
      >
        {slides.map((s, i) => (
          <Slide key={s.id} slide={s} index={i} total={slides.length} current={i === active} localLang={localLang} onSelect={() => go(i)} contained={contained} />
        ))}
      </div>

      <button type="button" aria-label="Previous slide" onClick={() => go(active - 1)} className={`${arrow} left-3 ${contained ? "" : "xl:left-[max(12px,calc((100vw-1216px)/2-72px))]"}`}>
        <ChevronLeftIcon className="size-6" />
      </button>
      <button type="button" aria-label="Next slide" onClick={() => go(active + 1)} className={`${arrow} right-3 ${contained ? "" : "xl:right-[max(12px,calc((100vw-1216px)/2-72px))]"}`}>
        <ChevronRightIcon className="size-6" />
      </button>

      <div className="mt-3 flex justify-center gap-1.5 md:mt-4" role="tablist" aria-label="Choose slide">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`${i + 1}. ${s.name}`}
            onClick={() => go(i)}
            className="group/dot flex h-5 items-center px-0.5"
          >
            <span className={`block h-1 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-text" : "w-1.5 bg-text/25 group-hover/dot:bg-text/50"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

function Slide({ slide: s, index, total, current, localLang, onSelect, contained }: { slide: PromoSlide; index: number; total: number; current: boolean; localLang: string; onSelect: () => void; contained?: boolean }) {
  const list = useWatchlist();
  const saved = list.has(s.id);
  return (
    <article
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${s.name}`}
      className={`relative shrink-0 snap-center overflow-hidden rounded-hero bg-surface ${contained ? "aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[440px]" : "aspect-[4/5] w-[88%] sm:aspect-[16/9] sm:w-[84%] md:w-full md:max-w-[1216px] lg:aspect-[1216/460]"}`}
    >
      <Image src={s.backdrop} alt="" fill priority={index === 0} sizes="(max-width: 768px) 88vw, 1216px" className="object-cover object-[70%_20%]" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 from-15% via-black/60 via-55% to-black/0 md:bg-gradient-to-r md:from-black/85 md:from-0% md:via-black/45 md:via-50% md:to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-1/2 bg-gradient-to-t from-black/50 to-transparent md:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-hero ring-1 ring-text/10 ring-inset" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white [&>*]:shrink-0 [text-shadow:0_1px_14px_rgb(0_0_0/0.55)] md:max-w-[620px] md:justify-center md:p-10 lg:p-14">
        <p className="tnum flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/70">
          {s.score ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-text/14 px-2 py-0.5 font-medium text-white backdrop-blur">
              <StarIcon className="size-3 text-leaving" />
              {s.score.toFixed(1)}
            </span>
          ) : null}
          {s.meta.map((m, i) => (
            <span key={m}>
              {i > 0 ? <span aria-hidden="true" className="mr-2 text-white/35">•</span> : null}
              {m}
            </span>
          ))}
        </p>
        <h2
          className={`mt-2.5 line-clamp-2 pb-[0.14em] leading-[1.12] font-extrabold tracking-[-0.03em] ${
            s.name.length > 24 ? "text-[26px] md:text-[34px] lg:text-[40px]" : "text-[30px] md:text-[44px] lg:text-[52px]"
          }`}
        >
          <Link href={s.href} className="hover:text-white">
            {s.name}
          </Link>
        </h2>
        {s.overview ? (
          <p lang={localLang} className="mt-3 line-clamp-2 max-w-[520px] text-sm leading-relaxed text-white/75 md:text-[15px]">
            {s.overview}
          </p>
        ) : null}

        {s.services[0] ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-semibold md:mt-5">
            <span className="flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {s.services.slice(0, 3).map((sv) => (
                  <ServiceLogo key={sv.slug} {...sv} size={24} className="ring-2 ring-ink" />
                ))}
              </span>
              <span>
                {s.services[0].name}
                {s.services.length > 1 ? ` +${s.services.length - 1}` : ""}
              </span>
            </span>
            {s.langLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-1.5 rounded-full ${s.langKind === "dub" ? "bg-dub" : "bg-text"}`} />
                <span lang={localLang}>{s.langLabel}</span>
              </span>
            ) : null}
            {s.free ? (
              <span className="inline-flex items-center gap-1.5 text-free">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-free" />
                Free
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-2.5 md:mt-7">
          <Link href={s.href} className={buttonClass("accent", "lg")} tabIndex={current ? 0 : -1}>
            Where to watch
          </Link>
          <button
            type="button"
            aria-pressed={saved}
            tabIndex={current ? 0 : -1}
            onClick={() => {
              if (saved) list.remove(s.id);
              else {
                list.add({ id: s.id, type: s.type, slug: s.slug, name: s.name, posterPath: s.posterPath, year: s.year });
                track("list_add", { title: s.name });
              }
            }}
            className={buttonClass("glass", "lg")}
          >
            {saved ? <CheckIcon className="size-[18px]" /> : <BookmarkIcon className="size-[18px]" />}
            <span className="max-sm:sr-only">{saved ? "In my list" : "My list"}</span>
          </button>
        </div>
      </div>

      {/* Dimmed neighbour: click brings it to the centre. */}
      {!current ? (
        <button type="button" aria-label={`Show ${s.name}`} tabIndex={-1} onClick={onSelect} className="absolute inset-0 z-10 cursor-pointer bg-ink/60 transition-colors duration-300 hover:bg-ink/45" />
      ) : null}
    </article>
  );
}
