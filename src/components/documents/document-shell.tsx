import { PrintButton } from "@/components/documents/print-button";

export function DocumentShell({
  title,
  subtitle,
  meta,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-6 bg-white p-8 text-slate-900 print:p-0"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
    >
      <div className="h-1.5 w-full rounded-full" style={{ background: "var(--brand-gradient)" }} />

      <header className="flex items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-md"
            style={{ background: "var(--brand-gradient)" }}
          >
            BCT
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              PT. Bumi Cerdas Teknology &middot; Managed IT Services
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm print:bg-white">{meta}</div>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-800">{children}</div>

      <footer className="mt-4 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
        PT. Bumi Cerdas Teknology — Managed IT Services
      </footer>
    </div>
  );
}
