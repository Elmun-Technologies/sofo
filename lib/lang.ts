/** Language labels. Edition-local terms (TR: "türkçe dublaj / altyazı") live here, not in components. */
const NAMES: Record<string, string> = {
  tr: "Turkish", en: "English", ja: "Japanese", ko: "Korean", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", ar: "Arabic", uz: "Uzbek", "es-419": "Spanish (LatAm)", "pt-BR": "Portuguese (BR)",
};

const LOCAL_NAMES: Record<string, string> = {
  tr: "Türkçe", en: "English", ja: "日本語", ko: "한국어", es: "Español", fr: "Français", de: "Deutsch",
  it: "Italiano", pt: "Português", ru: "Русский", ar: "العربية", uz: "Oʻzbekcha",
};

export function langName(code: string): string {
  return NAMES[code] ?? code.toUpperCase();
}

export function localLangName(code: string): string {
  return LOCAL_NAMES[code] ?? langName(code);
}

/** Edition-local term for a dub / subtitle in the edition language, e.g. "türkçe dublaj". */
export function dubTerm(editionLang: string): string {
  return editionLang === "tr" ? "türkçe dublaj" : `${langName(editionLang)} audio`;
}

export function subTerm(editionLang: string): string {
  return editionLang === "tr" ? "türkçe altyazı" : `${langName(editionLang)} subtitles`;
}
