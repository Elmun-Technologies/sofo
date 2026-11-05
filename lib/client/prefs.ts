"use client";

import { useLocalStore } from "./local-store";

/** Onboarding answers (PRD 7.4): audio preference + my services. */
export type Prefs = {
  onboarded: boolean;
  /** "dub" = edition-language audio, "sub" = edition-language subtitles, "original" */
  audio: "dub" | "sub" | "original";
  services: string[];
};

const KEY = "sofo:prefs:v1";
export const DEFAULT_PREFS: Prefs = { onboarded: false, audio: "dub", services: [] };

export function usePrefs() {
  return useLocalStore<Prefs>(KEY, DEFAULT_PREFS);
}
