import { OutboundLink } from "@/components/outbound-link";
import { buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import type { Edition } from "@/lib/editions";
import { formatDate, formatPrice } from "@/lib/format";
import { langName } from "@/lib/lang";
import type { TitlePageData } from "@/lib/queries/title";
import { AlertButton } from "./alert-button";
import { ReportButton } from "./report-button";

/** V2 short answer — deterministic sentence + cheapest way + dub services + "not on". */
export function ShortAnswerBlock({ data, edition }: { data: TitlePageData; edition: Edition }) {
  const { shortAnswer: a, local, offers, title } = data;
  const lang = edition.contentLang;
  const langLabel = langName(lang);
  const where = edition.countryName;
  const name = <span className="text-orange">{local.name}</span>;

  const yes = a.kind !== "none" && a.kind !== "rent_only";
  const sentence = (() => {
    switch (a.kind) {
      case "yes_audio": {
        const withSubs = offers.some((o) => o.service.slug === a.offer.serviceSlug && o.subtitle[lang] === "confirmed_yes");
        const how = a.offer.type === "subscription" ? "streaming" : "free to watch";
        return <>Yes — {name} is {how} on {a.offer.serviceName} in {where}, with {langLabel} dub{withSubs ? " and subtitles" : ""}.</>;
      }
      case "yes_subtitle":
        return <>Yes, but only with {langLabel} subtitles — {name} is on {a.offer.serviceName} in {where}.</>;
      case "yes_unconfirmed":
        return <>Yes — {name} is on {a.offer.serviceName} in {where}. {langLabel} audio is not confirmed by the service.</>;
      case "rent_only":
        return <>Not on subscription in {where} — rent or buy {name} from {formatPrice(a.offer.price, a.offer.currency)} on {a.offer.serviceName}.</>;
      case "none":
        return <>{name} isn&apos;t legally available in {where} right now.</>;
    }
  })();

  const included = offers.filter((o) => o.type === "subscription" || o.type === "free" || o.type === "ads");
  const paid = offers.filter((o) => o.type === "rent" || o.type === "buy").sort((x, y) => (x.price ?? 0) - (y.price ?? 0))[0];
  const cheapest =
    included[0]?.type === "free" || included[0]?.type === "ads"
      ? { main: `Free with ads on ${included[0].service.name}`, sub: null }
      : included[0]
        ? { main: `Included in ${included[0].service.name}`, sub: paid ? `or rent from ${formatPrice(paid.price, paid.currency)} on ${paid.service.name}` : null }
        : paid
          ? { main: `${paid.type === "rent" ? "Rent" : "Buy"} from ${formatPrice(paid.price, paid.currency)}`, sub: `on ${paid.service.name}` }
          : { main: "No legal option", sub: "We’ll tell you when it arrives" };

  const dubOn = [...new Set(offers.filter((o) => o.audio[lang] === "confirmed_yes").map((o) => o.service.name))];
  const subOnly = [...new Set(offers.filter((o) => o.audio[lang] !== "confirmed_yes" && o.subtitle[lang] === "confirmed_yes").map((o) => o.service.name))];
  const unconfirmed = offers.some((o) => !o.audio[lang] || o.audio[lang] === "unknown");
  const notOn = data.notOn.slice(0, 3);
  const left = data.notOn.find((s) => s.leftAt);

  return (
    <section
      aria-labelledby="short-answer"
      className={`relative overflow-hidden rounded-hero border p-5 md:p-7 ${yes ? "border-orange/35 bg-gradient-to-br from-orange-deep via-surface to-surface" : "border-line bg-surface"}`}
    >
      <p lang="en" id="short-answer" className="text-xs font-extrabold tracking-[0.12em] text-orange uppercase">
        The short answer
      </p>
      <p className="mt-3 flex gap-3 text-[21px] leading-snug font-extrabold tracking-[-0.02em] md:text-[30px]">
        <span aria-hidden="true" className={`mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm md:mt-1.5 ${yes ? "bg-available text-ink" : "bg-surface-2 text-text-2"}`}>
          {yes ? "✓" : "–"}
        </span>
        <span>{sentence}</span>
      </p>

      <dl className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <Fact label="Cheapest way" main={cheapest.main} sub={cheapest.sub} />
        <Fact
          label={`${langLabel} dub`}
          main={dubOn.length ? dubOn.join(" · ") : unconfirmed ? "Not confirmed by the service" : "Not available"}
          sub={subOnly.length ? `${subOnly.join(", ")}: subtitles only` : null}
        />
        <Fact
          label="Not on"
          main={notOn.length ? notOn.map((s) => s.name).join(", ") + (data.notOn.length > 3 ? ` +${data.notOn.length - 3}` : "") : "On every major service"}
          sub={left?.leftAt ? `left ${left.name} ${formatDate(left.leftAt)}` : null}
        />
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {a.kind !== "none" ? (
          <OutboundLink
            href={a.offer.url}
            service={a.offer.serviceSlug}
            title={local.name}
            country={edition.country}
            lang={a.kind === "yes_audio" ? lang : undefined}
            offerType={a.offer.type}
            className={`${buttonClass("primary")} max-sm:w-full`}
          >
            Watch on {a.offer.serviceName} ↗
          </OutboundLink>
        ) : null}
        <AlertButton
          title={{ id: title.id, type: title.type, slug: local.slug, name: local.name, posterPath: title.posterPath, year: title.year }}
          kinds={a.kind === "none" ? ["dub_available", "on_my_services"] : dubOn.length ? ["leaving", "price_drop"] : ["dub_available", "leaving"]}
          label={a.kind === "none" ? "Notify me when it's available" : dubOn.length ? `Alert me if it leaves` : `Alert me when ${langLabel} dub arrives`}
        />
        <div className="flex flex-col items-start gap-0.5 text-xs text-text-3 sm:ml-auto sm:items-end">
          {data.checkedAt ? <CheckedAt at={data.checkedAt} source={`${edition.countryName} catalogue`} /> : null}
          <ReportButton titleId={title.id} titleName={local.name} offers={offers.map((o) => ({ id: o.id, label: `${o.service.name} · ${o.type}` }))} />
        </div>
      </div>
    </section>
  );
}

function Fact({ label, main, sub }: { label: string; main: string; sub: string | null }) {
  return (
    <div className="rounded-card bg-ink/55 p-3.5">
      <dt lang="en" className="text-[11px] font-extrabold tracking-[0.08em] text-text-3 uppercase">{label}</dt>
      <dd className="mt-1 text-[15px] font-extrabold">{main}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-text-2">{sub}</dd> : null}
    </div>
  );
}
