"use client";

import useSWR from "swr";
import { type Address } from "@solana/kit";
import { useCluster } from "../../components/cluster-context";
import { useSolanaClient } from "../solana-client-context";

export interface TxRecord {
  signature: string;
  slot: bigint;
  blockTime: bigint | null;
  err: boolean;
  memo: string | null;
}

export function useTxHistory(address?: Address, limit = 8) {
  const { cluster } = useCluster();
  const client = useSolanaClient();

  const { data, isLoading, error, mutate } = useSWR(
    address ? (["tx-history", cluster, address, limit] as const) : null,
    async ([, , addr, lim]) => {
      const sigs = await client.rpc
        .getSignaturesForAddress(addr, { limit: lim })
        .send();

      return sigs.map((s) => ({
        signature: s.signature as string,
        slot: s.slot,
        blockTime: s.blockTime ?? null,
        err: s.err !== null,
        memo: s.memo ?? null,
      })) as TxRecord[];
    },
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );

  return { history: data ?? [], isLoading, error, mutate };
}
