import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";

export type Feature = { href: string; title: string; text: string; icon: React.ReactNode; tone: string; lang?: string };

/** santehnika "Журнал / Магазины / Установка" bento: soft tiles with a big tinted icon and an arrow button. */
export function FeatureBento({ items }: { items: Feature[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-4">
      {items.map((f) => (
        <li key={f.href}>
          <Link href={f.href} className="group relative flex h-full min-h-[150px] flex-col overflow-hidden rounded-card bg-surface p-4 transition-colors hover:bg-surface-2 hover:text-text md:min-h-[176px] md:p-5">
            <span lang={f.lang} className="relative z-10 text-[16px] leading-tight font-extrabold tracking-[-0.015em] md:text-[19px]">
              {f.title}
            </span>
            <span className="relative z-10 mt-1.5 max-w-[78%] text-[13px] leading-snug text-text-2">{f.text}</span>
            <span aria-hidden="true" className={`absolute -right-5 -bottom-5 flex size-28 items-center justify-center rounded-full md:size-32 ${f.tone}`}>
              {f.icon}
            </span>
            <span className="relative z-10 mt-auto inline-flex size-9 items-center justify-center rounded-full bg-ink text-text transition-transform group-hover:-translate-y-0.5">
              <ArrowUpRightIcon className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** "Our advantages" row (santehnika): five short promises with an icon. */
export function Advantages({ items }: { items: { title: string; text: string; icon: React.ReactNode }[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:px-0">
      {items.map((a) => (
        <li key={a.title} className="w-[220px] shrink-0 rounded-card bg-surface p-4 md:w-auto md:p-5">
          <span className="inline-flex size-11 items-center justify-center rounded-[12px] bg-ink text-orange">{a.icon}</span>
          <h3 className="mt-3 text-[15px] leading-snug font-extrabold">{a.title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-text-2">{a.text}</p>
        </li>
      ))}
    </ul>
  );
}
