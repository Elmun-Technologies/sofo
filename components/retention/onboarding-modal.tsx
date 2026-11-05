"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { track } from "@/lib/client/analytics";
import { usePrefs, type Prefs } from "@/lib/client/prefs";
import type { Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
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
    <Dialog open onClose={() => finish("skip")} labelledBy={`${id}-h`} className="md:max-w-[480px]">
      <div className="flex min-h-[70dvh] flex-col p-5 md:min-h-0 md:p-7">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} aria-hidden="true" className={`h-1.5 rounded-chip ${i === step ? "w-6 bg-orange" : "w-1.5 bg-line"}`} />
          ))}
          <button type="button" onClick={() => finish("skip")} className="ml-auto text-sm font-bold text-text-2 hover:text-text">
            Skip
          </button>
        </div>
        <p lang="en" className="mt-6 text-xs font-extrabold tracking-[0.08em] text-orange uppercase" aria-live="polite">
          Step {step + 1} of 3
        </p>
        <h2 id={`${id}-h`} className="mt-2 text-[28px] leading-tight font-extrabold tracking-[-0.02em]">
          {headings[step]}
        </h2>
        <p className="mt-2 text-sm text-text-2">{intros[step]}</p>

        <div className="mt-5 grow">
          {step === 0 ? (
            <>
              <fieldset className="grid gap-3">
                <legend className="sr-only">Country</legend>
                <Option checked name={`${id}-c`} title={edition.countryName} sub="Catalog, prices and local language terms · change anytime" onSelect={() => {}} />
                <Link href="/" className="flex items-center gap-3 rounded-card border border-line bg-ink/40 p-4 hover:border-text-3 hover:text-text">
                  <span aria-hidden="true" className="size-5 shrink-0 rounded-full border-2 border-line" />
                  <span>
                    <span className="block font-bold">Another country</span>
                    <span className="block text-xs text-text-2">Choose an edition — more countries soon</span>
                  </span>
                </Link>
              </fieldset>
              <p className="mt-6 text-sm font-bold">Interface language</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex h-9 items-center rounded-chip bg-white px-3.5 text-sm font-bold text-ink" aria-current="true">
                  English
                </span>
                {["Türkçe", "Español", "Deutsch"].map((l) => (
                  <span key={l} className="inline-flex h-9 items-center rounded-chip border border-line px-3.5 text-sm font-bold text-text-3" title="Coming soon">
                    {l} · soon
                  </span>
                ))}
              </div>
            </>
          ) : step === 1 ? (
            <fieldset className="grid gap-3">
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
                      className={`relative flex w-full flex-col items-center gap-2 rounded-card border px-1 py-3 text-xs font-bold transition ${
                        on ? "border-orange bg-orange-deep" : "border-line bg-ink/40 hover:border-text-3"
                      }`}
                    >
                      <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={40} />
                      <span className="truncate">{s.name}</span>
                      {on ? (
                        <span aria-hidden="true" className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-orange text-[10px] text-ink">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {step > 0 ? (
            <button type="button" className={buttonClass("secondary")} onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : null}
          <button type="button" data-autofocus className={`${buttonClass("primary")} h-12 flex-1 text-[15px]`} onClick={next}>
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
      className={`flex cursor-pointer items-center gap-3 rounded-card border p-4 transition ${checked ? "border-orange bg-orange-deep" : "border-line bg-ink/40 hover:border-text-3"}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-orange ${checked ? "border-orange" : "border-line"}`}
      >
        {checked ? <span className="size-2.5 rounded-full bg-orange" /> : null}
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-text-2">{sub}</span>
      </span>
    </label>
  );
}
