/** Visual identity for service tiles (no third-party logo files except sample ones). */
export type ServiceStyle = { bg: string; fg: string; short: string };

const STYLES: Record<string, ServiceStyle> = {
  netflix: { bg: "#000000", fg: "#E50914", short: "N" },
  "prime-video": { bg: "#FFFFFF", fg: "#1A98FF", short: "prime" },
  "disney-plus": { bg: "#0B2A5B", fg: "#FFFFFF", short: "D+" },
  "hbo-max": { bg: "#5B2BD6", fg: "#FFFFFF", short: "max" },
  tod: { bg: "#3A0CA3", fg: "#FFFFFF", short: "TOD" },
  tabii: { bg: "#0F7B5F", fg: "#FFFFFF", short: "tabii" },
  exxen: { bg: "#FFC400", fg: "#111111", short: "exx" },
  gain: { bg: "#FF2D55", fg: "#FFFFFF", short: "gain" },
};

export function serviceStyle(slug: string): ServiceStyle {
  return STYLES[slug] ?? { bg: "#26262F", fg: "#FFFFFF", short: slug.slice(0, 3) };
}

/** Short CTA verb per offer type. */
export function offerVerb(type: string): string {
  switch (type) {
    case "rent":
      return "Rent";
    case "buy":
      return "Buy";
    case "free":
    case "ads":
      return "Watch free";
    default:
      return "Watch";
  }
}

export function offerTypeLabel(type: string): string {
  return { subscription: "Subscription", free: "Free", ads: "Free with ads", rent: "Rent", buy: "Buy" }[type] ?? type;
}
