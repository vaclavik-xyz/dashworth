"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { X } from "lucide-react";
import { db } from "@/lib/db";
import { clearSampleData } from "@/lib/load-example";

export default function SampleDataBanner() {
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!settings?.isSampleData || dismissed) return null;

  async function handleStartFresh() {
    setClearing(true);
    await clearSampleData();
    router.push("/");
  }

  return (
    <div className="mx-6 mt-4 md:mx-10 md:mt-6 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <p className="text-sm text-amber-200">
        You&apos;re viewing sample data &mdash;{" "}
        <button
          onClick={handleStartFresh}
          disabled={clearing}
          className="font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          {clearing ? "Clearing..." : "Start fresh →"}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-amber-400/60 hover:text-amber-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
