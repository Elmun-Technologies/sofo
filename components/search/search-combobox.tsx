"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { track } from "@/lib/client/analytics";
import { ClockIcon, SearchIcon } from "../icons";
import { useRecentSearches } from "./recent-searches";
import type { SuggestPayload } from "./types";

type Props = {
  /** Results page path, e.g. "/tr/ara" */
  action: string;
  variant?: "header" | "page";
  defaultValue?: string;
  autoFocus?: boolean;
  /** Extra query params kept on submit (e.g. the audio filter on the results page) */
  keepParams?: Record<string, string>;
};

type Option =
  | { id: string; kind: "query"; label: string; group: "Recent" | "Trending in Türkiye" | "Did you mean"; rank?: number }
  | { id: string; kind: "title"; t: SuggestPayload["titles"][number] }
  | { id: string; kind: "item"; label: string; meta: string; href: string; icon: "franchise" | "person" | "list" }
  | { id: string; kind: "all"; label: string };

const DEBOUNCE_MS = 150;
const EMPTY: SuggestPayload = { q: "", suggestion: null, titles: [], people: [], franchises: [], collections: [], trending: [] };

/**
 * Search box with instant results (combobox + listbox, WAI-ARIA 1.2).
 * Keyboard: "/" focus (header) · ↑ ↓ move · Enter open · Esc close.
 */
