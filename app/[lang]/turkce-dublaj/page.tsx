import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangHub, langHubMetadata } from "@/components/catalog/lang-hub";
import { getEdition } from "@/lib/editions";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/turkce-dublaj">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  return e ? langHubMetadata(e, "dub") : {};
}

export default async function DubHubPage({ params }: PageProps<"/[lang]/turkce-dublaj">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  return <LangHub edition={e} kind="dub" />;
}
