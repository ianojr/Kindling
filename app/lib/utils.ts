import { CATEGORY_LABELS, type Campaign, type CampaignWithMeta } from "./types";
import { STATUS_LABELS, LAMPORTS_PER_SOL } from "./constants";

export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}
export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * Number(LAMPORTS_PER_SOL)));
}
export function formatSol(lamports: bigint, decimals = 2): string {
  return lamportsToSol(lamports).toFixed(decimals);
}
export function formatUsd(sol: number, price: number): string {
  return (sol * price).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function ellipsify(str: string, chars = 4): string {
  if (str.length <= chars * 2 + 3) return str;
  return `${str.slice(0, chars)}…${str.slice(-chars)}`;
}

export function pct(pledged: bigint, goal: bigint): number {
  if (goal === 0n) return 0;
  return Math.min(100, Math.round((Number(pledged) / Number(goal)) * 100));
}

export function secsRemaining(deadline: number): number {
  return Math.max(0, deadline - Math.floor(Date.now() / 1000));
}

export function formatCountdown(secs: number): string {
  if (secs <= 0) return "Ended";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function enrichCampaign(c: Campaign): CampaignWithMeta {
  const secs = secsRemaining(c.deadline);
  return {
    ...c,
    percentFunded: pct(c.pledgedAmount, c.goal),
    secsRemaining: secs,
    statusLabel: (["active","successful","failed","cancelled","withdrawn"] as const)[c.status] ?? "active",
    categoryLabel: CATEGORY_LABELS[c.category] ?? "Other",
  };
}


