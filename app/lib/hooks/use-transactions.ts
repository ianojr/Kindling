"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useWallet } from "../wallet/context";
import { useSendTransaction } from "./use-send-transaction";
import { useGlobalState } from "./use-global-state";
import { useRpcUrl } from "./use-campaigns";
import { getGlobalStatePda, buildCreateCampaignIx, buildPledgeIx, buildWithdrawIx, buildRefundIx } from "../program";
import type { Campaign } from "../types";
import { CATEGORY_LABELS } from "../types";
import { solToLamports } from "../utils";

/* ── Create Campaign ─────────────────────────────────────────────────────── */
export function useCreateCampaign() {
  const { signer, wallet } = useWallet();
  const { send, isSending } = useSendTransaction();
  const { globalState } = useGlobalState();
  const [isCreating, setIsCreating] = useState(false);

  const create = useCallback(async (args: {
    title: string; description: string; imageUrl: string;
    category: number; goalSol: number; deadlineDays: number;
  }) => {
    if (!wallet || !signer) throw new Error("Wallet not connected");
    if (!globalState) throw new Error("Platform not initialized");
    setIsCreating(true);
    try {
      const [gsPda] = await getGlobalStatePda();
      const ix = await buildCreateCampaignIx(
        wallet.account.address,
        gsPda,
        globalState.totalCampaigns,
        {
          title: args.title,
          description: args.description,
          imageUrl: args.imageUrl,
          category: args.category,
          goal: solToLamports(args.goalSol),
          deadlineSecs: args.deadlineDays * 86400,
        }
      );
      return await send({ instructions: [ix] });
    } finally {
      setIsCreating(false);
    }
  }, [wallet, signer, send, globalState]);

  return { create, isCreating: isCreating || isSending };
}

/* ── Pledge ──────────────────────────────────────────────────────────────── */
export function usePledge(campaign: Campaign | null) {
  const { wallet } = useWallet();
  const { send, isSending } = useSendTransaction();
  const { globalState } = useGlobalState();

  const pledge = useCallback(async (amountSol: number) => {
    if (!wallet || !campaign || !globalState) throw new Error("Not ready");
    const [gsPda] = await getGlobalStatePda();
    const ix = await buildPledgeIx(
      wallet.account.address,
      campaign,
      gsPda,
      solToLamports(amountSol)
    );
    return await send({ instructions: [ix] });
  }, [wallet, campaign, send, globalState]);

  return { pledge, isPledging: isSending };
}

/* ── Withdraw ────────────────────────────────────────────────────────────── */
export function useWithdraw(campaign: Campaign | null) {
  const { wallet } = useWallet();
  const { send, isSending } = useSendTransaction();
  const { globalState } = useGlobalState();

  const withdraw = useCallback(async () => {
    if (!wallet || !campaign || !globalState) throw new Error("Not ready");
    const [gsPda] = await getGlobalStatePda();
    const ix = await buildWithdrawIx(wallet.account.address, campaign, gsPda, globalState.authority);
    return await send({ instructions: [ix] });
  }, [wallet, campaign, send, globalState]);

  return { withdraw, isWithdrawing: isSending };
}

/* ── Refund ──────────────────────────────────────────────────────────────── */
export function useRefund(campaign: Campaign | null) {
  const { wallet } = useWallet();
  const { send, isSending } = useSendTransaction();

  const refund = useCallback(async () => {
    if (!wallet || !campaign) throw new Error("Not ready");
    const ix = await buildRefundIx(wallet.account.address, campaign);
    return await send({ instructions: [ix] });
  }, [wallet, campaign, send]);

  return { refund, isRefunding: isSending };
}
