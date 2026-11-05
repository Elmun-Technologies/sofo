"use client";

import { buttonClass } from "../ui/button";
import { openCookieSettings } from "./consent";

/** Re-opens the cookie banner in settings mode (works wherever <CookieBanner /> is mounted). */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={`${buttonClass("ghost", "sm")} ${className}`}>
      Cookie settings
    </button>
  );
}
