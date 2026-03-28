export type TenantCurrencyDisplay = {
  currency: string;
  symbol: string;
  locale?: string;
};

const DEFAULT_LOCALE_BY_CURRENCY: Record<string, string> = {
  HNL: "es-HN",
  USD: "en-US",
  MXN: "es-MX",
  COP: "es-CO",
  ARS: "es-AR",
  EUR: "es-ES",
  GTQ: "es-GT",
  CRC: "es-CR",
  PAB: "es-PA",
  NIO: "es-NI",
  DOP: "es-DO",
  PEN: "es-PE",
  CLP: "es-CL",
};

export function getCurrencyLocale(currency: string, fallback = "es-HN") {
  return DEFAULT_LOCALE_BY_CURRENCY[currency.toUpperCase()] ?? fallback;
}

export function formatMoneyAmount(amount: number, currencyInfo: TenantCurrencyDisplay) {
  const locale = currencyInfo.locale ?? getCurrencyLocale(currencyInfo.currency);
  const formatted = Number(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencyInfo.symbol} ${formatted}`;
}
