"use client";
import useSWR from "swr";
import { useCluster } from "../../components/cluster-context";
import { PROGRAM_ID } from "../constants";
import { DISC, discBase58, decodeCampaign } from "../program";
import { enrichCampaign } from "../utils";
import type { CampaignWithMeta } from "../types";

function useRpcUrl() {
  const { cluster } = useCluster();
  const URLS: Record<string, string> = {
    devnet:   "https://api.devnet.solana.com",
    testnet:  "https://api.testnet.solana.com",
    mainnet:  "https://api.mainnet-beta.solana.com",
    localnet: "http://localhost:8899",
  };
  return URLS[cluster] ?? URLS.devnet;
}

async function fetchCampaigns(rpcUrl: string): Promise<CampaignWithMeta[]> {
  const filterBytes = await discBase58(DISC.Campaign);
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
      params: [PROGRAM_ID, {
        encoding: "base64",
        filters: [{ memcmp: { offset: 0, bytes: filterBytes } }],
      }],
    }),
  });
  const json = await res.json();
  const accounts: Array<{ pubkey: string; account: { data: [string, string] } }> = json.result ?? [];
  return accounts.map(({ pubkey, account }) => {
    const raw = Buffer.from(account.data[0], "base64");
    return enrichCampaign(decodeCampaign(new Uint8Array(raw), pubkey));
  });
}

export function useCampaigns() {
  const rpcUrl = useRpcUrl();
  const { data, error, isLoading, mutate } = useSWR(
    ["campaigns", rpcUrl],
    ([, url]) => fetchCampaigns(url),
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );
  return { campaigns: data ?? [], error, isLoading, refresh: mutate };
}

// Re-export hook for consuming the RPC URL elsewhere
export { useRpcUrl };
