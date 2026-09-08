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
      className="grid grid-cols-[36px_1fr] items-center gap-3 rounded-xl px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-md hover:bg-muted/60"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${ICON_BG[color]}`}>
        {icon}
      </div>
      <h4 className="text-sm font-semibold leading-tight">{title}</h4>
    </Link>
  );
}
