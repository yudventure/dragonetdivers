"use client";

import { useState } from "react";

/** Alamat yang bisa disalin apa adanya (tautan untuk dibagikan tim). */
export function CopyText({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 rounded-input bg-foam px-3 py-2 font-mono text-sm break-all text-abyss ring-1 ring-mist">{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="h-9 rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
      >
        {copied ? "Disalin" : "Salin"}
      </button>
    </div>
  );
}
