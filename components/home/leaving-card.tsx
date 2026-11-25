"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PosterImage } from "@/components/ui/poster-image";

type Props = { href: string; name: string; service: string; posterPath: string | null; leavingAt: string; listHref: string };

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

/** "Last chance" card next to the hero (santehnika "Товары дня"): a live countdown to the last day on the service. */
export function LeavingCard({ href, name, service, posterPath, leavingAt, listHref }: Props) {
  const end = new Date(leavingAt).getTime();
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
  const left = Math.max(0, end - (now ?? end));
  const parts = [Math.floor(left / 86_400_000), Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60];

  return (
    <div className="flex h-full flex-col rounded-hero bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">Last chance</h2>
        <span className="tnum flex items-center gap-1 text-[13px] font-bold" aria-label="Time left">
          {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 ? <span className="text-text-3">:</span> : null}
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-ink px-1">{now === null ? "--" : pad(p)}</span>
            </span>
          ))}
        </span>
      </div>
      <Link href={href} className="group mt-4 flex flex-1 gap-4 hover:text-text">
        <span className="w-[42%] max-w-[150px] shrink-0">
          <PosterImage path={posterPath} alt="" sizes="150px" className="shadow-poster" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="inline-flex w-fit items-center rounded-full bg-leaving px-2 py-0.5 text-[11px] font-extrabold text-white">Leaving {service}</span>
          <span className="mt-2 line-clamp-3 text-[17px] leading-snug font-bold group-hover:text-orange-press">{name}</span>
          <span className="mt-1 text-[13px] text-text-2">Watch it before it leaves your subscription.</span>
          <span className="mt-auto pt-3 text-[13px] font-bold text-orange-press">Where to watch →</span>
        </span>
      </Link>
      <Link href={listHref} className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-ink text-[13px] font-bold hover:text-orange-press">
        Everything leaving soon
      </Link>
    </div>
  );
}
