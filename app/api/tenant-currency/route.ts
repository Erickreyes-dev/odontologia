import { NextResponse } from "next/server";
import { getSession } from "@/auth";
import { getTenantCurrency } from "@/lib/tenant-currency";
import { getCurrencyLocale } from "@/lib/currency-format";

export async function GET() {
  const session = await getSession();
  const currency = await getTenantCurrency(session?.TenantId);

  return NextResponse.json({
    currency: currency.currency,
    symbol: currency.symbol,
    locale: getCurrencyLocale(currency.currency),
  });
}
