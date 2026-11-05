/** Display names for the 8 core services — used where no DB row is at hand (client modals). */
export const SERVICE_NAMES: Record<string, string> = {
  netflix: "Netflix",
  "prime-video": "Prime Video",
  "disney-plus": "Disney+",
  "hbo-max": "HBO Max",
  tod: "TOD",
  tabii: "tabii",
  exxen: "Exxen",
  gain: "Gain",
};

export type ServiceOption = { slug: string; name: string; logoPath?: string | null };

export function serviceOptions(slugs: string[], rows?: ServiceOption[]): ServiceOption[] {
  return slugs.map((slug) => rows?.find((r) => r.slug === slug) ?? { slug, name: SERVICE_NAMES[slug] ?? slug, logoPath: null });
}
