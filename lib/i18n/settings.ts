import "server-only";
import { cookies } from "next/headers";
import { type Locale, translate } from "./translations";
import { LANGUAGE_COOKIE_NAME, normalizeLocale } from "./shared";

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
