"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";
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
        const blob = await res.blob();
        const ext = blob.type === "image/png" ? "png" : "jpg";
        const file = new File([blob], `${slug}-sofo-story.${ext}`, { type: blob.type || "image/jpeg" });
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
    <span className="relative grid">
      <button type="button" onClick={share} className={buttonClass("ghost")}>
        <ShareIcon className="size-4" />
        Share
      </button>
      {note ? (
        <span role="status" className="animate-pop-in absolute top-full left-0 z-10 mt-2 w-60 rounded-input bg-surface-3 px-3 py-2 text-xs shadow-pop">
          {note}
        </span>
      ) : null}
    </span>
  );
}
