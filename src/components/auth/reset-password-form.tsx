"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // The recovery link's session exchange happens asynchronously as soon as
  // the Supabase client is created — start it on mount (not lazily inside
  // onSubmit) so it has the whole time the user spends typing to finish,
  // and surface clearly if no session ever shows up (expired/invalid link).
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSessionReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const schema = z
    .object({
      password: z.string().min(8, t("passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setIsSubmitting(false);
    if (error) {
      // Surface Supabase's actual message (e.g. "should be different from
      // the old password", "link expired") rather than one generic string —
      // the real reason matters for the user to know what to do next.
      setServerError(error.message);
      return;
    }
    setDone(true);
  }

  if (checkingSession) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          {t("checkingLink")}
        </CardContent>
      </Card>
    );
  }

  if (!sessionReady) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("invalidLinkTitle")}</CardTitle>
          <CardDescription>{t("invalidLinkMessage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${locale}/forgot-password`} className="block text-center text-sm underline">
            {t("forgotPasswordLink")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("resetSuccessTitle")}</CardTitle>
          <CardDescription>{t("resetSuccessMessage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${locale}/login`} className="block text-center text-sm underline">
            {t("backToLogin")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("resetPasswordTitle")}</CardTitle>
        <CardDescription>{t("resetPasswordSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? t("updatingPassword") : t("updatePassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
