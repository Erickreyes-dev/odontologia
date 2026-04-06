import { DEFAULT_LOCALE, type Locale, isValidLocale } from "./translations";

export const LANGUAGE_COOKIE_NAME = "app_locale";

export function normalizeLocale(input: string | null | undefined): Locale {
  return isValidLocale(input) ? input : DEFAULT_LOCALE;
}
