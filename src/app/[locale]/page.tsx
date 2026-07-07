import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  redirect(session ? `/${locale}/dashboard` : `/${locale}/login`);
}
