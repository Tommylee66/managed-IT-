import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";
import { BctLogoMark } from "@/components/brand/bct-logo-mark";
import type { StaffRole } from "@/lib/masking/staff-masking";

export async function AppHeader({
  locale,
  role,
}: {
  locale: string;
  role: StaffRole;
}) {
  const [t, tRoles, tHome] = await Promise.all([
    getTranslations("common"),
    getTranslations("roles"),
    getTranslations("home"),
  ]);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-3 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3">
          <BctLogoMark size={44} />
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground">{t("appSubtitle")}</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={role === "master" ? "default" : "secondary"}>
            {role === "master" ? tRoles("master") : tRoles("staff")}
          </Badge>
          <Link
            href={`/${locale}/dashboard`}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary"
          >
            {tHome("homeButton")}
          </Link>
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
