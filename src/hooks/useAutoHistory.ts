import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { sumConverted } from "@/lib/utils";
import { recordHistory } from "@/lib/history";

export function useAutoHistory(): void {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const { rates } = useExchangeRates();

  const lastValueRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!assets || assets.length === 0 || !settings) return;

    const total = sumConverted(assets, settings.primaryCurrency, rates);
    const rounded = Math.round(total);

    // Skip if value hasn't changed
    if (lastValueRef.current === rounded) return;
    lastValueRef.current = rounded;

    // Debounce: record after 2 seconds of stability
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      recordHistory();
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [assets, settings, rates]);
}
