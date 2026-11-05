import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServices } from "@/lib/catalog";
import { getEdition } from "@/lib/editions";
import { MyListClient } from "./my-list-client";

export const metadata: Metadata = {
  title: "My list",
  robots: { index: false, follow: true },
};

export default async function MyListPage({ params }: PageProps<"/[lang]/listem">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const services = await getServices(edition);
  return (
    <MyListClient
      edition={{ code: edition.code, country: edition.country, countryName: edition.countryName, contentLang: edition.contentLang, coreServices: edition.coreServices, routes: edition.routes }}
      services={services.map((s) => ({ slug: s.slug, name: s.name, logoPath: s.logoPath }))}
    />
  );
}
