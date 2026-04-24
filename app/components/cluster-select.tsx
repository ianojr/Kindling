"use client";

import { useState, useRef, useEffect } from "react";
import { useCluster, CLUSTERS } from "./cluster-context";
import type { ClusterMoniker } from "../lib/solana-client";

const CLUSTER_LABELS: Record<ClusterMoniker, string> = {
  devnet: "Devnet",
  testnet: "Testnet",
  mainnet: "Mainnet",
  localnet: "Localnet",
};
const CLUSTER_COLORS: Record<ClusterMoniker, string> = {
  devnet: "bg-violet-400",
  testnet: "bg-amber-400",
  mainnet: "bg-emerald-400",
  localnet: "bg-sky-400",
};

export function ClusterSelect() {
  const { cluster, setCluster } = useCluster();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="cluster-select-btn"
        onClick={() => setOpen((p) => !p)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-cream"
      >
        <span
          className={`h-2 w-2 rounded-full ${CLUSTER_COLORS[cluster]}`}
        />
        {CLUSTER_LABELS[cluster]}
        <svg
          className={`h-3 w-3 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-xl">
          {CLUSTERS.map((c) => (
            <button
              key={c}
              id={`cluster-${c}`}
              onClick={() => {
                setCluster(c);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-cream ${
                c === cluster ? "text-primary" : ""
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${CLUSTER_COLORS[c]}`}
              />
              {CLUSTER_LABELS[c]}
              {c === cluster && (
                <svg
                  className="ml-auto h-3.5 w-3.5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
