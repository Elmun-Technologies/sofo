import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, InfoIcon } from "@/components/icons";
import { CookieSettingsButton } from "@/components/retention/cookie-settings-button";
import { EditorialBody, EditorialHero, EditorialSection } from "@/components/static/editorial";
import { getEdition } from "@/lib/editions";
import { buildAlternates } from "@/lib/seo/hreflang";

const CONTACT = "privacy@sofo.tv";

export async function generateMetadata({ params }: PageProps<"/[lang]/gizlilik">): Promise<Metadata> {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) return {};
  return {
    title: "Privacy, cookies & terms",
    // Draft legal text — keep out of the index until legal review (KVKK) is done.
    robots: { index: false, follow: true },
    alternates: buildAlternates(e.routes.privacy, { [e.hreflang]: e.routes.privacy }),
  };
}

const TOC = [
  ["summary", "In short"],
  ["data", "What we store"],
  ["cookies", "Cookies & analytics"],
  ["alerts", "Alerts (Telegram & email)"],
  ["processors", "Who processes data"],
  ["rights", "Your rights (KVKK)"],
  ["terms", "Terms of use"],
] as const;

export default async function PrivacyPage({ params }: PageProps<"/[lang]/gizlilik">) {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) notFound();

  const SUMMARY = [
    "No account and no password are needed. My list, your services and preferences stay on your device.",
    "Analytics cookies are off until you say yes. Essential storage only remembers your choices.",
    "If you turn on alerts we store only your email or Telegram chat id and which titles you follow.",
    "We never sell personal data and we don't show ads.",
  ];

  return (
    <>
      <EditorialHero eyebrow="Legal" title={<>Privacy, cookies &amp; terms</>} intro="What sofo stores, why, and the rules for using the guide — in plain language.">
        <div role="note" className="mt-8 flex max-w-3xl items-start gap-3 rounded-card border border-leaving/35 px-4 py-3.5 text-sm text-leaving md:mt-12 md:px-5 md:py-4">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="font-semibold">Draft — pending legal review (KVKK).</strong> This text describes how sofo works today. It is not yet the final legal
            notice (aydınlatma metni) and may change before launch.
          </p>
        </div>
      </EditorialHero>

      <EditorialBody toc={TOC.map(([id, label]) => ({ id, label }))}>
        <EditorialSection id="summary" n={1} title="In short" wide>
          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4">
            {SUMMARY.map((t) => (
              <li key={t} className="panel flex gap-3.5 p-5 text-[15px] leading-relaxed text-text-2 md:p-6">
                <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-text/8 text-text">
                  <CheckIcon className="size-3 stroke-[3]" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </EditorialSection>

        <EditorialSection id="data" n={2} title="What we store">
          <div className="prose-sofo">
            <p>
              <strong>On your device (localStorage, essential):</strong> edition and interface language, onboarding answers (audio preference, your
              services), My list with alert choices, your cookie choice, and — if you connected Telegram from this browser — a signed reference to that
              subscription.
            </p>
            <p>
              <strong>On our servers:</strong> only for alerts (see below). Search statistics are aggregated and contain no personal data. Server logs (IP
              address, user agent) are kept by our host for security for a short period.
            </p>
          </div>
        </EditorialSection>

        <EditorialSection id="cookies" n={3} title={<>Cookies &amp; analytics</>}>
          <div className="prose-sofo">
            <p>
              Non-essential cookies are <strong>rejected by default</strong>. If you choose “Accept analytics”, we load Google Analytics 4 with IP
              anonymisation and without advertising signals, to learn which pages help people (page views, searches, clicks to services). You can change
              your mind at any time.
            </p>
          </div>
          <CookieSettingsButton className="mt-5" />
        </EditorialSection>

        <EditorialSection id="alerts" n={4} title={<>Alerts (Telegram &amp; email)</>}>
          <div className="prose-sofo">
            <ul>
              <li>
                <strong>Telegram</strong> (main channel): after you press Start in our bot we store your Telegram chat id. Your @username is not stored. Max
                3 messages a day; send /stop to unsubscribe.
              </li>
              <li>
                <strong>Email</strong>: your address and a weekly digest on Fridays at 18:00 (Türkiye time). We will ask you to confirm the address before
                sending anything.
              </li>
              <li>Every message has a link to change alerts or unsubscribe. Deleting your alerts deletes the data behind them.</li>
            </ul>
          </div>
        </EditorialSection>

        <EditorialSection id="processors" n={5} title="Who processes data">
          <div className="prose-sofo">
            <p>
              Hosting (Vercel), database (Supabase or Neon), Google Analytics (only with consent), Telegram (only if you use the bot) and an email provider
              (only for confirmed digests). Some of these process data outside Türkiye; the final notice will list transfer safeguards.
            </p>
          </div>
        </EditorialSection>

        <EditorialSection id="rights" n={6} title="Your rights (KVKK art. 11)">
          <div className="prose-sofo">
            <p>
              You can ask what we hold about you, have it corrected or deleted, and object to processing. Write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
              . We answer within 30 days.
            </p>
          </div>
        </EditorialSection>

        <EditorialSection id="terms" n={7} title="Terms of use">
          <div className="prose-sofo">
            <ul>
              <li>sofo is a free guide. We don&apos;t host, stream or sell video; titles play on the official services.</li>
              <li>
                We only link to legal services. Prices, availability and languages come from the services and may change — always check the service before
                you pay.
              </li>
              <li>Language information is shown only when the service confirms it. If something is wrong, use “Something wrong?” on the title page.</li>
              <li>Titles, posters and descriptions: TMDB. Trademarks belong to their owners.</li>
              <li>
                Questions: see <Link href={`${e.routes.about}#contact`}>Contact</Link>.
              </li>
            </ul>
          </div>
        </EditorialSection>
      </EditorialBody>
    </>
  );
}
