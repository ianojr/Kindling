"use client";
import useSWR from "swr";
import { useRpcUrl } from "./use-campaigns";
import { DISC, discBase58, decodeContribution } from "../program";
import { PROGRAM_ID } from "../constants";
import type { Contribution } from "../types";

async function fetchContributions(rpcUrl: string, backer: string): Promise<Contribution[]> {
  const filterBytes = await discBase58(DISC.Contribution);
  const backerBytes = Buffer.from(
    backer.length === 44 || backer.length === 43
      ? Buffer.from(backer, "base64")  // fallback
      : (() => { const { decodeBase58 } = require("../program"); return decodeBase58(backer); })()
  );
  // Filter by discriminator; backer is at offset 8+32 = 40
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
      params: [PROGRAM_ID, {
        encoding: "base64",
        filters: [
          { memcmp: { offset: 0, bytes: filterBytes } },
          { memcmp: { offset: 40, bytes: backer } }, // backer pubkey at offset 40 (8 disc + 32 campaign)
        ],
      }],
    }),
  });
  const json = await res.json();
  const accounts: Array<{ pubkey: string; account: { data: [string, string] } }> = json.result ?? [];
  return accounts.map(({ pubkey, account }) => {
    const raw = Buffer.from(account.data[0], "base64");
    return decodeContribution(new Uint8Array(raw), pubkey);
  });
}

export function useMyContributions(backer?: string) {
  const rpcUrl = useRpcUrl();
  const { data, error, isLoading, mutate } = useSWR(
    backer ? ["contributions", rpcUrl, backer] : null,
    ([, url, addr]) => fetchContributions(url, addr),
    { refreshInterval: 30_000 }
  );
  return { contributions: data ?? [], error, isLoading, refresh: mutate };
}

export async function fetchContributionsForCampaign(rpcUrl: string, campaignPubkey: string): Promise<Contribution[]> {
  const filterBytes = await discBase58(DISC.Contribution);
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
      params: [PROGRAM_ID, {
        encoding: "base64",
        filters: [
          { memcmp: { offset: 0, bytes: filterBytes } },
          { memcmp: { offset: 8, bytes: campaignPubkey } }, // campaign pubkey at offset 8
        ],
      }],
    }),
  });
  const json = await res.json();
  const accounts: Array<{ pubkey: string; account: { data: [string, string] } }> = json.result ?? [];
  return accounts.map(({ pubkey, account }) => {
    const raw = Buffer.from(account.data[0], "base64");
    return decodeContribution(new Uint8Array(raw), pubkey);
  });
}

export function useCampaignContributions(campaignPubkey?: string) {
  const rpcUrl = useRpcUrl();
  const { data, isLoading } = useSWR(
    campaignPubkey ? ["camp-contributions", rpcUrl, campaignPubkey] : null,
    ([, url, pk]) => fetchContributionsForCampaign(url, pk),
    { refreshInterval: 30_000 }
  );
  return { contributions: data ?? [], isLoading };
}
