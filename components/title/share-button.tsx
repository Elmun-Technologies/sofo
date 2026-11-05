"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/client/analytics";

/**
 * "Share to Story": on mobile, Web Share API with the 9:16 story PNG (user adds the link sticker in Instagram);
 * otherwise copies the page link. We never make video from film frames (CLAUDE.md share policy).
 */
export function ShareButton({ edition, type, slug, name }: { edition: string; type: "movie" | "tv"; slug: string; name: string }) {
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    const url = window.location.href.split("#")[0]!;
    track("share", { title: name, method: "story" });
    try {
      const res = await fetch(`/story/${edition}/${type}/${slug}`);
      if (res.ok && navigator.canShare) {
        const file = new File([await res.blob()], `${slug}-sofo-story.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.clipboard?.writeText(url).catch(() => {});
          await navigator.share({ files: [file], title: name, text: url });
          setNote("Link copied — add it as a link sticker in your story.");
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch {
      // User cancelled the share sheet.
    }
  }

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={share} className={buttonClass("ghost")}>
        Share to Story ↗
      </button>
      {note ? (
        <span role="status" className="absolute top-full left-0 z-10 mt-2 w-60 rounded-input bg-surface-2 px-3 py-2 text-xs">
          {note}
        </span>
      ) : null}
    </span>
  );
}
