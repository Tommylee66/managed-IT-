/** Frames a document's <Table> with a border, rounded corners, and subtle
 * zebra striping — the shared ui/table.tsx is used app-wide (dashboard
 * lists, admin pages) so it stays borderless there; documents want a more
 * finished, boxed look for print.
 *
 * overflow-hidden clips content to the rounded corners on screen, but a
 * print engine can treat an overflow:hidden box as a single unit it won't
 * fragment across pages — a long table would get silently cut off instead
 * of flowing onto the next printed page. print:overflow-visible undoes the
 * clipping specifically for print, so pagination works; the rounded-corner
 * clip only matters on screen anyway. */
export function DocTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 print:overflow-visible [&_tbody>tr:nth-child(even)]:bg-slate-50/70">
      {children}
    </div>
  );
}
