import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, catalogMetadata } from "@/components/catalog/catalog-page";
import { getEdition } from "@/lib/editions";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/anime">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  if (!e) return {};
  return catalogMetadata(e, "anime", e.routes.anime, await searchParams);
}

export default async function AnimePage({ params, searchParams }: PageProps<"/[lang]/anime">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  return <CatalogPage edition={e} kind="anime" base={e.routes.anime} searchParams={await searchParams} />;
}
