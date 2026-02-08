"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Measures a container's width via ResizeObserver.
 * Returns { ref, width } — render the chart only when width > 0.
 * Replaces Recharts' ResponsiveContainer which has interaction bugs in grid/flex layouts.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
