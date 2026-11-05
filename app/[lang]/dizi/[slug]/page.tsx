import { TitlePage, titleMetadata } from "@/components/title/title-page";

export const revalidate = 3600;

// Rendered on first request, then cached (ISR) — no build-time list of titles.
export function generateStaticParams() {
  return [];
}

export function generateMetadata({ params }: PageProps<"/[lang]/dizi/[slug]">) {
  return titleMetadata(params, "tv");
}

export default function Page({ params }: PageProps<"/[lang]/dizi/[slug]">) {
  return <TitlePage params={params} type="tv" />;
}
