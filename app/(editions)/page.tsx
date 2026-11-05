import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { EDITIONS, PLANNED_EDITIONS } from "@/lib/editions";
import { buildAlternates } from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: { absolute: "sofo — choose your edition" },
  alternates: buildAlternates(
    "/",
    Object.fromEntries(Object.values(EDITIONS).map((e) => [e.hreflang, e.routes.home])),
  ),
};

// Minimal picker — full Editions design lands with page 16.
export default function EditionPicker() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Logo className="text-[40px]" />
      <h1 className="mt-8 text-2xl font-extrabold">Where do you watch?</h1>
      <p className="mt-2 text-text-2">Each edition shows that country&apos;s catalogue and local language terms.</p>
      <ul className="mt-8 grid w-full gap-3">
        {Object.values(EDITIONS).map((e) => (
          <li key={e.code}>
            <Link
              href={e.routes.home}
              className="flex h-14 items-center justify-between rounded-card border border-line bg-surface px-5 font-bold hover:border-orange hover:text-text"
            >
              {e.countryName}
              <span className="text-sm text-text-2">{e.switcherLabel}</span>
            </Link>
          </li>
        ))}
        {PLANNED_EDITIONS.map((name) => (
          <li
            key={name}
            className="flex h-14 items-center justify-between rounded-card border border-line-soft px-5 font-bold text-text-3"
          >
            {name}
            <span className="text-sm">Soon</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
