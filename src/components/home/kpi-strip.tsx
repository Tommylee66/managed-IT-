export function KpiStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-2.5 grid grid-cols-2 gap-2">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-border bg-muted/40 p-2.5">
          <span className="block text-xs text-muted-foreground">{k.label}</span>
          <b className="text-base">{k.value}</b>
        </div>
      ))}
    </div>
  );
}
