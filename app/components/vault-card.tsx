"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useBalance } from "../lib/hooks/use-balance";
import { useSolPrice } from "../lib/hooks/use-sol-price";
import { lamportsFromSol, lamportsToSolString } from "../lib/lamports";
import { type Address } from "@solana/kit";
import { toast } from "sonner";
import {
  getDepositInstruction,
  getWithdrawInstruction,
  getWithdrawInstructionAsync,
} from "../generated/vault";
import { parseTransactionError } from "../lib/errors";
import { useCluster } from "./cluster-context";

/* ── quick-amount presets ──────────────────────────────────────────── */
const PRESETS = ["0.1", "0.25", "0.5", "1"];

/* ── tiny icons ───────────────────────────────────────────────────── */
function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16m0 0l-6-6m6 6l6-6"
      />
    </svg>
  );
}
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20V4m0 0l-6 6m6-6l6 6"
      />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path
        strokeLinecap="round"
        d="M7 11V7a5 5 0 0 1 10 0v4"
      />
    </svg>
  );
}
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function VaultCard() {
  const { wallet, signer, status } = useWallet();
  const { send, isSending } = useSendTransaction();
  const { getExplorerUrl } = useCluster();
  const { price } = useSolPrice();

  const [amount, setAmount] = useState("");
  const [vaultAddress, setVaultAddress] = useState<Address | null>(null);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const walletAddress = wallet?.account.address;

  /* derive vault PDA */
  useEffect(() => {
    let cancelled = false;
    async function derive() {
      if (!signer) { setVaultAddress(null); return; }
      try {
        const ix = await getWithdrawInstructionAsync({ signer });
        const pda = ix.accounts[1]?.address;
        if (!cancelled) setVaultAddress((pda as Address) ?? null);
      } catch { if (!cancelled) setVaultAddress(null); }
    }
    void derive();
    return () => { cancelled = true; };
  }, [signer]);

  const walletBalance = useBalance(walletAddress);
  const walletLamports = walletBalance?.lamports;
  const vaultBalance = useBalance(vaultAddress ?? undefined);
  const vaultLamports = vaultBalance?.lamports;

  const hasVaultFunds = (vaultLamports ?? 0n) > 0n;

  const depositLamports = amount ? lamportsFromSol(parseFloat(amount)) : 0n;
  const depositUsd =
    amount && price
      ? (parseFloat(amount) * price.usd).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : null;
  const vaultUsd =
    vaultLamports && price
      ? ((Number(vaultLamports) / 1e9) * price.usd).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : null;

  const handleDeposit = useCallback(async () => {
    if (!walletAddress || !vaultAddress || !amount || !signer) return;

    if (walletLamports != null && walletLamports < depositLamports) {
      toast.error("Insufficient balance", {
        description: `Need ${amount} SOL + fees. You have ${lamportsToSolString(walletLamports)} SOL.`,
      });
      return;
    }

    try {
      const instruction = getDepositInstruction({
        signer,
        vault: vaultAddress,
        amount: lamportsFromSol(parseFloat(amount)),
      });
      const signature = await send({ instructions: [instruction] });
      toast.success("Deposit confirmed! 🎉", {
        description: (
          <a
            href={getExplorerUrl(`/tx/${signature}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        ),
      });
      setAmount("");
    } catch (err) {
      console.error("Deposit failed:", err);
      toast.error(parseTransactionError(err));
    }
  }, [walletAddress, vaultAddress, amount, signer, send, getExplorerUrl, walletLamports, depositLamports]);

  const handleWithdraw = useCallback(async () => {
    if (!walletAddress || !vaultAddress || !signer) return;
    try {
      const instruction = getWithdrawInstruction({ signer, vault: vaultAddress });
      const signature = await send({ instructions: [instruction] });
      toast.success("Withdrawal confirmed! 💸", {
        description: (
          <a
            href={getExplorerUrl(`/tx/${signature}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        ),
      });
    } catch (err) {
      console.error("Withdraw failed:", err);
      toast.error(parseTransactionError(err));
    }
  }, [walletAddress, vaultAddress, signer, send, getExplorerUrl]);

  /* ── Not connected ───────────────────────────────────────────────── */
  if (status !== "connected") {
    return (
      <section
        id="vault-card"
        className="glass-card animate-fade-in relative w-full overflow-hidden rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LockIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">SOL Vault</p>
            <p className="text-sm text-muted">Connect your wallet to get started.</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-cream/60 py-8 text-center">
          <LockIcon className="mx-auto mb-2 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">Wallet not connected</p>
        </div>
      </section>
    );
  }

  /* ── Connected ───────────────────────────────────────────────────── */
  return (
    <section
      id="vault-card"
      className="glass-card animate-fade-in relative w-full overflow-hidden rounded-2xl"
    >
      {/* top accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-none">SOL Vault</p>
              <p className="mt-0.5 text-xs text-muted">
                Personal PDA · only you can access
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              hasVaultFunds
                ? "bg-success/10 text-success"
                : "bg-cream text-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasVaultFunds ? "bg-success" : "bg-muted"
              }`}
            />
            {hasVaultFunds ? "Active" : "Empty"}
          </span>
        </div>

        {/* Vault Balance Panel */}
        <div className="mb-6 overflow-hidden rounded-xl border border-border-low bg-gradient-to-br from-primary/5 to-transparent p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted">
            Vault Balance
          </p>
          <p className="text-4xl font-black tabular-nums tracking-tight">
            {vaultLamports != null ? lamportsToSolString(vaultLamports) : "0.00"}
            <span className="ml-2 text-xl font-normal text-muted">SOL</span>
          </p>
          {vaultUsd && (
            <p className="mt-1 text-sm text-muted">≈ {vaultUsd}</p>
          )}
          {vaultAddress && hasVaultFunds && (
            <a
              href={getExplorerUrl(`/address/${vaultAddress}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-muted underline underline-offset-2 hover:text-primary"
            >
              {vaultAddress.slice(0, 8)}…{vaultAddress.slice(-8)}
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
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-xl border border-border-low bg-cream/40 p-1">
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              key={t}
              id={`vault-tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium capitalize transition-all duration-200 ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t === "deposit" ? (
                <ArrowDownIcon className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpIcon className="h-3.5 w-3.5" />
              )}
              {t}
            </button>
          ))}
        </div>

        {/* Deposit tab */}
        {tab === "deposit" && (
          <div className="animate-fade-in space-y-3">
            {hasVaultFunds && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                Vault already holds funds. Withdraw before depositing again.
              </div>
            )}

            {/* Quick-amount presets */}
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  id={`preset-${p}`}
                  onClick={() => setAmount(p)}
                  disabled={hasVaultFunds || isSending}
                  className={`flex-1 cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-all disabled:pointer-events-none disabled:opacity-40 ${
                    amount === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-low bg-cream/60 hover:border-primary/40 hover:bg-cream"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                id="deposit-amount-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={hasVaultFunds || isSending}
                className="w-full rounded-xl border border-border bg-card/60 py-3 pl-4 pr-16 text-sm outline-none ring-0 transition-all placeholder:text-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                SOL
              </span>
            </div>

            {depositUsd && !hasVaultFunds && (
              <p className="pl-1 text-xs text-muted">≈ {depositUsd}</p>
            )}

            <button
              id="deposit-btn"
              onClick={handleDeposit}
              disabled={
                isSending ||
                !amount ||
                parseFloat(amount) <= 0 ||
                hasVaultFunds
              }
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:shadow-primary/30 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSending ? (
                  <>
                    <SpinnerIcon className="h-4 w-4" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4" />
                    Deposit SOL
                  </>
                )}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-white/10 skew-x-12 transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </div>
        )}

        {/* Withdraw tab */}
        {tab === "withdraw" && (
          <div className="animate-fade-in space-y-4">
            <div className="rounded-xl border border-border-low bg-cream/40 p-4">
              <p className="text-xs font-medium text-muted">You will receive</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {vaultLamports != null
                  ? lamportsToSolString(vaultLamports)
                  : "0"}{" "}
                <span className="text-lg font-normal text-muted">SOL</span>
              </p>
              {vaultUsd && (
                <p className="mt-0.5 text-sm text-muted">≈ {vaultUsd}</p>
              )}
            </div>

            {!hasVaultFunds && (
              <div className="flex items-center gap-2 rounded-xl border border-border-low bg-cream/40 px-4 py-3 text-xs text-muted">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01"
                  />
                </svg>
                Your vault is empty. Deposit SOL first.
              </div>
            )}

            <button
              id="withdraw-btn"
              onClick={handleWithdraw}
              disabled={isSending || !hasVaultFunds}
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border-low bg-card/60 py-3 text-sm font-semibold transition-all duration-200 hover:border-primary/40 hover:bg-cream active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSending ? (
                  <>
                    <SpinnerIcon className="h-4 w-4" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="h-4 w-4" />
                    Withdraw All
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-6 border-t border-border-low pt-4">
          <p className="text-xs text-muted">
            Your vault is a{" "}
            <a
              href="https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              Program Derived Address
            </a>{" "}
            — only your wallet can deposit or withdraw.
          </p>
        </div>
      </div>
    </section>
  );
}
