import { cn } from "@/lib/utils";

export function SummaryBox({
  label,
  value,
  metrics,
  variant = "blue",
  className,
}: {
  label: string;
  value: string;
  metrics?: { label: string; value: string }[];
  variant?: "blue" | "purple";
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl p-5 text-white", className)}
      style={{
        background:
          variant === "purple"
            ? "linear-gradient(135deg,#2e1065,#7c3aed)"
            : "linear-gradient(135deg,#063d5d,#0f7897)",
      }}
    >
      <div className="text-sm text-white/85">{label}</div>
      <div className="mt-1.5 text-3xl font-black tracking-tight">{value}</div>
      {metrics && metrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-[14px] border border-white/20 bg-white/10 p-3">
              <div className="text-[11px] text-white/80">{m.label}</div>
              <div className="mt-1 text-sm font-bold">{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
