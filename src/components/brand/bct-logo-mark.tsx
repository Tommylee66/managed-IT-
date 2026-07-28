/** BCT's mark: a minimal three-node network glyph (nodes + connecting
 * lines) on the brand gradient — reads as "managed IT network services"
 * without spelling out the initials, since every place this renders sits
 * right next to the full "BCT Total IT Care" / "PT. Bumi Cerdas Teknology"
 * name already. Pure SVG so it stays crisp at any size, including in the
 * server-rendered PDF documents. */
export function BctLogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl shadow-md ${className ?? ""}`}
      style={{ width: size, height: size, background: "var(--brand-gradient)" }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.55, height: size * 0.55 }}
        aria-hidden="true"
      >
        <path
          d="M12 6.5L6.5 17.5M12 6.5L17.5 17.5M6.5 17.5L17.5 17.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <circle cx="12" cy="6.5" r="2.1" fill="white" />
        <circle cx="6.5" cy="17.5" r="2.1" fill="white" />
        <circle cx="17.5" cy="17.5" r="2.1" fill="white" />
      </svg>
    </div>
  );
}
