"use client";

import { CheckIcon } from "@/components/icons";
import { ServiceLogo } from "@/components/ui/service-logo";
import { usePrefs } from "@/lib/client/prefs";

type Service = { slug: string; name: string; logoPath: string | null };

/** "Which services do you have?" — saves to prefs; My list and rows use it to filter. */
export function MyServices({ services }: { services: Service[] }) {
  const [prefs, setPrefs] = usePrefs();
  const toggle = (slug: string) =>
    setPrefs((p) => ({ ...p, services: p.services.includes(slug) ? p.services.filter((s) => s !== slug) : [...p.services, slug] }));
  return (
    <section className="wrap section-y">
      <div className="panel glow-orange grid gap-6 p-5 md:grid-cols-[minmax(0,320px)_1fr] md:items-center md:gap-10 md:p-8">
        <div>
          <p lang="en" className="overline text-orange">
            Personalise
          </p>
          <h2 className="text-h2 mt-2">Which services do you have?</h2>
          <p className="mt-2 text-sm text-text-2" aria-live="polite">
            {prefs.services.length
              ? `${prefs.services.length} selected — we'll highlight what's on them.`
              : "Tap yours — we'll show what you can watch right now. Saved on this device only."}
          </p>
        </div>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-4 lg:grid-cols-8">
          {services.map((s) => {
            const on = prefs.services.includes(s.slug);
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.slug)}
                  className={`relative flex w-full flex-col items-center gap-2 rounded-card px-1 py-3 text-[11px] leading-tight font-bold transition duration-150 ease-out active:scale-95 ${
                    on ? "bg-orange/14 text-text ring-2 ring-orange ring-inset" : "bg-white/5 text-text-2 ring-1 ring-hairline ring-inset hover:bg-white/10 hover:text-text"
                  }`}
                >
                  <ServiceLogo {...s} size={40} />
                  <span className="max-w-full truncate">{s.name}</span>
                  {on ? (
                    <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-orange text-ink">
                      <CheckIcon className="size-3 stroke-[3.5]" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
