import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, catalogMetadata } from "@/components/catalog/catalog-page";
import { getEdition } from "@/lib/editions";

export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/diziler">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  if (!e) return {};
  return catalogMetadata(e, "series", e.routes.series, await searchParams);
}

export default async function SeriesPage({ params, searchParams }: PageProps<"/[lang]/diziler">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  return <CatalogPage edition={e} kind="series" base={e.routes.series} searchParams={await searchParams} />;
}
