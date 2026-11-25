"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/validate";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/** Form bound to an admin server action; shows the returned ok/error message. */
export function ActionForm({
  action,
  children,
  className = "",
  messageClassName = "",
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  messageClassName?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.message ? (
        <p role="status" className={`text-xs font-medium ${state.ok ? "text-available" : "text-leaving"} ${messageClassName}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

const VARIANT = {
  // White pill = the main action of a form (DS3: orange is reserved for outbound "Watch on …" links).
  primary: "bg-white text-ink hover:bg-white/85",
  secondary: "bg-white/10 text-text hover:bg-white/16",
  ghost: "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text hover:ring-white/30",
  danger: "text-text-2 ring-1 ring-inset ring-hairline-strong hover:text-red-300 hover:ring-red-400/60",
} as const;

export function SubmitButton({
  children,
  variant = "secondary",
  className = "",
  name,
  value,
  title,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT;
  className?: string;
  name?: string;
  value?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      aria-label={title}
      disabled={pending}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
