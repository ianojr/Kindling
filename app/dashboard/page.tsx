"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { CampaignCard } from "../components/campaign-card";
import { useCampaigns } from "../lib/hooks/use-campaigns";
import { useMyContributions } from "../lib/hooks/use-contributions";
import { useWithdraw, useRefund } from "../lib/hooks/use-transactions";
import { useWallet } from "../lib/wallet/context";
import { useCluster } from "../components/cluster-context";
import { formatSol, ellipsify } from "../lib/utils";
import { toast } from "sonner";

function WithdrawButton({ campaign }: { campaign: any }) {
  const { withdraw, isWithdrawing } = useWithdraw(campaign);
  const { getExplorerUrl } = useCluster();
  return (
    <button onClick={async () => {
      try {
        const sig = await withdraw();
        toast.success("Funds Withdrawn! 💸", { description: <a href={getExplorerUrl(`/tx/${sig}`)} target="_blank" className="underline">View transaction →</a> });
      } catch (e: any) { toast.error(e?.message ?? "Withdrawal failed"); }
    }} disabled={isWithdrawing} className="btn-primary flex-1 py-2 text-xs font-bold uppercase tracking-wider" style={{ borderRadius: "var(--r-sm)", justifyContent: "center" }}>
      {isWithdrawing ? "Processing..." : "Withdraw SOL"}
    </button>
  );
}

