import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
