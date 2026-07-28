import Image from "next/image";

const BCT_NATIVE = { width: 328, height: 109 };
const TAGLINE_NATIVE = { width: 231, height: 33 };
const GAP_NATIVE = 27;
const TOTAL_NATIVE_HEIGHT = 222;

/** Renders the BCT logo exactly as provided (public/bct-logo-mark.png +
 * public/bct-logo-tagline.png, cropped from the original image) — only
 * the overall size may vary by context, never the design, font, or color.
 * The tagline is scaled so its width matches the "BCT" mark's width. */
export function BctWordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const totalHeight = size === "sm" ? 36 : 56;
  const scale = totalHeight / TOTAL_NATIVE_HEIGHT;

  const bctWidth = Math.round(BCT_NATIVE.width * scale);
  const bctHeight = Math.round(BCT_NATIVE.height * scale);
  const gap = Math.round(GAP_NATIVE * scale);
  const taglineWidth = bctWidth;
  const taglineHeight = Math.round(taglineWidth * (TAGLINE_NATIVE.height / TAGLINE_NATIVE.width));

  return (
    <div className="flex shrink-0 flex-col items-start" style={{ gap }}>
      <Image src="/bct-logo-mark.png" alt="BCT Total IT Care" width={bctWidth} height={bctHeight} priority />
      <Image src="/bct-logo-tagline.png" alt="" width={taglineWidth} height={taglineHeight} priority />
    </div>
  );
}
