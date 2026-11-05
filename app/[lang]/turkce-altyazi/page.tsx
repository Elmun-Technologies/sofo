import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangHub, langHubMetadata } from "@/components/catalog/lang-hub";
import { getEdition } from "@/lib/editions";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/turkce-altyazi">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  return e ? langHubMetadata(e, "sub") : {};
}

export default async function SubHubPage({ params }: PageProps<"/[lang]/turkce-altyazi">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  return <LangHub edition={e} kind="sub" />;
}
