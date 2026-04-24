"use client";

import useSWR from "swr";

export interface SolPrice {
  usd: number;
  usd_24h_change: number;
}

async function fetchSolPrice(): Promise<SolPrice> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Price fetch failed");
  const json = await res.json();
  return {
    usd: json.solana.usd as number,
    usd_24h_change: json.solana.usd_24h_change as number,
  };
}

export function useSolPrice() {
  const { data, error, isLoading } = useSWR<SolPrice>(
    "sol-price",
    fetchSolPrice,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  return {
    price: data ?? null,
    isLoading,
    isError: !!error,
  };
}
