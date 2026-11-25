"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PosterImage } from "@/components/ui/poster-image";

export type LeavingItem = { href: string; name: string; service: string; posterPath: string | null; leavingAt: string; year: number | null };

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

/**
 * "Last chance" card next to the hero (santehnika "Товары дня"): soonest-leaving titles one at a time,
 * a live countdown to the last day, arrows and dots.
 */
export function LeavingCard({ items, listHref }: { items: LeavingItem[]; listHref: string }) {
  const [i, setI] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const item = items[i] ?? items[0];
  if (!item) return null;
  const end = new Date(item.leavingAt).getTime();
  const left = Math.max(0, end - (now ?? end));
  const days = Math.floor(left / 86_400_000);
  const clock = [days, Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60];
  const go = (d: number) => setI((v) => (v + d + items.length) % items.length);

  return (
    <div className="flex h-full flex-col rounded-hero bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Last chance</h2>
        <span className="tnum flex items-center gap-1 text-[13px] font-bold" aria-label={`${days} days left`}>
          {clock.map((p, k) => (
            <span key={k} className="flex items-center gap-1">
              {k > 0 ? <span className="text-text-3">:</span> : null}
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-ink px-1">{now === null ? "--" : pad(p)}</span>
            </span>
          ))}
        </span>
      </div>

      <Link href={item.href} className="group mt-4 flex flex-1 gap-4 hover:text-text">
        <span className="w-[46%] max-w-[160px] shrink-0">
          <PosterImage path={item.posterPath} alt="" sizes="160px" className="shadow-poster" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="inline-flex w-fit items-center rounded-full bg-[#ea580c] px-2 py-0.5 text-[11px] font-extrabold text-white">
            {days === 0 ? "Last day" : `${days} ${days === 1 ? "day" : "days"} left`}
          </span>
          <span className="mt-2 line-clamp-3 shrink-0 pb-0.5 text-[18px] leading-snug font-extrabold group-hover:text-orange-press">{item.name}</span>
          <span className="mt-1 text-[13px] text-text-2">
            Leaves {item.service}
            {item.year ? ` · ${item.year}` : ""}
          </span>
          <span className="mt-auto pt-3 text-[13px] font-bold text-orange-press">Where to watch →</span>
        </span>
      </Link>

      <div className="mt-4 flex items-center gap-2">
        {items.length > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-text hover:text-orange-press">
              <ChevronLeftIcon className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-text hover:text-orange-press">
              <ChevronRightIcon className="size-5" />
            </button>
            <span className="ml-1 flex gap-1" aria-hidden="true">
              {items.map((it, k) => (
                <span key={it.href} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-text" : "w-1.5 bg-text/20"}`} />
              ))}
            </span>
          </>
        ) : null}
        <Link href={listHref} className="ml-auto text-[13px] font-bold text-text-2 hover:text-orange-press">
          All leaving →
        </Link>
      </div>
    </div>
  );
}
