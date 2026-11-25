import Link from "next/link";
import { EDITIONS, PLANNED_EDITIONS, paths, type Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import { ShieldCheckIcon } from "./icons";
import { Logo } from "./logo";

const SERVICE_NAMES: Record<string, string> = {
  netflix: "Netflix", "prime-video": "Prime Video", "disney-plus": "Disney+", "hbo-max": "HBO Max",
  crunchyroll: "Crunchyroll", tod: "TOD", tabii: "tabii", exxen: "Exxen", gain: "Gain",
};

const cap = (s: string, locale: string) => s.replace(/^./, (c) => c.toLocaleUpperCase(locale));

export function SiteFooter({ edition }: { edition: Edition }) {
  const r = edition.routes;
  return (
    <footer className="mt-16 border-t border-hairline bg-ink-2 md:mt-24">
      <div className="wrap grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="max-w-sm">
          <Link href={r.home} aria-label="sofo — home" className="inline-block hover:text-text">
            <Logo className="text-[28px]" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-text-2">
            Find where to watch any movie or series — in your language. sofo doesn&apos;t host video: every title plays on the
            official service.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-chip bg-text/5 py-1.5 pr-3.5 pl-2.5 text-xs font-bold text-text-2 ring-1 ring-hairline ring-inset">
            <ShieldCheckIcon className="size-4 text-available" />
            Legal services only · checked daily
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-10 text-sm sm:grid-cols-4 lg:gap-x-16">
          <FooterCol heading="Browse">
            <Link href={r.movies}>Movies</Link>
            <Link href={r.series}>Series</Link>
            <Link href={r.anime}>Anime</Link>
            <Link href={r.kids}>Kids</Link>
            <Link href={r.newLeaving}>New &amp; leaving</Link>
            <Link href={r.trailers}>Trailers</Link>
            <Link href={r.releases}>Coming to digital</Link>
          </FooterCol>
          <FooterCol heading="Languages">
            <Link href={r.dubHub} lang={edition.hreflang}>{cap(dubTerm(edition.contentLang), edition.hreflang)}</Link>
            <Link href={r.subHub} lang={edition.hreflang}>{cap(subTerm(edition.contentLang), edition.hreflang)}</Link>
            <Link href={r.collections}>Collections</Link>
          </FooterCol>
          <FooterCol heading="Services">
            {edition.coreServices.map((s) => (
              <Link key={s} href={paths.service(edition, s)}>
                {SERVICE_NAMES[s] ?? s}
              </Link>
            ))}
          </FooterCol>
          <FooterCol heading="sofo">
            <Link href={`${r.about}#how-we-verify`}>How it works</Link>
            <Link href={r.about}>About</Link>
            <Link href={`${r.about}#services`}>For streaming services</Link>
            <Link href={`${r.about}#contact`}>Contact</Link>
            <Link href={r.privacy}>Privacy</Link>
            <Link href={`${r.privacy}#terms`}>Terms</Link>
          </FooterCol>
        </nav>
      </div>
      <div className="border-t border-hairline">
        <div className="wrap flex flex-col gap-4 py-6 text-xs text-text-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span lang="en" className="overline mr-1 text-text-3">
              Editions
            </span>
            {Object.values(EDITIONS).map((e) => (
              <Link key={e.code} href={e.routes.home} className="inline-flex h-7 items-center gap-1.5 rounded-chip bg-text/8 px-2.5 font-bold text-text hover:text-text">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
                {e.countryName}
              </Link>
            ))}
            {PLANNED_EDITIONS.map((n) => (
              <span key={n} title="Coming soon" className="inline-flex h-7 items-center rounded-chip px-2.5 ring-1 ring-hairline ring-inset">
                {n}
              </span>
            ))}
          </div>
          <p className="md:text-right">
            © {new Date().getFullYear()} sofo.tv · We never host video · Metadata &amp; images: TMDB
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5 [&_a]:text-text-2 [&_a:hover]:text-text">
      <span lang="en" className="overline mb-1.5 text-text-3">
        {heading}
      </span>
      {children}
    </div>
  );
}
