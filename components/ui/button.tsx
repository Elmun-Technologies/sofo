import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // Black text on orange (6.4:1) — CLAUDE.md contrast rule.
  primary: "bg-orange text-ink hover:bg-orange-hover hover:text-ink active:bg-orange-press",
  secondary: "bg-surface-2 text-text hover:bg-line hover:text-text",
  ghost: "border border-line text-text hover:border-text-3 hover:text-text",
};

export function buttonClass(variant: Variant = "primary", size: "md" | "sm" = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-button font-extrabold whitespace-nowrap transition disabled:opacity-50 ${
    size === "md" ? "h-11 px-4 text-sm" : "h-9 px-3 text-[13px]"
  } ${VARIANTS[variant]}`;
}

export function ButtonLink({ href, variant, size, children, className = "", ...rest }: { href: string; variant?: Variant; size?: "md" | "sm"; children: React.ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function Button({ variant, size, className = "", ...rest }: { variant?: Variant; size?: "md" | "sm" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}
