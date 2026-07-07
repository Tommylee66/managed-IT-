export function DualBarChart({
  data,
}: {
  data: { label: string; signups: number; cancellations: number }[];
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.signups, d.cancellations]));

  return (
    <div>
      <div className="flex h-28 items-end gap-2 border-b border-border pt-2">
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 items-end justify-center gap-0.5">
            <div className="relative flex h-full w-full max-w-4 flex-col items-center justify-end">
              <span className="mb-0.5 rounded-full border border-border bg-card/90 px-1 text-[9px] font-bold text-foreground/80">
                {d.signups}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#067647] to-[#32d583]"
                style={{ height: `${Math.max(2, (d.signups / max) * 100)}%` }}
              />
            </div>
            <div className="relative flex h-full w-full max-w-4 flex-col items-center justify-end">
              <span className="mb-0.5 rounded-full border border-border bg-card/90 px-1 text-[9px] font-bold text-foreground/80">
                {d.cancellations}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#b42318] to-[#f97066]"
                style={{ height: `${Math.max(2, (d.cancellations / max) * 100)}%` }}
              />
            </div>
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
