import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-quicksand",
});

/** The BCT wordmark: "BCT" set in a rounded geometric sans with tight,
 * near-touching tracking, "Total IT Care" beneath it smaller and muted —
 * this literally is appName ("BCT Total IT Care") split into two visual
 * tiers, not a separate brand element, so it replaces the old icon-badge
 * wherever that name would otherwise be repeated right next to it. */
export function BctWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const isSm = size === "sm";
  return (
    <div className={`${quicksand.className} flex shrink-0 flex-col leading-none whitespace-nowrap`}>
      <span
        className={isSm ? "text-2xl" : "text-4xl"}
        style={{ fontWeight: 600, letterSpacing: "-0.06em", color: "#0f172a" }}
      >
        BCT
      </span>
      <span
        className={isSm ? "mt-0.5 text-xs" : "mt-1 text-sm"}
        style={{ fontWeight: 500, letterSpacing: "-0.01em", color: "#8a94a3" }}
      >
        Total IT Care
      </span>
    </div>
  );
}