function RefundButton({ campaign }: { campaign: any }) {
  const { refund, isRefunding } = useRefund(campaign);
  const { getExplorerUrl } = useCluster();
  return (
    <button onClick={async () => {
      try {
        const sig = await refund();
        toast.success("Refund Claimed! 🛡️", { description: <a href={getExplorerUrl(`/tx/${sig}`)} target="_blank" className="underline">View transaction →</a> });
      } catch (e: any) { toast.error(e?.message ?? "Refund failed"); }
    }} disabled={isRefunding} className="btn-outline flex-1 py-2 text-xs font-bold uppercase tracking-wider" style={{ borderRadius: "var(--r-sm)", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)", justifyContent: "center" }}>
      {isRefunding ? "Processing..." : "Claim Refund"}
    </button>
  );
}

export default function DashboardPage() {
  const { wallet, status } = useWallet();
  const { campaigns, isLoading } = useCampaigns();
  const address = wallet?.account.address;
  const myCampaigns = useMemo(() => campaigns.filter(c => c.creator === address), [campaigns, address]);
  const { contributions, isLoading: contribLoading } = useMyContributions(address);
  const [tab, setTab] = useState<"campaigns" | "pledges">("campaigns");

  if (status !== "connected") return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center py-40 text-center px-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[var(--orange)] opacity-20 blur-3xl rounded-full" />
          <p className="relative text-7xl animate-float">🔐</p>
        </div>
        <h1 className="mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700 }}>Connect to Manage</h1>
        <p className="mb-10 text-fg-3 max-w-sm mx-auto leading-relaxed">Please connect your Solana wallet to manage your campaigns and track your backing history.</p>
        <button id="dashboard-connect-btn" className="btn-primary-lg">Connect Wallet Now</button>
      </div>
      <Footer />
    </div>
  );

  const totalRaised = myCampaigns.reduce((s, c) => s + c.pledgedAmount, 0n);
  const totalPledged = contributions.reduce((s, c) => s + c.amount, 0n);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <section className="pt-16 pb-12" style={{ background: "var(--bg-1)" }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--orange)" }}>User Profile</p>
              <h1 className="leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>My Dashboard</h1>
              <p className="font-mono text-xs mt-2" style={{ color: "var(--fg-3)" }}>{address}</p>
            </div>
            <Link href="/create" className="btn-primary-lg shrink-0">✦ Start New Campaign</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-up">
            {[
              { label: "My Campaigns", value: myCampaigns.length.toString(), icon: "🚀" },
              { label: "Total Raised", value: `${formatSol(totalRaised)} SOL`, icon: "💰" },
              { label: "Total Pledged", value: `${formatSol(totalPledged)} SOL`, icon: "💎" },
              { label: "Projects Backed", value: contributions.length.toString(), icon: "🤝" },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl border p-6 transition-transform hover:-translate-y-1" style={{ borderColor: "var(--border)" }}>
                <div className="text-2xl mb-3 opacity-60">{s.icon}</div>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--fg-4)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="flex gap-4 p-1.5 rounded-2xl border mb-10 w-fit glass" style={{ borderColor: "var(--border)" }}>
          {[
            { id: "campaigns", label: "My Campaigns", icon: "🔥" },
            { id: "pledges", label: "My Pledges", icon: "🎟️" }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? "bg-[var(--orange)] text-white shadow-lg shadow-orange-900/40" : "text-fg-3 hover:bg-bg-2"}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {tab === "campaigns" ? (
          isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map(i => <div key={i} className="skeleton h-[400px] w-full rounded-3xl" />)}
            </div>
          ) : myCampaigns.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-dashed" style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
              <p className="text-5xl mb-4">🛸</p>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>No campaigns launched</h3>
              <p className="text-fg-3 mb-8">Ready to bring your idea to the Solana ecosystem?</p>
              <Link href="/create" className="btn-outline">Start your first campaign →</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myCampaigns.map((c, i) => (
                <div key={c.publicKey} className="flex flex-col h-full">
                  <div className="flex-1"><CampaignCard campaign={c} index={i} /></div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/campaign/${c.publicKey}`} className="btn-outline flex-1 py-2 text-xs font-bold uppercase" style={{ borderRadius: "var(--r-sm)", justifyContent: "center" }}>Manage</Link>
                    {c.status === 1 && <WithdrawButton campaign={c} />}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          contribLoading ? (
            <div className="space-y-4">{[0, 1, 2].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}</div>
          ) : contributions.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-dashed" style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
              <p className="text-5xl mb-4">🕵️</p>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>No pledges tracked</h3>
              <p className="text-fg-3 mb-8">Explore innovative projects and support the future of Web3.</p>
              <Link href="/explore" className="btn-outline">Browse active projects →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contributions.map((c, i) => {
                const camp = campaigns.find(x => x.publicKey === c.campaign);
                return (
                  <div key={i} className="animate-fade-up glass rounded-3xl border p-5 flex flex-col sm:flex-row items-center gap-6" style={{ borderColor: "var(--border)", animationDelay: `${i * 100}ms` }}>
                    <div className="h-16 w-24 rounded-2xl overflow-hidden shrink-0" style={{ background: "var(--bg-2)" }}>
                      {camp?.imageUrl ? <img src={camp.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center opacity-20">🔥</div>}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-lg font-bold mb-0.5" style={{ fontFamily: "var(--font-display)" }}>{camp?.title ?? ellipsify(c.campaign, 8)}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs" style={{ color: "var(--fg-3)" }}>
                        <span className="font-mono">{ellipsify(c.campaign, 12)}</span>
                        <span>•</span>
                        <span>{camp ? `${camp.percentFunded}% funded` : "Loading status..."}</span>
                        <span>•</span>
                        <span>{camp?.backerCount ?? 0} total backers</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
                      <div className="text-center sm:text-right">
                        <p className="text-xl font-black" style={{ color: "var(--orange)" }}>{formatSol(c.amount)} SOL</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--fg-4)" }}>Transaction verified</p>
                      </div>
                      <div className="flex gap-2">
                        {camp && <Link href={`/campaign/${camp.publicKey}`} className="btn-ghost px-4 py-1.5 text-[10px] font-bold uppercase border border-border" style={{ borderRadius: "99px" }}>View Project</Link>}
                        {camp?.status === 2 && !c.refunded && <RefundButton campaign={camp} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
