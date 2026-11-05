import Link from "next/link";
import { EDITIONS, PLANNED_EDITIONS, paths, type Edition } from "@/lib/editions";
import { Logo } from "./logo";

const SERVICE_NAMES: Record<string, string> = {
  netflix: "Netflix", "prime-video": "Prime Video", "disney-plus": "Disney+", "hbo-max": "HBO Max",
  tod: "TOD", tabii: "tabii", exxen: "Exxen", gain: "Gain",
};

export function SiteFooter({ edition }: { edition: Edition }) {
  const r = edition.routes;
  return (
    <footer className="mt-10 border-t border-line-soft">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-10 text-sm md:grid-cols-[1fr_auto] md:px-7">
        <div className="max-w-xs">
          <Logo className="text-[24px]" />
          <p className="mt-3 text-text-2">
            Find where to watch any movie or series — in your language. sofo doesn&apos;t host video: every title plays on the
            official service.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
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
            <Link href={r.dubHub}>Türkçe dublaj</Link>
            <Link href={r.subHub}>Türkçe altyazı</Link>
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
        </div>
      </div>
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-x-6 gap-y-2 border-t border-line-soft px-4 py-5 text-xs text-text-3 md:px-7">
        <span>
          Editions:{" "}
          {Object.values(EDITIONS).map((e) => (
            <Link key={e.code} href={e.routes.home} className="text-text-2">
              {e.countryName}
            </Link>
          ))}
          {PLANNED_EDITIONS.map((n) => ` · ${n}`)}
        </span>
        <span className="md:ml-auto">sofo.tv · We never host video · Metadata &amp; images: TMDB · availability checked daily</span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 [&_a]:text-text-2 [&_a:hover]:text-orange-tint">
      <span className="font-extrabold text-text">{heading}</span>
      {children}
    </div>
  );
}
