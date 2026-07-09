import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getSessionContext } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (session) {
    redirect(session.isApproved && session.isActive ? `/${locale}/dashboard` : `/${locale}/pending`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
