import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LOCALES, DEFAULT_LOCALE, APP_NAME, type Locale } from "@/config/constants";
import {
  PRIVACY_POLICY_VERSION,
  PRIVACY_POLICY_EFFECTIVE_DATE,
} from "@/content/privacy/meta";

// Deliberately outside the (dashboard) route group and absent from
// PROTECTED_PREFIXES: most of the people this notice is written for —
// customer contacts, sales agents — have no account here, so a policy behind
// a login would not reach them.
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacyPage");

  // The body is markdown per locale rather than message-file strings: it runs
  // to thousands of words with tables, needs to be reviewable by a lawyer as
  // prose, and is a document with its own effective date — not UI copy.
  const resolved: Locale = LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
  const body = await readFile(
    path.join(process.cwd(), "src/content/privacy", `${resolved}.md`),
    "utf8"
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 border-b pb-6">
        <p className="text-sm text-muted-foreground">{APP_NAME}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {PRIVACY_POLICY_EFFECTIVE_DATE
            ? t("effectiveOn", {
                date: PRIVACY_POLICY_EFFECTIVE_DATE,
                version: PRIVACY_POLICY_VERSION,
              })
            : t("draftNotice")}
        </p>
      </header>

      <article
        className="flex flex-col gap-4 text-sm leading-relaxed
          [&_a]:underline
          [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold
          [&_li]:ml-5 [&_li]:list-disc
          [&_strong]:font-semibold
          [&_table]:w-full [&_table]:border-collapse [&_table]:text-left
          [&_td]:border [&_td]:px-3 [&_td]:py-2
          [&_th]:border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:font-medium"
      >
        <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
      </article>

      <footer className="mt-10 border-t pt-6 text-sm">
        <Link className="underline" href={`/${resolved}/login`}>
          {t("backToLogin")}
        </Link>
      </footer>
    </div>
  );
}
