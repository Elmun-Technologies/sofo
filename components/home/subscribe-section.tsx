import { BellIcon } from "@/components/icons";
import { SubscribeForm } from "@/components/retention/subscribe-form";

/** "Never miss a dub." — weekly digest / Telegram signup. */
export function SubscribeSection({ langName }: { langName: string }) {
  return (
    <section className="wrap section-y">
      <div className="panel grid gap-8 p-6 md:grid-cols-[1fr_minmax(0,460px)] md:items-end md:gap-14 md:p-12">
        <div>
          <span className="tag">
            <BellIcon className="size-3.5" />
            Alerts
          </span>
          <h2 className="text-h1 mt-5">Never miss a dub.</h2>
          <p className="mt-3 max-w-md text-[15px] text-text-2">
            A weekly list of new {langName} dubs and what&apos;s leaving your services — by email or Telegram.
          </p>
        </div>
        <div>
          <SubscribeForm variant="inline" />
        </div>
      </div>
    </section>
  );
}
