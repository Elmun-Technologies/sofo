import type { Metadata } from "next";
import { getEdition } from "@/lib/editions";
import { buildAlternates } from "@/lib/seo/hreflang";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const home = getEdition(lang)?.routes.home ?? `/${lang}`;
  return {
    title: { absolute: "sofo — every movie, every service, your language" },
    alternates: buildAlternates(home, { [lang]: home }),
  };
}

// Placeholder home — real sections land in 02-core-pages.
export default function EditionHome() {
  return (
    <section className="mx-auto max-w-site px-4 py-16 text-center md:px-7 md:py-24">
      <h1 className="text-[34px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[72px]">
        Every movie. Every service.
        <br />
        <span className="text-orange">Your language.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base font-medium text-text-2 md:text-lg">
        Search once — we check Netflix, Disney+, Prime Video and 40+ legal services to find the version you can
        actually understand.
      </p>
    </section>
  );
}
