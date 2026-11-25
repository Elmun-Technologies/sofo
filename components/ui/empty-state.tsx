export function EmptyState({ title, children, action, icon }: { title: string; children?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-panel border border-dashed border-hairline-strong bg-white/[0.02] px-6 py-14 text-center">
      {icon ? <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/6 text-text-2">{icon}</div> : null}
      <p className="text-h3">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-text-2">{children}</div> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
