"use client";

import { useEffect, useState } from "react";
import { getCurrencyLocale, type TenantCurrencyDisplay } from "@/lib/currency-format";

type TenantCurrencyState = TenantCurrencyDisplay & { isLoading: boolean };

const fallbackCurrency: TenantCurrencyDisplay = {
  currency: "HNL",
  symbol: "L",
  locale: getCurrencyLocale("HNL"),
};

export function useTenantCurrency() {
  const [state, setState] = useState<TenantCurrencyState>({
    ...fallbackCurrency,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/tenant-currency", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setState({
          currency: data.currency ?? fallbackCurrency.currency,
          symbol: data.symbol ?? fallbackCurrency.symbol,
          locale: data.locale ?? getCurrencyLocale(data.currency ?? fallbackCurrency.currency),
          isLoading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setState({ ...fallbackCurrency, isLoading: false });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
