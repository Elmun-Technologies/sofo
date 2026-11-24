import { BellIcon } from "@/components/icons";
import { SubscribeForm } from "@/components/retention/subscribe-form";

/** "Never miss a dub." — weekly digest / Telegram signup. */
export function SubscribeSection({ langName }: { langName: string }) {
  return (
    <section className="wrap section-y">
      <div className="panel relative grid gap-6 overflow-hidden p-6 md:grid-cols-[1fr_minmax(0,440px)] md:items-center md:gap-12 md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-orange/20 blur-[90px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-dub/15 blur-[90px]" />
        <div className="relative">
          <span className="inline-flex size-11 items-center justify-center rounded-button bg-orange/15 text-orange ring-1 ring-orange/30 ring-inset">
            <BellIcon className="size-5" />
          </span>
          <h2 className="mt-4 text-[26px] leading-tight font-extrabold tracking-[-0.03em] md:text-[34px]">Never miss a dub.</h2>
          <p className="mt-2 max-w-md text-[15px] text-text-2">
            A weekly list of new {langName} dubs and what&apos;s leaving your services — by email or Telegram.
          </p>
        </div>
        <div className="relative">
          <SubscribeForm variant="inline" />
        </div>
      </div>
    </section>
  );
}
