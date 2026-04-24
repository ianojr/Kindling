"use client";

import { useTxHistory } from "../lib/hooks/use-tx-history";
import type { Address } from "@solana/kit";
import { useCluster } from "./cluster-context";
import { ellipsify } from "../lib/explorer";

interface Props {
  address?: Address;
  label?: string;
}

function timeAgo(blockTime: bigint | null): string {
  if (blockTime === null) return "—";
  const secs = Math.max(0, Math.floor(Date.now() / 1000) - Number(blockTime));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function TxHistory({ address, label = "Recent Transactions" }: Props) {
  const { getExplorerUrl } = useCluster();
  const { history, isLoading } = useTxHistory(address);

  return (
    <section
      id="tx-history"
      className="glass-card animate-fade-in w-full rounded-2xl"
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="font-semibold">{label}</p>
          </div>
          {address && (
            <button
              onClick={() => window.open(getExplorerUrl(`/address/${address}`), "_blank")}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-border-low px-2.5 py-1.5 text-xs text-muted transition hover:border-primary/40 hover:text-primary"
            >
              View all
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* No address / empty */}
        {!isLoading && !address && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <svg
              className="h-8 w-8 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm text-muted">Connect your wallet to see transactions.</p>
          </div>
        )}

        {/* Transaction list */}
        {!isLoading && address && history.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <svg
              className="h-8 w-8 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm text-muted">No transactions yet.</p>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div className="divide-y divide-border-low">
            {history.map((tx, i) => (
              <a
                key={tx.signature}
                id={`tx-${i}`}
                href={getExplorerUrl(`/tx/${tx.signature}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-cream"
              >
                {/* Status dot */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    tx.err
                      ? "bg-destructive-foreground text-destructive"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {tx.err ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Sig + time */}
                <div className="flex-1 overflow-hidden">
                  <p className="font-mono text-xs font-medium">
                    {ellipsify(tx.signature, 8)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {timeAgo(tx.blockTime)}
                    {tx.memo && ` · ${tx.memo}`}
                  </p>
                </div>

                {/* Badge */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    tx.err
                      ? "bg-destructive-foreground text-destructive"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {tx.err ? "Failed" : "Success"}
                </span>

                <svg
                  className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
