import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { calcNetWorth } from "@/lib/utils";
import { recordHistory } from "@/lib/history";

export function useAutoHistory(): void {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const { rates } = useExchangeRates();

  const lastValueRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(false);

  // Initialize lastValueRef from DB on first mount to avoid duplicate recording
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    db.history.orderBy("createdAt").last().then((entry) => {
      if (entry) lastValueRef.current = Math.round(entry.totalValue);
    });
  }, []);

  useEffect(() => {
    if (!assets || assets.length === 0 || !categories || !settings) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return;
    }

    const total = calcNetWorth(assets, categories, settings.primaryCurrency, rates).netWorth;
    const rounded = Math.round(total);

    if (lastValueRef.current === rounded) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return;
    }

    // Value changed — restart debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lastValueRef.current = rounded;
      recordHistory();
    }, 2000);

    // No cleanup — timer is managed entirely above so React's
    // effect cleanup cycle cannot accidentally cancel a pending record.
  }, [assets, categories, settings, rates]);
}
