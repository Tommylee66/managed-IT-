import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "500"],
  variable: "--font-poppins",
});

/** The BCT wordmark: "BCT" set thin and tight-tracked, "Total IT Care"
 * beneath it wide-tracked and muted — this literally is appName
 * ("BCT Total IT Care") split into two visual tiers, not a separate
 * brand element, so it replaces the old icon-badge wherever that name
 * would otherwise be repeated right next to it. */
export function BctWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const isSm = size === "sm";
  return (
    <div className={`${poppins.className} flex shrink-0 flex-col leading-none whitespace-nowrap`}>
      <span
        className={isSm ? "text-xl" : "text-3xl"}
        style={{ fontWeight: 300, letterSpacing: "-0.04em", color: "#0f172a" }}
      >
        BCT
      </span>
      <span
        className={isSm ? "mt-0.5 text-[9px]" : "mt-1 text-xs"}
        style={{ fontWeight: 500, letterSpacing: "0.28em", color: "#64748b" }}
      >
        TOTAL IT CARE
      </span>
    </div>
  );
}
