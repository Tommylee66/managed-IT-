"use client";

import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/config/constants";

const LOCALE_TAG: Record<Locale, string> = { id: "id-ID", ko: "ko-KR", en: "en-US" };

function formatDigits(digits: string, locale: Locale): string {
  if (!digits) return "";
  return Number(digits).toLocaleString(LOCALE_TAG[locale]);
}

function cleanDigits(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

/** Plain-digit-string in, locale-formatted-thousands out — a text input for
 * currency amounts the master types directly (rate settings, equipment/
 * service catalog dialogs). `value`/`onChange` always carry the raw digit
 * string (e.g. "4900000"), the same shape callers already parse with
 * Number(); only the on-screen text gets a thousand separator (period for
 * id, comma for ko/en), matching lib/utils/currency.ts's formatRupiah. */
export const CurrencyInput = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (digits: string) => void;
    onBlur?: () => void;
    locale: Locale;
    id?: string;
    className?: string;
    placeholder?: string;
  }
>(function CurrencyInput({ value, onChange, onBlur, locale, id, className, placeholder }, ref) {
  const [display, setDisplay] = useState(() => formatDigits(cleanDigits(value), locale));

  useEffect(() => {
    setDisplay(formatDigits(cleanDigits(value), locale));
  }, [value, locale]);

  return (
    <Input
      ref={ref}
      id={id}
      className={className}
      placeholder={placeholder}
      inputMode="numeric"
      value={display}
      onChange={(e) => onChange(cleanDigits(e.target.value))}
      onBlur={onBlur}
    />
  );
});
