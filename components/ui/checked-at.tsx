import { checkedLabel } from "@/lib/format";

/** Every availability shows when it was checked (business rule 2). */
export function CheckedAt({ at, source, className = "" }: { at: Date; source?: string; className?: string }) {
  return (
    <time dateTime={at.toISOString()} className={`text-xs text-text-3 ${className}`}>
      {checkedLabel(at)}
      {source ? ` · ${source}` : ""}
    </time>
  );
}
