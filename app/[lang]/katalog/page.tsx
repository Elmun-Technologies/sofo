import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarIcon,
  CaptionsIcon,
  ClockIcon,
  FilmIcon,
  GridIcon,
  HeartIcon,
  PlayIcon,
  SparkleIcon,
  TvIcon,
  VolumeIcon,
} from "@/components/icons";
import { PosterImage } from "@/components/ui/poster-image";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceLogo } from "@/components/ui/service-logo";
import { getServices } from "@/lib/catalog";
import { getEdition, paths } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import { getMegaMenu, type MenuGenre } from "@/lib/queries/mega-menu";

export const revalidate = 3600;

/**
 * Category index — the mobile counterpart of the header's Catalogue mega-menu (santehnika's mobile
 * "Каталог" page). Pure navigation, so it stays out of the index and the sitemap.
 */
export async function generateMetadata({ params }: PageProps<"/[lang]/katalog">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  if (!e) return {};
  return { title: "Catalogue", robots: { index: false, follow: true }, alternates: { canonical: e.routes.catalog } };
}

export default async function CatalogIndexPage({ params }: PageProps<"/[lang]/katalog">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  const r = e.routes;
  const [menu, services] = await Promise.all([getMegaMenu(e), getServices(e)]);
  const cap = (s: string) => s.replace(/^./, (c) => c.toLocaleUpperCase(e.hreflang));

  const sections: { href: string; label: string; icon: React.ReactNode; count?: number; local?: boolean }[] = [
    { href: r.movies, label: "Movies", icon: <FilmIcon className="size-5" />, count: menu.total.movie },
    { href: r.series, label: "Series", icon: <TvIcon className="size-5" />, count: menu.total.tv },
    { href: r.anime, label: "Anime", icon: <SparkleIcon className="size-5" /> },
    { href: r.kids, label: "Kids", icon: <HeartIcon className="size-5" /> },
    { href: r.dubHub, label: cap(dubTerm(e.contentLang)), icon: <VolumeIcon className="size-5 text-dub" />, local: true },
    { href: r.subHub, label: cap(subTerm(e.contentLang)), icon: <CaptionsIcon className="size-5" />, local: true },
    { href: r.newLeaving, label: "New & leaving", icon: <ClockIcon className="size-5 text-red-500" /> },
    { href: r.releases, label: "Coming to digital", icon: <CalendarIcon className="size-5" /> },
    { href: r.trailers, label: "Trailers", icon: <PlayIcon className="size-5" /> },
    { href: r.collections, label: "Collections", icon: <GridIcon className="size-5" /> },
  ];

  return (
    <div className="wrap pt-5 pb-14 md:pt-10 md:pb-24">
      <h1 className="text-h1">Catalogue</h1>

      <ul className="mt-5 divide-y divide-hairline overflow-hidden rounded-panel bg-surface">
        {sections.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="flex h-14 items-center gap-3 px-4 text-[15px] font-semibold hover:bg-surface-2 hover:text-text">
              <span className="text-text-2">{s.icon}</span>
              <span lang={s.local ? e.hreflang : undefined} className="min-w-0 flex-1 truncate">
                {s.label}
              </span>
              <ArrowRightIcon className="size-4 text-text-3" />
            </Link>
          </li>
        ))}
      </ul>

      <GenreGrid title="Movie genres" base={r.movies} genres={menu.movie} />
      <GenreGrid title="Series genres" base={r.series} genres={menu.tv} />

      <section className="mt-10">
        <SectionHeader title="Platforms" />
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={paths.service(e, s.slug)} className="flex items-center gap-3 rounded-card bg-surface p-3 text-sm font-semibold hover:bg-surface-2 hover:text-text">
                <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={32} />
                <span className="truncate">{s.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GenreGrid({ title, base, genres }: { title: string; base: string; genres: MenuGenre[] }) {
  if (!genres.length) return null;
  return (
    <section className="mt-10">
      <SectionHeader title={title} href={base} />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {genres.slice(0, 10).map((g) => (
          <li key={g.slug}>
            <Link href={`${base}?genre=${g.slug}`} className="flex h-[66px] items-center gap-2.5 rounded-card bg-surface py-2 pr-3 pl-2 hover:bg-surface-2 hover:text-text">
              <span className="w-[34px] shrink-0">
                <PosterImage path={g.posterPath} alt="" sizes="34px" className="rounded-[6px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] leading-tight font-bold">{g.name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
