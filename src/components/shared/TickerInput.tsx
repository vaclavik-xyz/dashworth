"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  fetchCryptoPriceDetailed,
  fetchStockPriceDetailed,
} from "@/lib/price-feeds";
import type { Currency } from "@/types";

export interface TickerResult {
  name: string;
  symbol: string;
  price: number;
  currency: Currency;
}

interface TickerInputProps {
  source: "coingecko" | "yahoo";
  value: string;
  onChange: (v: string) => void;
  currency: Currency;
  onResult: (r: TickerResult | null) => void;
  onError: (err: string | null) => void;
  onFetching: (f: boolean) => void;
  inputClassName: string;
  autoFocus?: boolean;
}

export default function TickerInput({
  source,
  value,
  onChange,
  currency,
  onResult,
  onError,
  onFetching,
  inputClassName,
  autoFocus,
}: TickerInputProps) {
  const isCrypto = source === "coingecko";
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<TickerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setResult(null);
      setError(null);
      onResult(null);
      onError(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      onFetching(true);
      setError(null);
      setResult(null);
      onError(null);
      onResult(null);
      try {
        const data = isCrypto
          ? await fetchCryptoPriceDetailed(value.trim())
          : await fetchStockPriceDetailed(value.trim());
        if (!data) {
          const msg = isCrypto ? "Coin not found" : "Ticker not found";
          setError(msg);
          onError(msg);
          return;
        }
        const price = data.prices[currency] ?? data.prices["USD"];
        const cur = data.prices[currency] ? currency : ("USD" as Currency);
        const r: TickerResult = { name: data.name, symbol: data.symbol, price, currency: cur };
        setResult(r);
        onResult(r);
      } catch {
        const msg = "Failed to fetch price";
        setError(msg);
        onError(msg);
      } finally {
        setFetching(false);
        onFetching(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [value, currency, source]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isCrypto
              ? "bitcoin, ethereum, solana..."
              : "AAPL, MSFT, VOO..."
          }
          className={inputClassName}
          autoFocus={autoFocus}
        />
        {fetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </div>
      {result && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          {result.name} &middot; {formatCurrency(result.price, result.currency)}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400">&times; {error}</p>
      )}
    </div>
  );
}
