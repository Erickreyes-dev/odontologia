import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale, isValidLocale, translate } from "./translations";

export const LANGUAGE_COOKIE_NAME = "app_locale";

export function normalizeLocale(input: string | null | undefined): Locale {
  return isValidLocale(input) ? input : DEFAULT_LOCALE;
}

export function getLocaleFromCookieStore(): Locale {
  const cookieValue = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return normalizeLocale(cookieValue);
}

export function getServerTranslator() {
  const locale = getLocaleFromCookieStore();

  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
  };
}
