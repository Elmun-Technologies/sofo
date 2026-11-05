import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-site px-4 py-24 text-center md:px-7">
      <p className="text-sm font-bold tracking-widest text-text-3 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-extrabold">This page isn&apos;t here</h1>
      <p className="mt-3 text-text-2">The title may have moved or never existed on sofo.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-button bg-orange px-5 font-extrabold text-ink hover:bg-orange-hover hover:text-ink"
      >
        Back to sofo
      </Link>
    </section>
  );
}