export function SearchCombobox({ action, variant = "header", defaultValue = "", autoFocus, keepParams }: Props) {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const cache = useRef(new Map<string, SuggestPayload>());
  const lang = action.split("/")[1] ?? "tr";
  const isPage = variant === "page";

  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState<SuggestPayload>(EMPTY);
  const [loading, setLoading] = useState(false);
  const recent = useRecentSearches();

  const q = value.trim();

  // "/" focuses the header search from anywhere.
  useEffect(() => {
    if (isPage) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t?.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPage]);

  // Debounced fetch; the empty query loads trending searches once.
  useEffect(() => {
    if (!open || (isPage && !q)) return;
    const key = q.toLocaleLowerCase("tr");
    const hit = cache.current.get(key);
    if (hit) {
      setData(hit);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/search?lang=${encodeURIComponent(lang)}&limit=6&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
          if (!res.ok) throw new Error(String(res.status));
          const json = (await res.json()) as SuggestPayload;
          cache.current.set(key, json);
          setData(json);
        } catch (err) {
          if ((err as Error).name !== "AbortError") setData(EMPTY);
        } finally {
          if (!ctrl.signal.aborted) setLoading(false);
        }
      },
      q ? DEBOUNCE_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, open, lang, isPage]);

  const options = useMemo<Option[]>(() => {
    if (!q) {
      if (isPage) return [];
      const rec = recent.items.map((label, i): Option => ({ id: `${uid}-r${i}`, kind: "query", label, group: "Recent" }));
      const seen = new Set(recent.items.map((r) => r.toLocaleLowerCase("tr")));
      const trend = data.trending
        .filter((t) => !seen.has(t))
        .map((label, i): Option => ({ id: `${uid}-t${i}`, kind: "query", label, group: "Trending in Türkiye", rank: i + 1 }));
      return [...rec, ...trend];
    }
    // Ignore stale data from a previous query.
    if (data.q && data.q !== q.toLocaleLowerCase("tr").replace(/\s+/g, " ")) {
      return [{ id: `${uid}-all`, kind: "all", label: q }];
    }
    const out: Option[] = [];
    if (data.suggestion) out.push({ id: `${uid}-dym`, kind: "query", label: data.suggestion.name, group: "Did you mean" });
    data.titles.forEach((t) => out.push({ id: `${uid}-ti${t.id}`, kind: "title", t }));
    data.franchises.forEach((f, i) => out.push({ id: `${uid}-f${i}`, kind: "item", label: f.name, meta: f.meta, href: f.href, icon: "franchise" }));
    data.collections.forEach((c, i) => out.push({ id: `${uid}-c${i}`, kind: "item", label: c.name, meta: c.meta, href: c.href, icon: "list" }));
    data.people.forEach((p, i) => out.push({ id: `${uid}-p${i}`, kind: "item", label: p.name, meta: p.meta, href: p.href, icon: "person" }));
    out.push({ id: `${uid}-all`, kind: "all", label: q });
    return out;
  }, [q, isPage, recent.items, data, uid]);

  const showList = open && (options.length > 0 || (!!q && loading));
  const activeOpt = active >= 0 ? options[active] : undefined;

  function resultsUrl(query: string) {
    const sp = new URLSearchParams({ q: query, ...(keepParams ?? {}) });
    return `${action}?${sp.toString()}`;
  }

  function submit(query: string) {
    const v = query.trim();
    setOpen(false);
    setActive(-1);
    if (!v) {
      router.push(action);
      return;
    }
    recent.add(v);
    track("search", { search_term: v });
    setValue(v);
    inputRef.current?.blur();
    router.push(resultsUrl(v));
  }

  function choose(o: Option) {
    if (o.kind === "query" || o.kind === "all") return submit(o.label);
    if (q) recent.add(q);
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    router.push(o.kind === "title" ? o.t.href : o.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      const n = options.length;
      if (!n) return;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1 >= n ? -1 : i + 1) : i <= -1 ? n - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeOpt && showList) {
        e.preventDefault();
        choose(activeOpt);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (value) {
        setValue("");
      } else {
        inputRef.current?.blur();
      }
    }
  }

  const sizes = isPage
    ? "h-14 gap-3 rounded-input border-2 px-4 text-[17px] md:h-16 md:text-lg"
    : "h-11 gap-2.5 rounded-input border px-3.5 text-sm";

  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <form
        role="search"
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className={`flex min-w-0 items-center border-line bg-surface focus-within:border-orange ${sizes}`}
      >
        <SearchIcon className={`${isPage ? "size-5" : "size-[18px]"} shrink-0 text-orange`} />
        <label htmlFor={`${uid}-q`} className="sr-only">
          Search movies, series, people
        </label>
        <input
          ref={inputRef}
          id={`${uid}-q`}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOpt && showList ? activeOpt.id : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={100}
          autoFocus={autoFocus}
          value={value}
          placeholder="Search movies, series, people…"
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-medium placeholder:text-text-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && isPage ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="inline-flex size-8 items-center justify-center rounded-chip text-text-2 hover:bg-surface-2 hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ) : null}
        {!isPage ? <kbd className="rounded-[5px] border border-line px-1.5 text-xs text-text-2">/</kbd> : null}
      </form>

      <div
        className={`absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-card border border-line bg-surface shadow-2xl shadow-black/60 ${showList ? "" : "hidden"}`}
      >
        <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
          {q && loading && options.length <= 1 ? <SkeletonRows /> : null}
          {options.map((o, i) => {
            const prev = options[i - 1];
            const header =
              o.kind === "query" && (prev?.kind !== "query" || prev.group !== o.group) && o.group !== "Did you mean" ? o.group : null;
            return (
              <OptionRow
                key={o.id}
                o={o}
                lang={lang}
                header={header}
                selected={i === active}
                onHover={() => setActive(i)}
                onChoose={() => choose(o)}
              />
            );
          })}
        </ul>
        {!q && recent.items.length > 0 ? (
          <div className="border-t border-line-soft px-4 py-2 text-right">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={recent.clear}
              className="text-xs font-bold text-text-3 hover:text-text"
            >
              Clear recent searches
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionRow({
  o,
  lang,
  header,
  selected,
  onHover,
  onChoose,
}: {
  o: Option;
  lang: string;
  header: string | null;
  selected: boolean;
  onHover: () => void;
  onChoose: () => void;
}) {
  const base = `flex cursor-pointer items-center gap-3 rounded-input px-3 ${selected ? "bg-surface-2" : ""}`;
  const handlers = {
    id: o.id,
    role: "option" as const,
    "aria-selected": selected,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(), // keep focus in the input
    onMouseMove: onHover,
    onClick: onChoose,
  };

  const heading = header ? (
    <li lang="en" role="presentation" className="px-3 pt-2 pb-1 text-[11px] font-extrabold tracking-[0.08em] text-text-3 uppercase">
      {header}
    </li>
  ) : null;

  if (o.kind === "query") {
    if (o.group === "Did you mean") {
      return (
        <li {...handlers} className={`${base} py-2.5 text-sm`}>
          <span className="text-text-2">Did you mean</span>
          <span className="font-extrabold text-orange">{o.label}</span>
          <span className="-ml-2 text-text-2">?</span>
        </li>
      );
    }
    return (
      <>
        {heading}
        <li {...handlers} className={`${base} py-2.5 text-[15px] font-semibold`}>
          {o.group === "Recent" ? <ClockIcon className="size-4 shrink-0 text-text-3" /> : <TrendIcon />}
          <span className="min-w-0 flex-1 truncate">{o.label}</span>
          {o.rank ? <span className="text-xs font-bold text-text-3">#{o.rank}</span> : null}
        </li>
      </>
    );
  }

  if (o.kind === "title") {
    const t = o.t;
    return (
      <li {...handlers} className={`${base} py-2`}>
        <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-surface-2">
          {t.poster ? <Image src={t.poster} alt="" fill sizes="32px" className="object-cover" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{t.name}</span>
          <span className="block truncate text-xs text-text-2">{[t.kind, t.year, t.service].filter(Boolean).join(" · ")}</span>
        </span>
        {t.dub ? (
          <span className="rounded-chip bg-dub px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-white">{lang.toUpperCase()} dub</span>
        ) : t.sub ? (
          <span className="rounded-chip bg-white px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-ink">{lang.toUpperCase()} sub</span>
        ) : null}
      </li>
    );
  }

  if (o.kind === "item") {
    return (
      <li {...handlers} className={`${base} py-2.5`}>
        <span className="flex w-8 shrink-0 justify-center text-text-3" aria-hidden="true">
          {o.icon === "person" ? "◉" : o.icon === "franchise" ? "▤" : "☰"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{o.label}</span>
        <span className="hidden shrink-0 text-xs text-text-2 sm:inline">{o.meta}</span>
      </li>
    );
  }

  return (
    <li {...handlers} className={`${base} mt-1 border-t border-line-soft py-2.5 text-sm font-bold`}>
      <SearchIcon className="size-4 w-8 shrink-0 text-text-3" />
      <span className="min-w-0 flex-1 truncate">See all results for “{o.label}”</span>
      <span className="text-text-3" aria-hidden="true">
        ↵
      </span>
    </li>
  );
}

function TrendIcon() {
  return (
    <svg className="size-4 shrink-0 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1].map((i) => (
        <li key={i} role="presentation" className="flex items-center gap-3 px-3 py-2" aria-hidden="true">
          <span className="h-12 w-8 animate-pulse rounded-md bg-surface-2" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-surface-2" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-surface-2" />
          </span>
        </li>
      ))}
    </>
  );
}
