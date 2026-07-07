import Link from "next/link";

const ICON_BG: Record<string, string> = {
  blue: "bg-pill-blue-bg",
  green: "bg-pill-green-bg",
  purple: "bg-pill-purple-bg",
  orange: "bg-pill-orange-bg",
};

export function MenuCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  return (
    <Link
      href={href}
      title={description}
      className="grid grid-cols-[30px_1fr] items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:-translate-y-0.5 hover:shadow-md hover:bg-muted/60"
    >
      <div className={`flex h-[30px] w-[30px] items-center justify-center rounded-[10px] text-base ${ICON_BG[color]}`}>
        {icon}
      </div>
      <h4 className="text-[13.5px] font-semibold leading-tight">{title}</h4>
    </Link>
  );
}
