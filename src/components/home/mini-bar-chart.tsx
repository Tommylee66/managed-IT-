export function MiniBarChart({
  data,
  formatValue,
  color = "brand",
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: "brand" | "green";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barClass = color === "green" ? "bg-gradient-to-t from-[#067647] to-[#32d583]" : "bg-gradient-to-t from-brand to-brand-2";

  return (
    <div>
      <div className="flex h-28 items-end gap-2 border-b border-border pt-2">
        {data.map((d) => (
          <div key={d.label} className="relative flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="rounded-full border border-border bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-foreground/80">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
            <div
              className={`w-full max-w-9 rounded-t-md ${barClass}`}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-6 gap-2 text-center text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
