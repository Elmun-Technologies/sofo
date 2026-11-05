import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEdition } from "@/lib/editions";
import { dubTerm, langName } from "@/lib/lang";
import { buildAlternates } from "@/lib/seo/hreflang";

const CONTACT = "hello@sofo.tv";
const PARTNERS = "partners@sofo.tv";

export async function generateMetadata({ params }: PageProps<"/[lang]/hakkinda">): Promise<Metadata> {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) return {};
  return {
    title: "About sofo — how it works",
    description: `sofo shows where a movie or series is streaming in ${e.countryName} and whether it has ${dubTerm(e.contentLang)}. Checked daily, legal services only.`,
    alternates: buildAlternates(e.routes.about, { [e.hreflang]: e.routes.about }),
  };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/hakkinda">) {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) notFound();
  const language = langName(e.contentLang);

  const steps = [
    { title: "You search", body: `A title, an actor, or just “anime with ${language} dub”.` },
    { title: "We check the services", body: `Catalogs, prices, audio and subtitle languages — every day, for ${e.countryName}.` },
    { title: "You watch there", body: "One tap opens the title on the official service. We never host video." },
  ];

  return (
    <div className="mx-auto max-w-site px-4 pt-6 pb-6 md:px-7 md:pt-10">
      <h1 className="max-w-4xl text-[30px] leading-[1.08] font-extrabold tracking-[-0.035em] md:text-[56px]">
        One search. Every service.
        <br />
        Your language.
      </h1>
      <p className="mt-4 hidden max-w-3xl text-lg text-text-2 md:block">
        sofo tells you where a movie or series is streaming in your country — and whether you can watch it dubbed or subtitled in your
        language. It&apos;s free, and it works with the services you already pay for.
      </p>

      <ol className="mt-6 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-card bg-surface p-4 md:block md:rounded-panel md:p-6">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange text-base font-extrabold text-ink md:size-11 md:text-lg">
              {i + 1}
            </span>
            <span>
              <span className="block text-[17px] font-extrabold md:mt-4 md:text-2xl">{s.title}</span>
              <span className="mt-1 block text-sm text-text-2 md:mt-2 md:text-base">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <section id="how-we-verify" aria-labelledby="verify-h" className="mt-6 scroll-mt-24 md:mt-10">
        <h2 id="verify-h" className="sr-only">
          How we verify
        </h2>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          <Card title="Where our data comes from">
            Titles, posters and descriptions: TMDB. Availability, prices and languages: the services&apos; own catalogs via our data
            partner, checked daily. Every page shows when it was last checked.
          </Card>
          <Card title="What we never do" emphasis>
            We don&apos;t host or stream video. We don&apos;t link to pirate sites. If a service doesn&apos;t confirm a language, we
            don&apos;t show it — you&apos;ll see “Not confirmed by the service” instead of a guess.
          </Card>
          <Card title="How sofo makes money">
            Today: it doesn&apos;t. Later, some links may become affiliate links — they will never change the order or what we show.
          </Card>
        </div>
        <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-2 md:gap-4">
          <Card title="When something looks wrong">
            Every title page has a “Something wrong?” link. Reports go to a queue that we re-check within 24 hours.
          </Card>
          <Card title="Changes over time">
            Each time a title arrives, leaves, changes price or gets a new dub, we record it. That&apos;s the history you see on title pages
            and what powers your alerts.
          </Card>
        </div>
      </section>

      <div className="mt-6 grid gap-3 md:mt-10 md:grid-cols-2 md:gap-4">
        <section id="services" aria-labelledby="svc-h" className="scroll-mt-24 rounded-panel border border-orange/20 bg-orange-deep p-5 md:p-6">
          <h2 id="svc-h" className="text-lg font-extrabold md:text-xl">
            For streaming services &amp; studios
          </h2>
          <p className="mt-2 text-sm md:text-base">Spot a wrong price or language? Want your catalog listed correctly — including dubs and subtitles?</p>
          <a href={`mailto:${PARTNERS}`} className="mt-3 inline-block font-extrabold text-orange hover:text-orange-tint">
            {PARTNERS} →
          </a>
        </section>
        <section id="contact" aria-labelledby="contact-h" className="scroll-mt-24 rounded-panel bg-surface p-5 md:p-6">
          <h2 id="contact-h" className="text-lg font-extrabold md:text-xl">
            Contact &amp; legal
          </h2>
          <p className="mt-2 text-sm text-text-2 md:text-base">
            Questions, press or a content removal request:{" "}
            <a href={`mailto:${CONTACT}`} className="font-bold text-text">
              {CONTACT}
            </a>
          </p>
          <p className="mt-3 text-sm text-text-2">
            <Link href={`${e.routes.privacy}#terms`}>Terms</Link> · <Link href={e.routes.privacy}>Privacy (KVKK)</Link> ·{" "}
            <Link href={`${e.routes.privacy}#cookies`}>Cookies</Link> · <a href={`mailto:${CONTACT}?subject=Content%20removal%20request`}>Content removal</a>
          </p>
        </section>
      </div>
    </div>
  );
}

function Card({ title, children, emphasis }: { title: string; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className={`rounded-card border p-5 md:rounded-panel md:p-6 ${emphasis ? "border-line bg-surface" : "border-line bg-ink"}`}>
      <h3 className="text-[17px] font-extrabold md:text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-2 md:text-[15px]">{children}</p>
    </div>
  );
}
