"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/shared";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n/translations";

type I18nContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type Props = {
  children: React.ReactNode;
  initialLocale?: string;
};

export function I18nProvider({ children, initialLocale }: Props) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale ?? DEFAULT_LOCALE));

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Keep browser storage aligned with server-resolved locale.
      window.localStorage.setItem(LANGUAGE_COOKIE_NAME, locale);
    }
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANGUAGE_COOKIE_NAME, nextLocale);
      }
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, vars) => translate(locale, key, vars),
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
