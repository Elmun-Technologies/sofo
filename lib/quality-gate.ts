/** Index quality gate (data-model.md §5, PRD §10). */
export const MAX_CHECK_AGE_DAYS = 7;

export type GateInput = {
  name?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  year?: number | null;
  /** checkedAt of active offers in the edition country */
  activeOfferCheckedAt: Date[];
};

export type GateResult = { index: boolean; reasons: string[] };

export function qualityGate(input: GateInput, now = new Date()): GateResult {
  const reasons: string[] = [];
  if (!input.name) reasons.push("missing localized name");
  if (!input.overview) reasons.push("missing localized overview");
  if (!input.posterPath) reasons.push("missing poster");
  if (!input.year) reasons.push("missing year");
  const fresh = input.activeOfferCheckedAt.some((d) => now.getTime() - d.getTime() <= MAX_CHECK_AGE_DAYS * 86_400_000);
  if (input.activeOfferCheckedAt.length === 0) reasons.push("no active offer");
  else if (!fresh) reasons.push(`offers not checked in ${MAX_CHECK_AGE_DAYS} days`);
  return { index: reasons.length === 0, reasons };
}
