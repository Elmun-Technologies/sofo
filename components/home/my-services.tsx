"use client";

import { ServiceLogo } from "@/components/ui/service-logo";
import { usePrefs } from "@/lib/client/prefs";

type Service = { slug: string; name: string; logoPath: string | null };

/** "Which services do you have?" — saves to prefs; My list and rows use it to filter. */
export function MyServices({ services }: { services: Service[] }) {
  const [prefs, setPrefs] = usePrefs();
  const toggle = (slug: string) =>
    setPrefs((p) => ({ ...p, services: p.services.includes(slug) ? p.services.filter((s) => s !== slug) : [...p.services, slug] }));
  return (
    <section className="mx-auto max-w-site px-4 py-5 md:px-7">
      <div className="rounded-panel bg-gradient-to-br from-orange-deep to-surface p-5 md:flex md:items-center md:gap-8 md:p-7">
        <div className="md:w-[300px] md:shrink-0">
          <h2 className="text-xl font-extrabold md:text-2xl">Which services do you have?</h2>
          <p className="mt-1 text-sm text-text-2">
            {prefs.services.length ? `${prefs.services.length} selected — we'll highlight what's on them.` : "Tap yours — we'll show what you can watch right now."}
          </p>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2.5 md:mt-0">
          {services.map((s) => {
            const on = prefs.services.includes(s.slug);
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.slug)}
                  title={s.name}
                  className={`relative rounded-[14px] p-0.5 transition ${on ? "ring-2 ring-orange" : "opacity-80 hover:opacity-100"}`}
                >
                  <ServiceLogo {...s} size={48} />
                  {on ? <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-orange text-[11px] font-extrabold text-ink">✓</span> : null}
                  <span className="sr-only">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
