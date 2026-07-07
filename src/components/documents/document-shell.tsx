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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <PrintButton />
      </div>
      <div className="rounded-md border p-4 text-sm">{meta}</div>
      <div className="flex flex-col gap-6 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
