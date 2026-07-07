export function KpiStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-2 grid grid-cols-2 gap-1.5">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-border bg-muted/40 p-1.5">
          <span className="block text-[10px] text-muted-foreground">{k.label}</span>
          <b className="text-[15px]">{k.value}</b>
        </div>
      ))}
    </div>
  );
}
