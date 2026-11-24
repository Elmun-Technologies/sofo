import { ArrowUpRightIcon, CheckIcon } from "@/components/icons";
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
export function ShortAnswerBlock({ data, edition, idPrefix }: { data: TitlePageData; edition: Edition; idPrefix?: string }) {
  const { shortAnswer: a, local, offers, title } = data;
  const lang = edition.contentLang;
  const langLabel = langName(lang);
  const where = edition.countryName;
  const name = <span className="text-white">{local.name}</span>;

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

  const dubOn = [...new Set(offers.filter((o) => o.audio[lang] === "confirmed_yes").map((o) => o.service.name))];

  return (
    <section aria-labelledby={idPrefix ? `${idPrefix}-heading` : "short-answer"}>
      <p lang="en" id={idPrefix ? `${idPrefix}-heading` : "short-answer"} className="overline flex items-center gap-2 text-text-3">
        <span aria-hidden="true" className={`inline-flex size-[18px] items-center justify-center rounded-full ring-1 ring-inset ${yes ? "text-available ring-available/60" : "text-text-2 ring-white/25"}`}>
          {yes ? <CheckIcon className="size-3 stroke-[3]" /> : <span className="h-0.5 w-2 rounded-full bg-current" />}
        </span>
        The short answer
      </p>
      <p className="mt-2.5 max-w-[34ch] text-[21px] leading-[1.3] font-extrabold tracking-[-0.02em] sm:max-w-none md:text-[26px]">{sentence}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5" id={idPrefix ? `${idPrefix}-cta` : undefined}>
        {a.kind !== "none" ? (
          <OutboundLink
            href={a.offer.url}
            service={a.offer.serviceSlug}
            title={local.name}
            country={edition.country}
            lang={a.kind === "yes_audio" ? lang : undefined}
            offerType={a.offer.type}
            className={`${buttonClass("accent", "lg")} max-sm:w-full`}
          >
            {a.offer.type === "rent" ? "Rent" : a.offer.type === "buy" ? "Buy" : "Watch"} on {a.offer.serviceName}
            <ArrowUpRightIcon className="size-[18px]" />
          </OutboundLink>
        ) : null}
        <AlertButton
          title={{ id: title.id, type: title.type, slug: local.slug, name: local.name, posterPath: title.posterPath, year: title.year }}
          kinds={a.kind === "none" ? ["dub_available", "on_my_services"] : dubOn.length ? ["leaving", "price_drop"] : ["dub_available", "leaving"]}
          label={a.kind === "none" ? "Notify me when it's available" : dubOn.length ? `Alert me if it leaves` : `Alert me when ${langLabel} dub arrives`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-3">
        {data.checkedAt ? (
          <>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
            <CheckedAt at={data.checkedAt} source={`${edition.countryName} catalogue`} className="!text-text-2" />
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        <ReportButton titleId={title.id} titleName={local.name} offers={offers.map((o) => ({ id: o.id, label: `${o.service.name} · ${o.type}` }))} />
      </div>
    </section>
  );
}

/** Three facts under the hero: cheapest way · dub services · where it is not. */
export function ShortAnswerFacts({ data, edition }: { data: TitlePageData; edition: Edition }) {
  const { offers } = data;
  const lang = edition.contentLang;
  const langLabel = langName(lang);
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
    <dl className="grid overflow-hidden rounded-panel border border-hairline bg-surface/80 backdrop-blur-xl sm:grid-cols-3 sm:divide-x sm:divide-hairline max-sm:divide-y max-sm:divide-hairline">
      <Fact label="Cheapest way" main={cheapest.main} sub={cheapest.sub} />
      <Fact
        label={`${langLabel} dub`}
        tone={dubOn.length ? "dub" : undefined}
        main={dubOn.length ? dubOn.join(" · ") : unconfirmed ? "Not confirmed by the service" : "Not available"}
        sub={subOnly.length ? `${subOnly.join(", ")}: subtitles only` : null}
      />
      <Fact
        label="Not on"
        main={notOn.length ? notOn.map((s) => s.name).join(", ") + (data.notOn.length > 3 ? ` +${data.notOn.length - 3}` : "") : "On every major service"}
        sub={left?.leftAt ? `left ${left.name} ${formatDate(left.leftAt)}` : null}
      />
    </dl>
  );
}

function Fact({ label, main, sub, tone }: { label: string; main: string; sub: string | null; tone?: "dub" }) {
  return (
    <div className="px-5 py-4">
      <dt lang="en" className="overline flex items-center gap-1.5 text-text-3">
        {tone === "dub" ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" /> : null}
        {label}
      </dt>
      <dd className="mt-1.5 text-[15px] leading-snug font-bold">{main}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-text-3">{sub}</dd> : null}
    </div>
  );
}
