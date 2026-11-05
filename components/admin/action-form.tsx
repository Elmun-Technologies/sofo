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
        <p role="status" className={`text-xs font-semibold ${state.ok ? "text-available" : "text-leaving"} ${messageClassName}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

const VARIANT = {
  primary: "bg-orange text-ink hover:bg-orange-hover active:bg-orange-press",
  secondary: "bg-surface-2 text-text hover:bg-line",
  ghost: "border border-line text-text-2 hover:border-text-3 hover:text-text",
  danger: "border border-line text-text-2 hover:border-red-400 hover:text-red-300",
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
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-button px-3 text-[13px] font-extrabold whitespace-nowrap transition disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
