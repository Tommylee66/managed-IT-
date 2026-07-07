import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSessionContext } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader locale={locale} role={session.role} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 p-5 print:p-0">{children}</main>
    </div>
  );
}
