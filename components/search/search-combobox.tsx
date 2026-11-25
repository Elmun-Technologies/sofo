"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { track } from "@/lib/client/analytics";
import { ClockIcon, EnterIcon, GridIcon, LayersIcon, ListIcon, PersonIcon, SearchIcon, TrendingIcon, XIcon } from "../icons";
import { ServiceLogo } from "../ui/service-logo";
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
  | { id: string; kind: "item"; label: string; meta: string; href: string; icon: "franchise" | "person" | "list" | "category" | "platform"; service?: string }
  | { id: string; kind: "all"; label: string };

const DEBOUNCE_MS = 150;
const EMPTY: SuggestPayload = { q: "", suggestion: null, titles: [], people: [], franchises: [], collections: [], categories: [], trending: [] };

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
    (data.categories ?? []).forEach((c, i) =>
      out.push({ id: `${uid}-cat${i}`, kind: "item", label: c.name, meta: c.meta, href: c.href, icon: c.meta === "Platform" ? "platform" : "category", service: c.service }),
    );
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
    ? "h-14 gap-3 rounded-card pr-2.5 pl-5 text-[17px] md:h-[68px] md:gap-4 md:pr-3.5 md:pl-6 md:text-xl"
    : "h-12 gap-2.5 rounded-input pr-1.5 pl-4 text-[15px]";

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
        className={`flex min-w-0 items-center border transition duration-200 ease-out focus-within:border-orange focus-within:bg-ink focus-within:shadow-[0_0_0_4px_rgb(255_90_31/0.14)] ${isPage ? "border-hairline-strong bg-surface hover:border-text/25" : "border-transparent bg-surface hover:bg-surface-2"} ${sizes}`}
      >
        <SearchIcon className={`${isPage ? "size-5 md:size-[22px]" : "size-[18px]"} shrink-0 text-text-2`} />
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
          placeholder={isPage ? "Search movies, series, people…" : "Find a movie, series or anime"}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent font-medium tracking-[-0.01em] outline-none placeholder:font-normal placeholder:text-text-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && isPage ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition-colors duration-200 hover:bg-text/8 hover:text-text"
          >
            <XIcon className="size-[18px]" />
          </button>
        ) : null}
        {!isPage ? (
          <button type="submit" aria-label="Search" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-orange text-text transition-colors hover:bg-orange-hover">
            <SearchIcon className="size-[18px]" />
          </button>
        ) : null}
      </form>

      <div
        className={`absolute top-full right-0 z-50 mt-2 overflow-hidden rounded-card border border-hairline bg-ink shadow-pop ${isPage ? "left-0" : "left-0 xl:-left-24"} ${showList ? "animate-pop-in" : "hidden"}`}
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
          <div className="border-t border-hairline px-5 py-2.5 text-right">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={recent.clear}
              className="text-xs font-medium text-text-3 transition-colors hover:text-text"
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
  const base = `flex cursor-pointer items-center gap-3 rounded-input px-3 transition-colors duration-150 ${selected ? "bg-text/8" : ""}`;
  const handlers = {
    id: o.id,
    role: "option" as const,
    "aria-selected": selected,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(), // keep focus in the input
    onMouseMove: onHover,
    onClick: onChoose,
  };
  const iconWrap = "flex size-9 shrink-0 items-center justify-center rounded-full bg-text/6 text-text-2";

  const heading = header ? (
    <li lang="en" role="presentation" className="overline px-3 pt-3 pb-1.5 text-text-3">
      {header}
    </li>
  ) : null;

  if (o.kind === "query") {
    if (o.group === "Did you mean") {
      return (
        <li {...handlers} className={`${base} py-3 text-sm`}>
          <span className="text-text-2">
            Did you mean <span className="font-medium text-text underline decoration-hairline-strong underline-offset-[3px]">{o.label}</span>?
          </span>
        </li>
      );
    }
    return (
      <>
        {heading}
        <li {...handlers} className={`${base} py-2.5 text-[15px] font-medium`}>
          {o.group === "Recent" ? <ClockIcon className="size-4 shrink-0 text-text-3" /> : <TrendingIcon className="size-4 shrink-0 text-text-3" />}
          <span className="min-w-0 flex-1 truncate">{o.label}</span>
          {o.rank ? <span className="tnum text-xs text-text-3">{String(o.rank).padStart(2, "0")}</span> : null}
        </li>
      </>
    );
  }

  if (o.kind === "title") {
    const t = o.t;
    return (
      <li {...handlers} className={`${base} py-2`}>
        <span className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded-[8px] bg-surface-3 ring-1 ring-text/10 ring-inset">
          {t.poster ? <Image src={t.poster} alt="" fill sizes="36px" className="object-cover" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{t.name}</span>
          <span className="tnum block truncate text-xs text-text-3">{[t.kind, t.year, t.service].filter(Boolean).join(" · ")}</span>
        </span>
        {t.dub || t.sub ? (
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap text-text-2 ring-1 ring-hairline-strong ring-inset">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${t.dub ? "bg-dub" : "bg-text/70"}`} />
            {lang.toUpperCase()} {t.dub ? "dub" : "sub"}
          </span>
        ) : null}
      </li>
    );
  }

  if (o.kind === "item") {
    const Icon = o.icon === "person" ? PersonIcon : o.icon === "franchise" ? LayersIcon : o.icon === "category" ? GridIcon : ListIcon;
    return (
      <li {...handlers} className={`${base} py-2`}>
        {o.icon === "platform" && o.service ? (
          <ServiceLogo slug={o.service} name={o.label} size={36} />
        ) : (
          <span className={iconWrap} aria-hidden="true">
            <Icon className="size-4" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{o.label}</span>
        <span className="tnum hidden shrink-0 text-xs text-text-3 sm:inline">{o.meta}</span>
      </li>
    );
  }

  return (
    <li {...handlers} className={`${base} relative mt-2 py-2 text-sm font-medium before:absolute before:inset-x-3 before:-top-1 before:h-px before:bg-hairline`}>
      <span className={iconWrap} aria-hidden="true">
        <SearchIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">See all results for “{o.label}”</span>
      <EnterIcon className="size-4 shrink-0 text-text-3" />
    </li>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1].map((i) => (
        <li key={i} role="presentation" className="flex items-center gap-3 px-3 py-2" aria-hidden="true">
          <span className="h-[54px] w-9 animate-pulse rounded-[8px] bg-text/6" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded-full bg-text/6" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-text/6" />
          </span>
        </li>
      ))}
    </>
  );
}
