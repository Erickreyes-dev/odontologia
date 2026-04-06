export const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; symbol: string; name: string }> = {
  AR: { currency: "ARS", symbol: "$", name: "Argentina" },
  BO: { currency: "BOB", symbol: "Bs", name: "Bolivia" },
  BR: { currency: "BRL", symbol: "R$", name: "Brasil" },
  CL: { currency: "CLP", symbol: "$", name: "Chile" },
  CO: { currency: "COP", symbol: "$", name: "Colombia" },
  CR: { currency: "CRC", symbol: "₡", name: "Costa Rica" },
  DO: { currency: "DOP", symbol: "RD$", name: "República Dominicana" },
  EC: { currency: "USD", symbol: "$", name: "Ecuador" },
  ES: { currency: "EUR", symbol: "€", name: "España" },
  GT: { currency: "GTQ", symbol: "Q", name: "Guatemala" },
  HN: { currency: "HNL", symbol: "L", name: "Honduras" },
  PA: { currency: "PAB", symbol: "B/.", name: "Panamá" },
  NI: { currency: "NIO", symbol: "C$", name: "Nicaragua" },
  MX: { currency: "MXN", symbol: "$", name: "México" },
  PE: { currency: "PEN", symbol: "S/", name: "Perú" },
  PY: { currency: "PYG", symbol: "₲", name: "Paraguay" },
  SV: { currency: "USD", symbol: "$", name: "El Salvador" },
  US: { currency: "USD", symbol: "$", name: "Estados Unidos" },
  UY: { currency: "UYU", symbol: "$U", name: "Uruguay" },
  VE: { currency: "VES", symbol: "Bs.", name: "Venezuela" },
};

export const SUPPORTED_COUNTRIES = Object.entries(COUNTRY_CURRENCY_MAP)
  .map(([code, info]) => ({ code, label: info.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function resolveCurrencyByCountry(countryCode: string | null | undefined) {
  if (!countryCode) return COUNTRY_CURRENCY_MAP.HN;
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? COUNTRY_CURRENCY_MAP.HN;
}
