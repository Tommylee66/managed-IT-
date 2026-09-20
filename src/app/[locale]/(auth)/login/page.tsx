import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacyPage");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
      {/* The sign-in screen is the one page every data subject with an account
          passes through, and the only public surface this app has besides the
          notice itself — so it carries the link. */}
      <Link
        className="text-xs text-muted-foreground underline"
        href={`/${locale}/privacy`}
      >
        {t("link")}
      </Link>
    </div>
  );
}
