export function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-2.5 border-b border-border pb-2 text-base font-semibold tracking-tight">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
