import Link from "next/link";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "glass" | "quiet";
type Size = "lg" | "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  // The default main action: white pill, black text.
  primary: "bg-white text-ink hover:bg-white/85 hover:text-ink",
  // Sofo Orange — reserved for the outbound "Watch on <service>" action. Black text on orange (6.4:1).
  accent: "bg-orange text-ink hover:bg-orange-hover hover:text-ink active:bg-orange-press",
  secondary: "bg-white/10 text-text hover:bg-white/16 hover:text-text",
  ghost: "text-text ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text hover:ring-white/30",
  // On imagery (hero backdrops).
  glass: "bg-white/12 text-text ring-1 ring-inset ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-text",
  quiet: "text-text-2 hover:bg-white/6 hover:text-text",
};

const SIZES: Record<Size, string> = {
  lg: "h-[52px] px-6 text-[15px] gap-2.5",
  md: "h-11 px-5 text-sm gap-2",
  sm: "h-9 px-4 text-[13px] gap-1.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `inline-flex shrink-0 items-center justify-center rounded-button font-semibold whitespace-nowrap select-none transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${SIZES[size]} ${VARIANTS[variant]}`;
}

export function ButtonLink({ href, variant, size, children, className = "", ...rest }: { href: string; variant?: Variant; size?: Size; children: React.ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function Button({ variant, size, className = "", ...rest }: { variant?: Variant; size?: Size } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}

/** Round icon-only button (44 px touch target at md). */
export function iconButtonClass(size: "md" | "sm" = "md", tone: "surface" | "glass" | "outline" = "surface") {
  return `inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 ease-out active:scale-95 ${size === "md" ? "size-11" : "size-9"} ${
    tone === "glass"
      ? "bg-black/45 text-text ring-1 ring-inset ring-white/15 backdrop-blur-md hover:bg-black/65 hover:text-text"
      : tone === "outline"
        ? "text-text ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text"
        : "text-text-2 hover:bg-white/8 hover:text-text"
  }`;
}
