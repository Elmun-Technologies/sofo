import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ArrowUpRightIcon, MailIcon } from "@/components/icons";
import { EditorialBody, EditorialHero, EditorialSection, type TocItem } from "@/components/static/editorial";
import { buttonClass } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
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

const TOC: TocItem[] = [
  { id: "how-it-works", label: "How it works" },
  { id: "how-we-verify", label: "How we verify" },
  { id: "services", label: "For services & studios" },
  { id: "contact", label: "Contact & legal" },
];

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
    <>
      <EditorialHero
        eyebrow="About sofo"
        title={
          <>
            One search. Every service. <span className="text-text-3">Your language.</span>
          </>
        }
        intro={
          <>
            sofo tells you where a movie or series is streaming in your country — and whether you can watch it dubbed or subtitled in your language. It&apos;s
            free, and it works with the services you already pay for.
          </>
        }
      >
        <ul className="mt-8 flex flex-wrap gap-2 md:mt-12">
          <li className="tag">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
            Legal services only
          </li>
          <li className="tag">Checked daily</li>
          <li className="tag">Languages confirmed, never guessed</li>
          <li className="tag">Free · no account</li>
        </ul>
      </EditorialHero>

      <EditorialBody
        toc={TOC}
        aside={
          <Link href={e.routes.search} className={buttonClass("primary", "md")}>
            Try a search
            <ArrowRightIcon className="size-4" />
          </Link>
        }
      >
        <EditorialSection id="how-it-works" n={1} title="How it works" wide>
          <ol className="grid gap-3 md:grid-cols-3 md:gap-4">
            {steps.map((s, i) => (
              <li key={s.title} className="panel flex flex-col p-6 md:min-h-[260px] md:p-7">
                <span aria-hidden="true" className="numeral text-text-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-8 block md:mt-auto">
                  <span className="text-h3 block">{s.title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-text-2 md:text-[15px]">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </EditorialSection>

        <EditorialSection id="how-we-verify" headingId="verify-h" n={2} title="How we verify" lead="Where the facts come from, what we refuse to do, and what happens when something changes." wide>
          <dl className="border-b border-hairline">
            <Row title="Where our data comes from">
              Titles, posters and descriptions: TMDB. Availability, prices and languages: the services&apos; own catalogs via our data partner, checked
              daily. Every page shows when it was last checked.
            </Row>
            <Row title="What we never do" emphasis>
              We don&apos;t host or stream video. We don&apos;t link to pirate sites. If a service doesn&apos;t confirm a language, we don&apos;t show it —
              you&apos;ll see “Not confirmed by the service” instead of a guess.
            </Row>
            <Row title="How sofo makes money">
              Today: it doesn&apos;t. Later, some links may become affiliate links — they will never change the order or what we show.
            </Row>
            <Row title="When something looks wrong">
              Every title page has a “Something wrong?” link. Reports go to a queue that we re-check within 24 hours.
            </Row>
            <Row title="Changes over time">
              Each time a title arrives, leaves, changes price or gets a new dub, we record it. That&apos;s the history you see on title pages and what
              powers your alerts.
            </Row>
          </dl>
        </EditorialSection>

        <EditorialSection id="services" headingId="svc-h" n={3} title={<>For streaming services &amp; studios</>} wide>
          <div className="panel grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:p-10">
            <p className="max-w-[46ch] text-lg leading-snug tracking-[-0.01em] md:text-[22px] md:leading-[1.35]">
              Spot a wrong price or language? Want your catalog listed correctly — including dubs and subtitles?
            </p>
            <a href={`mailto:${PARTNERS}`} className={`${buttonClass("primary", "lg")} max-sm:w-full`}>
              {PARTNERS}
              <ArrowUpRightIcon className="size-[18px]" />
            </a>
          </div>
        </EditorialSection>

        <EditorialSection id="contact" headingId="contact-h" n={4} title={<>Contact &amp; legal</>}>
          <div className="prose-sofo">
            <p>
              Questions, press or a content removal request: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
            </p>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            <li>
              <ChipLink href={`${e.routes.privacy}#terms`}>Terms</ChipLink>
            </li>
            <li>
              <ChipLink href={e.routes.privacy}>Privacy (KVKK)</ChipLink>
            </li>
            <li>
              <ChipLink href={`${e.routes.privacy}#cookies`}>Cookies</ChipLink>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT}?subject=Content%20removal%20request`}
                className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap text-text-2 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset hover:bg-text/6 hover:text-text hover:ring-text/30"
              >
                <MailIcon className="size-3.5" />
                Content removal
              </a>
            </li>
          </ul>
        </EditorialSection>
      </EditorialBody>
    </>
  );
}

/** One fact: heading on the left, copy on the right, a thin rule above. */
function Row({ title, children, emphasis }: { title: string; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="grid gap-x-10 gap-y-2 border-t border-hairline py-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:py-8">
      <dt className="text-h3 flex items-baseline gap-2.5">
        {emphasis ? <span aria-hidden="true" className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-leaving" /> : null}
        {title}
      </dt>
      <dd className={`max-w-[62ch] text-[15px] leading-[1.7] md:text-base ${emphasis ? "text-text" : "text-text-2"}`}>{children}</dd>
    </div>
  );
}
