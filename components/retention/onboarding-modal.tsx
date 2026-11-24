"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { track } from "@/lib/client/analytics";
import { usePrefs, type Prefs } from "@/lib/client/prefs";
import type { Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import { CheckIcon, ChevronRightIcon, GlobeIcon } from "../icons";
import { buttonClass } from "../ui/button";
import { ServiceLogo } from "../ui/service-logo";
import { Dialog, useHydrated } from "./dialog";
import { serviceOptions, type ServiceOption } from "./service-names";

type Props = {
  edition: Pick<Edition, "code" | "countryName" | "contentLang" | "coreServices">;
  /** Service rows with logos (optional; falls back to wordmark tiles) */
  services?: ServiceOption[];
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * First-visit onboarding (PRD 7.4, boards Onboarding / MOnboarding): edition + UI language → audio
 * preference → my services. "Skip" on every step; shown once per browser on edition pages.
 */
export function OnboardingModal({ edition, services }: Props) {
  const hydrated = useHydrated();
  const [prefs, setPrefs] = usePrefs();
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);
  const [audio, setAudio] = useState<Prefs["audio"] | null>(null);
  const [picked, setPicked] = useState<string[] | null>(null);
  const id = useId();

  if (!hydrated || prefs.onboarded || closed) return null;

  const chosenAudio = audio ?? prefs.audio;
  const chosenServices = picked ?? prefs.services;
  const finish = (how: "done" | "skip") => {
    setPrefs((p) => ({ ...p, onboarded: true, audio: chosenAudio, services: chosenServices }));
    setClosed(true);
    track("onboarding_complete", { how, step: step + 1, audio: chosenAudio, services: chosenServices.length });
  };
  const next = () => (step < 2 ? setStep(step + 1) : finish("done"));

  const audioOptions: { value: Prefs["audio"]; title: string; sub: string }[] = [
    { value: "dub", title: cap(dubTerm(edition.contentLang)), sub: edition.contentLang === "tr" ? "Turkish voices" : "Voices in your language" },
    { value: "sub", title: cap(subTerm(edition.contentLang)), sub: edition.contentLang === "tr" ? "Original voices, Turkish subtitles" : "Original voices, subtitles" },
    { value: "original", title: "Original only", sub: "No dubbing, no subtitles" },
  ];

  const headings = ["Where do you watch?", "How do you like to watch?", "Which services do you have?"];
  const intros = [
    "Catalogs and prices differ in every country.",
    "We'll mark every title that matches. We only show languages the service confirms.",
    "Pick all that apply. We'll show what you can watch tonight first.",
  ];

  return (
    <Dialog open onClose={() => finish("skip")} labelledBy={`${id}-h`} className="md:max-w-[520px]">
      <div className="flex min-h-[72dvh] flex-col p-5 pt-4 md:min-h-0 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-white" : "bg-white/14"}`} />
            ))}
          </div>
          <button type="button" onClick={() => finish("skip")} className={`${buttonClass("quiet", "sm")} -mr-3`}>
            Skip
          </button>
        </div>
        <p lang="en" className="overline tnum mt-6 text-text-3 md:mt-8" aria-live="polite">
          Step {step + 1} of 3
        </p>
        <h2 id={`${id}-h`} className="mt-3 text-[28px] leading-[1.1] font-medium tracking-[-0.035em] md:text-[34px]">
          {headings[step]}
        </h2>
        <p className="mt-3 max-w-sm text-[15px] text-text-2">{intros[step]}</p>

        <div className="mt-6 grow md:mt-7">
          {step === 0 ? (
            <>
              <fieldset className="grid gap-2">
                <legend className="sr-only">Country</legend>
                <Option checked name={`${id}-c`} title={edition.countryName} sub="Catalog, prices and local language terms · change anytime" onSelect={() => {}} />
                <Link href="/" className="group flex items-center gap-3.5 rounded-card p-4 ring-1 ring-hairline transition duration-200 ease-out ring-inset hover:ring-hairline-strong">
                  <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center text-text-3">
                    <GlobeIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">Another country</span>
                    <span className="block text-xs text-text-3">Choose an edition — more countries soon</span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
                </Link>
              </fieldset>
              <p lang="en" className="overline mt-7 text-text-3">
                Interface language
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-medium text-ink" aria-current="true">
                  English
                </span>
                {["Türkçe", "Español", "Deutsch"].map((l) => (
                  <span key={l} className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-text-3 ring-1 ring-hairline ring-inset" title="Coming soon">
                    {l} · soon
                  </span>
                ))}
              </div>
            </>
          ) : step === 1 ? (
            <fieldset className="grid gap-2">
              <legend className="sr-only">Audio preference</legend>
              {audioOptions.map((o) => (
                <Option key={o.value} name={`${id}-a`} checked={chosenAudio === o.value} title={o.title} sub={o.sub} onSelect={() => setAudio(o.value)} />
              ))}
            </fieldset>
          ) : (
            <ul className="grid grid-cols-4 gap-2">
              {serviceOptions(edition.coreServices, services).map((s) => {
                const on = chosenServices.includes(s.slug);
                return (
                  <li key={s.slug}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked(on ? chosenServices.filter((x) => x !== s.slug) : [...chosenServices, s.slug])}
                      className={`relative flex w-full flex-col items-center gap-2.5 rounded-card px-1 pt-4 pb-3 text-xs font-medium ring-inset transition duration-200 ease-out active:scale-[0.97] ${
                        on ? "bg-white/8 text-text ring-[1.5px] ring-white" : "text-text-2 ring-1 ring-hairline hover:text-text hover:ring-hairline-strong"
                      }`}
                    >
                      <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={44} />
                      <span className="max-w-full truncate">{s.name}</span>
                      {on ? (
                        <span aria-hidden="true" className="absolute top-1.5 right-1.5 flex size-[18px] items-center justify-center rounded-full bg-white text-ink">
                          <CheckIcon className="size-3 stroke-[3.5]" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-7 flex gap-2 md:mt-8">
          {step > 0 ? (
            <button type="button" className={buttonClass("secondary", "lg")} onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : null}
          <button type="button" data-autofocus className={`${buttonClass("primary", "lg")} flex-1`} onClick={next}>
            {step < 2 ? "Continue" : "Show my picks"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Option({ name, checked, title, sub, onSelect }: { name: string; checked: boolean; title: string; sub: string; onSelect: () => void }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3.5 rounded-card p-4 ring-inset transition duration-200 ease-out ${
        checked ? "bg-white/8 ring-[1.5px] ring-white" : "ring-1 ring-hairline hover:ring-hairline-strong"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${
          checked ? "bg-white" : "ring-[1.5px] ring-white/30 ring-inset"
        }`}
      >
        {checked ? <span className="size-2 rounded-full bg-ink" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-xs text-text-3">{sub}</span>
      </span>
    </label>
  );
}
