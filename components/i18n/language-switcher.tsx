"use client";

import { Globe } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Locale, SUPPORTED_LOCALES } from "@/lib/i18n/translations";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger className="h-8 w-[110px] bg-background text-xs md:w-[132px] md:text-sm" aria-label={t("language.label")}>
          <SelectValue placeholder={t("language.label")} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <SelectItem key={supportedLocale} value={supportedLocale}>
              {t(`language.${supportedLocale}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
