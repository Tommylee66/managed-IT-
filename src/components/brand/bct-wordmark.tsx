import Image from "next/image";

const NATIVE_WIDTH = 366;
const NATIVE_HEIGHT = 222;

/** Renders the BCT logo exactly as provided (public/bct-logo.png) — only the
 * overall size may vary by context, never the design, font, or color. */
export function BctWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const height = size === "sm" ? 36 : 56;
  const width = Math.round((NATIVE_WIDTH / NATIVE_HEIGHT) * height);
  return (
    <Image
      src="/bct-logo.png"
      alt="BCT Total IT Care"
      width={width}
      height={height}
      className="shrink-0"
      priority
    />
  );
}
