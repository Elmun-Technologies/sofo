"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon, ShareIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/client/analytics";
import { useLocalStore } from "@/lib/client/local-store";

const KEY = "sofo:follows:v1";
const EMPTY: string[] = [];

/** Follow a person (new releases) — stored locally until accounts exist. */
export function FollowPersonButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const [follows, setFollows] = useLocalStore<string[]>(KEY, EMPTY);
  const on = follows.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      className={`${buttonClass(on ? "secondary" : "primary")} ${className}`}
      onClick={() => {
        setFollows((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
        if (!on) track("person_follow", { person: name });
      }}
    >
      {on ? <CheckIcon className="size-4 text-available" /> : <PlusIcon className="size-4" />}
      {on ? "Following" : "Follow"}
      {on ? null : <span className="sr-only"> — get new releases</span>}
    </button>
  );
}

/** Web Share API with clipboard fallback. */
export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${buttonClass("ghost")} ${className}`}
      onClick={async () => {
        const url = window.location.href;
        track("share", { title });
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch {
          /* user cancelled */
        }
      }}
    >
      {copied ? <CheckIcon className="size-4 text-available" /> : <ShareIcon className="size-4" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
