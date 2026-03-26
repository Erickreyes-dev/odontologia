export const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; symbol: string; name: string }> = {
  HN: { currency: "HNL", symbol: "L", name: "Honduras" },
  US: { currency: "USD", symbol: "$", name: "Estados Unidos" },
  MX: { currency: "MXN", symbol: "$", name: "México" },
  CO: { currency: "COP", symbol: "$", name: "Colombia" },
  AR: { currency: "ARS", symbol: "$", name: "Argentina" },
  ES: { currency: "EUR", symbol: "€", name: "España" },
};

export function resolveCurrencyByCountry(countryCode: string | null | undefined) {
  if (!countryCode) return COUNTRY_CURRENCY_MAP.HN;
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? COUNTRY_CURRENCY_MAP.HN;
}
