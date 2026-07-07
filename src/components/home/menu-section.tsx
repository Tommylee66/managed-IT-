export function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <h3 className="mb-2 border-b border-border pb-2 text-sm font-semibold tracking-tight">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
