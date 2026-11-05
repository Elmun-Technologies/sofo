import Link from "next/link";
import { EDITIONS, PLANNED_EDITIONS, type Edition } from "@/lib/editions";

export function SiteFooter({ edition }: { edition: Edition }) {
  const r = edition.routes;
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto flex max-w-site flex-wrap gap-x-16 gap-y-7 px-4 py-8 text-sm text-text-2 md:px-7">
        <FooterCol heading="sofo">
          <Link href={r.about}>How we verify</Link>
          <Link href={r.about}>For streaming services</Link>
          <Link href={r.about}>Contact</Link>
        </FooterCol>
        <FooterCol heading="Browse">
          <Link href={r.newLeaving}>New dubs</Link>
          <Link href={r.newLeaving}>Leaving soon</Link>
          <Link href={r.catalog}>Free with ads</Link>
        </FooterCol>
        <FooterCol heading="Editions">
          <span className="flex max-w-[380px] flex-wrap gap-x-3.5 gap-y-1.5">
            {Object.values(EDITIONS).map((e) => (
              <Link key={e.code} href={e.routes.home}>
                {e.countryName}
              </Link>
            ))}
            {PLANNED_EDITIONS.map((name) => (
              <span key={name} className="text-text-3" title="Coming soon">
                {name}
              </span>
            ))}
          </span>
        </FooterCol>
        <span className="grow self-end md:text-right">We never host video. Data &amp; images: TMDB.</span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 [&_a]:text-text-2">
      <span className="font-extrabold text-text">{heading}</span>
      {children}
    </div>
  );
}
