/** Language labels. Edition-local terms (TR: "türkçe dublaj / altyazı") live here, not in components. */
const NAMES: Record<string, string> = {
  tr: "Turkish", en: "English", ja: "Japanese", ko: "Korean", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", ar: "Arabic", uz: "Uzbek", "es-419": "Spanish (LatAm)", "pt-BR": "Portuguese (BR)",
};

const LOCAL_NAMES: Record<string, string> = {
  tr: "Türkçe", en: "English", ja: "日本語", ko: "한국어", es: "Español", fr: "Français", de: "Deutsch",
  it: "Italiano", pt: "Português", ru: "Русский", ar: "العربية", uz: "Oʻzbekcha",
};

let display: Intl.DisplayNames | null | undefined;

/** English language name: our table first, then the runtime's CLDR names ("cs" → "Czech"), else the code. */
export function langName(code: string): string {
  if (NAMES[code]) return NAMES[code];
  if (display === undefined) {
    try {
      display = new Intl.DisplayNames(["en"], { type: "language" });
    } catch {
      display = null;
    }
  }
  try {
    const name = display?.of(code);
    if (name && name.toLowerCase() !== code.toLowerCase()) return name;
  } catch {
    // Invalid code: fall through.
  }
  return code.toUpperCase();
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
