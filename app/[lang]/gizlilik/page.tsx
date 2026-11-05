import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookieSettingsButton } from "@/components/retention/cookie-settings-button";
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

  return (
    <div className="mx-auto max-w-site px-4 pt-6 pb-6 md:px-7 md:pt-10">
      <p lang="en" className="text-xs font-extrabold tracking-[0.12em] text-orange uppercase">Legal</p>
      <h1 className="mt-2 text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[44px]">Privacy, cookies &amp; terms</h1>

      <div role="note" className="mt-5 max-w-3xl rounded-card border border-leaving/40 bg-leaving/10 p-4 text-sm text-leaving">
        <strong>Draft — pending legal review (KVKK).</strong> This text describes how sofo works today. It is not yet the final legal
        notice (aydınlatma metni) and may change before launch.
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 grid gap-2 text-sm">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-text-2">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl space-y-10 text-[15px] leading-relaxed text-text-2 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc [&_section]:scroll-mt-24 [&_strong]:text-text">
          <section id="summary">
            <h2>In short</h2>
            <ul className="space-y-1.5">
              <li>No account and no password are needed. My list, your services and preferences stay on your device.</li>
              <li>Analytics cookies are off until you say yes. Essential storage only remembers your choices.</li>
              <li>If you turn on alerts we store only your email or Telegram chat id and which titles you follow.</li>
              <li>We never sell personal data and we don&apos;t show ads.</li>
            </ul>
          </section>

          <section id="data">
            <h2>What we store</h2>
            <p>
              <strong>On your device (localStorage, essential):</strong> edition and interface language, onboarding answers (audio
              preference, your services), My list with alert choices, your cookie choice, and — if you connected Telegram from this browser
              — a signed reference to that subscription.
            </p>
            <p className="mt-3">
              <strong>On our servers:</strong> only for alerts (see below). Search statistics are aggregated and contain no personal data.
              Server logs (IP address, user agent) are kept by our host for security for a short period.
            </p>
          </section>

          <section id="cookies">
            <h2>Cookies &amp; analytics</h2>
            <p>
              Non-essential cookies are <strong>rejected by default</strong>. If you choose “Accept analytics”, we load Google Analytics 4
              with IP anonymisation and without advertising signals, to learn which pages help people (page views, searches, clicks to
              services). You can change your mind at any time.
            </p>
            <CookieSettingsButton className="mt-4" />
          </section>

          <section id="alerts">
            <h2>Alerts (Telegram &amp; email)</h2>
            <ul className="space-y-1.5">
              <li>
                <strong>Telegram</strong> (main channel): after you press Start in our bot we store your Telegram chat id. Your @username is
                not stored. Max 3 messages a day; send /stop to unsubscribe.
              </li>
              <li>
                <strong>Email</strong>: your address and a weekly digest on Fridays at 18:00 (Türkiye time). We will ask you to confirm the
                address before sending anything.
              </li>
              <li>Every message has a link to change alerts or unsubscribe. Deleting your alerts deletes the data behind them.</li>
            </ul>
          </section>

          <section id="processors">
            <h2>Who processes data</h2>
            <p>
              Hosting (Vercel), database (Supabase or Neon), Google Analytics (only with consent), Telegram (only if you use the bot) and
              an email provider (only for confirmed digests). Some of these process data outside Türkiye; the final notice will list
              transfer safeguards.
            </p>
          </section>

          <section id="rights">
            <h2>Your rights (KVKK art. 11)</h2>
            <p>
              You can ask what we hold about you, have it corrected or deleted, and object to processing. Write to{" "}
              <a href={`mailto:${CONTACT}`} className="font-bold text-text">
                {CONTACT}
              </a>
              . We answer within 30 days.
            </p>
          </section>

          <section id="terms">
            <h2>Terms of use</h2>
            <ul className="space-y-1.5">
              <li>sofo is a free guide. We don&apos;t host, stream or sell video; titles play on the official services.</li>
              <li>We only link to legal services. Prices, availability and languages come from the services and may change — always check the service before you pay.</li>
              <li>
                Language information is shown only when the service confirms it. If something is wrong, use “Something wrong?” on the title
                page.
              </li>
              <li>Titles, posters and descriptions: TMDB. Trademarks belong to their owners.</li>
              <li>
                Questions: see <Link href={`${e.routes.about}#contact`}>Contact</Link>.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
