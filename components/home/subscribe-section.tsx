import { SubscribeForm } from "@/components/retention/subscribe-form";

/** "Never miss a dub." — weekly digest / Telegram signup. */
export function SubscribeSection({ langName }: { langName: string }) {
  return (
    <section className="mx-auto max-w-site px-4 py-5 md:px-7">
      <div className="flex flex-col gap-4 rounded-panel border border-orange/25 bg-gradient-to-r from-orange-deep to-surface p-5 md:flex-row md:items-center md:gap-8 md:p-7">
        <div className="md:flex-1">
          <h2 className="text-xl font-extrabold md:text-2xl">Never miss a dub.</h2>
          <p className="mt-1 text-sm text-text-2">Get a weekly list of new {langName} dubs and what&apos;s leaving your services — by email or Telegram.</p>
        </div>
        <div className="md:w-[420px]">
          <SubscribeForm variant="inline" />
        </div>
      </div>
    </section>
  );
}
