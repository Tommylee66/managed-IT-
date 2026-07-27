/** Frames a document's <Table> with a border, rounded corners, and subtle
 * zebra striping — the shared ui/table.tsx is used app-wide (dashboard
 * lists, admin pages) so it stays borderless there; documents want a more
 * finished, boxed look for print. */
export function DocTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 [&_tbody>tr:nth-child(even)]:bg-slate-50/70">
      {children}
    </div>
  );
}
