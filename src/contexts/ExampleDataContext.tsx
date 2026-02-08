"use client";

import { createContext, useContext, useMemo } from "react";
import { getExampleData, type ExampleData } from "@/lib/example-data";

const ExampleDataContext = createContext<ExampleData | null>(null);

export function ExampleDataProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const data = useMemo(() => getExampleData(slug), [slug]);

  return (
    <ExampleDataContext.Provider value={data}>
      {children}
    </ExampleDataContext.Provider>
  );
}

export function useExampleData(): ExampleData | null {
  return useContext(ExampleDataContext);
}
