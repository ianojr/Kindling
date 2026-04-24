"use client";
import useSWR from "swr";
import { useRpcUrl } from "./use-campaigns";
import { DISC, discBase58, decodeGlobalState } from "../program";
import { PROGRAM_ID } from "../constants";
import type { GlobalState } from "../types";

export function useGlobalState() {
  const rpcUrl = useRpcUrl();
  const { data, isLoading, error } = useSWR(
    ["global-state", rpcUrl],
    async ([, url]) => {
      const filterBytes = await discBase58(DISC.GlobalState);
      const res = await fetch(url, {
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
      const accounts = json.result ?? [];
      if (accounts.length === 0) return null;
      const raw = Buffer.from(accounts[0].account.data[0], "base64");
      return decodeGlobalState(new Uint8Array(raw));
    },
    { refreshInterval: 60_000 }
  );
  return { globalState: data ?? null, isLoading, error };
}
