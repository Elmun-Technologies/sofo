/** Orange rounded-square "s" mark + "sofo" wordmark (Nunito Black, corner 27%). */
export function Logo({ className = "text-[26px]" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.22em] font-logo font-black tracking-[-0.03em] ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex size-[1.12em] items-center justify-center rounded-[0.3em] bg-orange pb-[0.08em] leading-none text-white"
      >
        s
      </span>
      sofo
    </span>
  );
}
