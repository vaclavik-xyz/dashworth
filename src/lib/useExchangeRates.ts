"use client";

import { useState, useEffect, useCallback } from "react";
import { getExchangeRates } from "@/lib/exchange-rates";
import { db } from "@/lib/db";

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, CZK: 23.5, EUR: 0.92 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const result = await getExchangeRates();
    setRates(result.rates);
    setLastUpdated(result.fetchedAt);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await db.exchangeRates.delete("rates");
    await load();
  }, [load]);

  return { rates, refresh, lastUpdated };
}
