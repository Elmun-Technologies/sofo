import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, catalogMetadata } from "@/components/catalog/catalog-page";
import { getEdition } from "@/lib/editions";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/filmler">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  if (!e) return {};
  return catalogMetadata(e, "movies", e.routes.movies, await searchParams);
}

export default async function MoviesPage({ params, searchParams }: PageProps<"/[lang]/filmler">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  return <CatalogPage edition={e} kind="movies" base={e.routes.movies} searchParams={await searchParams} />;
}
