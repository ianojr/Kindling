"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "../lib/wallet/context";
import { useBalance } from "../lib/hooks/use-balance";
import { useSolPrice } from "../lib/hooks/use-sol-price";
import { lamportsToSolString } from "../lib/lamports";
import { ellipsify } from "../lib/explorer";
import { useCluster } from "./cluster-context";

/* ── tiny helpers ────────────────────────────────────────────────────── */
function SolIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="50" fill="url(#solGrad)" />
      <defs>
        <linearGradient id="solGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <text
        x="50"
        y="67"
        textAnchor="middle"
        fontSize="52"
        fontWeight="900"
        fill="white"
        fontFamily="system-ui"
      >
        ◎
      </text>
    </svg>
  );
}

export function WalletButton() {
  const { connectors, connect, disconnect, wallet, status, error } =
    useWallet();
  const { getExplorerUrl, cluster } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = wallet?.account.address;
  const balance = useBalance(address);
  const { price } = useSolPrice();

  const close = () => setIsOpen(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usdValue =
    balance.lamports != null && price
      ? ((Number(balance.lamports) / 1e9) * price.usd).toLocaleString(
          "en-US",
          { style: "currency", currency: "USD" }
        )
      : null;

  /* ── Disconnected: connect button ────────────────────────────────── */
  if (status !== "connected") {
    return (
      <div className="relative" ref={ref}>
        <button
          id="wallet-connect-btn"
          onClick={() => setIsOpen((p) => !p)}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-primary/40 hover:shadow-xl active:scale-[0.97]"
          style={{
            boxShadow: "0 0 0 0 var(--primary-glow)",
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z"
              />
            </svg>
            Connect Wallet
          </span>
          <span className="absolute inset-0 -translate-x-full bg-white/10 skew-x-12 transition-transform duration-500 group-hover:translate-x-full" />
        </button>

        {isOpen && (
          <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-popover p-4 shadow-2xl backdrop-blur-xl">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
              Choose a wallet
            </p>
            <div className="mt-3 space-y-1.5">
              {connectors.length === 0 && (
                <div className="rounded-xl bg-cream/60 px-4 py-3 text-center">
                  <p className="text-sm text-muted">No wallets detected.</p>
                  <a
                    href="https://phantom.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-primary underline underline-offset-2"
                  >
                    Install Phantom →
                  </a>
                </div>
              )}
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  id={`wallet-${connector.id}`}
                  onClick={async () => {
                    try {
                      await connect(connector.id);
                      close();
                    } catch {
                      /* errors surface through context */
                    }
                  }}
                  disabled={status === "connecting"}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm font-medium transition-all duration-150 hover:border-border hover:bg-cream active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {connector.icon ? (
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="h-8 w-8 rounded-lg"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <SolIcon className="h-5 w-5" />
                    </div>
                  )}
                  <span>{connector.name}</span>
                  <svg
                    className="ml-auto h-4 w-4 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
            {status === "connecting" && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                <div className="h-3 w-3 animate-spin-slow rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted">Connecting…</p>
              </div>
            )}
            {error != null && (
              <p className="mt-2 rounded-lg bg-destructive-foreground px-3 py-2 text-xs text-destructive">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Connected: wallet pill ─────────────────────────────────────── */
  return (
    <div className="relative" ref={ref}>
      <button
        id="wallet-connected-btn"
        onClick={() => setIsOpen((p) => !p)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-150 hover:border-primary/40 hover:bg-cream active:scale-[0.97]"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <span className="font-mono text-xs">{ellipsify(address!, 4)}</span>
        <svg
          className={`h-3 w-3 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-popover p-4 shadow-2xl backdrop-blur-xl">
          {/* Balance + USD */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted">Wallet Balance</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">
                {balance.lamports != null
                  ? lamportsToSolString(balance.lamports)
                  : "—"}
                <span className="ml-1.5 text-sm font-normal text-muted">
                  SOL
                </span>
              </p>
              {usdValue && (
                <p className="mt-0.5 text-sm text-muted">≈ {usdValue}</p>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <SolIcon className="h-7 w-7" />
            </div>
          </div>

          {/* Network badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-low bg-cream px-2.5 py-1 text-xs font-medium capitalize">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {cluster}
            </span>
          </div>

          {/* Address */}
          <div className="mb-3 overflow-hidden rounded-xl border border-border-low bg-cream/60 px-3 py-2.5">
            <p className="break-all font-mono text-xs leading-relaxed text-muted">
              {address}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              id="wallet-copy-btn"
              onClick={handleCopy}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-cream"
            >
              {copied ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <a
              id="wallet-explorer-link"
              href={getExplorerUrl(`/address/${address}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-cream"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Explorer
            </a>
          </div>

          <button
            id="wallet-disconnect-btn"
            onClick={() => {
              disconnect();
              close();
            }}
            className="mt-2 w-full cursor-pointer rounded-xl border border-destructive/20 bg-destructive-foreground px-3 py-2 text-xs font-medium text-destructive transition-all hover:bg-destructive/15"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
