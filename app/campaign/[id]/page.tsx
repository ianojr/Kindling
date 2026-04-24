"use client";
import { use, useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { CountdownTimer } from "../../components/countdown-timer";
import { CategoryBadge } from "../../components/category-badge";
import { useCampaigns } from "../../lib/hooks/use-campaigns";
import { useCampaignContributions } from "../../lib/hooks/use-contributions";
import { usePledge, useRefund, useWithdraw } from "../../lib/hooks/use-transactions";
import { useWallet } from "../../lib/wallet/context";
import { useCluster } from "../../components/cluster-context";
import { formatSol, ellipsify } from "../../lib/utils";
import { toast } from "sonner";
import { STATUS_COLORS } from "../../lib/constants";

interface Props { params: Promise<{ id: string }> }

export default function CampaignPage({ params }: Props) {
  const { id } = use(params);
  const { campaigns, isLoading } = useCampaigns();
  const { getExplorerUrl } = useCluster();
  const { wallet, status } = useWallet();

  const campaign = useMemo(() => campaigns.find(c => c.publicKey === id) ?? null, [campaigns, id]);
  const { contributions, isLoading: contribLoading } = useCampaignContributions(campaign?.publicKey);
  const { pledge, isPledging } = usePledge(campaign);
  const { withdraw, isWithdrawing } = useWithdraw(campaign);
  const { refund, isRefunding } = useRefund(campaign);

  const [pledgeAmount, setPledgeAmount] = useState("");
  const SOL_PRESETS = ["0.1", "0.5", "1", "2"];

  const handlePledge = async () => {
    if (status !== "connected") { toast.error("Connect your wallet first"); return; }
    const amt = parseFloat(pledgeAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      const sig = await pledge(amt);
      toast.success(`Pledged ${amt} SOL! 🎉`, {
        description: <a href={getExplorerUrl(`/tx/${sig}`)} target="_blank" rel="noopener noreferrer" className="underline">View tx →</a>
      });
      setPledgeAmount("");
    } catch (e: any) { toast.error(e?.message ?? "Transaction failed"); }
  };

  if (isLoading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <div className="skeleton h-96 w-full rounded-2xl" />
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="skeleton h-12 w-3/4 rounded-lg" />
            <div className="skeleton h-6 w-1/2 rounded-md" />
            <div className="skeleton h-48 w-full rounded-xl mt-6" />
          </div>
          <div className="skeleton h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!campaign) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div className="flex flex-col items-center py-40 gap-6 text-center px-6">
        <p className="text-7xl animate-float">❓</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700 }}>Campaign Not Found</h1>
        <p style={{ color: "var(--fg-3)", maxWidth: "400px" }}>This campaign doesn't exist on-chain or hasn't indexed yet. It might take a few seconds after creation.</p>
        <Link href="/explore" className="btn-outline mt-4">Browse Active Campaigns</Link>
      </div>
      <Footer />
    </div>
  );

  const { title, creator, imageUrl, description, percentFunded, pledgedAmount, goal, backerCount, deadline, category, isFeatured, statusLabel, publicKey, campaignId, status: rawStatus } = campaign;
  const isCreator = wallet?.account.address === creator;
  const isActive = rawStatus === 0;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden md:h-[500px]" style={{ background: "var(--bg-2)" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover opacity-60 transition-transform duration-1000 hover:scale-105" />
        ) : (
          <div className="h-full w-full grid-overlay opacity-20" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)" }} />
        
        <div className="absolute bottom-10 left-0 w-full px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-up">
              <CategoryBadge category={category} size="md" />
              {isFeatured && <span className="badge" style={{ background: "var(--orange)", color: "#fff", boxShadow: "0 4px 12px var(--orange-glow)" }}>⚡ Featured</span>}
              <span className={`badge ${STATUS_COLORS[rawStatus]}`} style={{ backdropFilter: "blur(8px)" }}>{statusLabel}</span>
            </div>
            <h1 className="animate-fade-up leading-tight mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.02em", animationDelay: "100ms" }}>
              {title}
            </h1>
            <div className="animate-fade-up flex items-center gap-2 text-sm md:text-base" style={{ color: "var(--fg-3)", animationDelay: "200ms" }}>
              by <span className="font-mono text-xs md:text-sm" style={{ color: "var(--fg-2)" }}>{ellipsify(creator, 8)}</span>
              <a href={getExplorerUrl(`/address/${creator}`)} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--orange)] transition-colors">
                <svg className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div className="space-y-12">
            {/* Stats Overview */}
            <div className="glass rounded-3xl border p-8 stagger grid grid-cols-1 sm:grid-cols-3 gap-8" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--orange)" }}>{formatSol(pledgedAmount)}</p>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold" style={{ color: "var(--fg-3)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--orange)" }} />
                  SOL Raised
                </div>
                <div className="mt-4 progress-track"><div className="progress-fill" style={{ "--fill": `${percentFunded}%` } as any} /></div>
                <p className="text-[10px] mt-2 uppercase font-bold text-right" style={{ color: "var(--fg-4)" }}>Goal: {formatSol(goal)} SOL</p>
              </div>
              
              <div>
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>{backerCount}</p>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold" style={{ color: "var(--fg-3)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--fg-3)" }} />
                  Total Backers
                </div>
              </div>
              
              <div>
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  <CountdownTimer deadline={deadline} />
                </p>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold" style={{ color: "var(--fg-3)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--fg-3)" }} />
                  Time Left
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="animate-fade-up">
              <h2 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>About the project</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fg-2)" }}>{description}</p>
              </div>
            </div>

            {/* Backers History */}
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Backer History</h2>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-bg-2 border border-border" style={{ color: "var(--fg-3)" }}>
                  {contributions.length} total
                </span>
              </div>
              
              {contribLoading ? (
                <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}</div>
              ) : contributions.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-12 text-center" style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
                  <p className="text-4xl mb-4">💎</p>
                  <p className="text-lg font-medium mb-1">No backers yet</p>
                  <p className="text-sm" style={{ color: "var(--fg-3)" }}>Be the one to spark this project's journey!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributions.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border p-5 transition-colors hover:border-[var(--border-hover)]" 
                      style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-mono text-xs md:text-sm mb-0.5" style={{ color: "var(--fg-2)" }}>{ellipsify(c.backer, 12)}</p>
                          <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--fg-4)" }}>Public Contributor</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: "var(--orange)" }}>{formatSol(c.amount)} SOL</p>
                        {c.refunded && <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", fontSize: "0.6rem" }}>REFUNDED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions Sidebar */}
          <div className="lg:sticky lg:top-28 h-fit animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="rounded-3xl border p-8 glass glow-sm" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {isActive ? "Back this project" : "Campaign Ended"}
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                {isActive 
                  ? "Support this creator and help bring this project to life. Funds are only released if the goal is met." 
                  : `This campaign concluded with ${statusLabel} status.`}
              </p>

              {isActive ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-2">
                    {SOL_PRESETS.map(p => (
                      <button key={p} onClick={() => setPledgeAmount(p)}
                        className={`rounded-xl py-2.5 text-sm font-bold transition-all border ${pledgeAmount === p ? "border-[var(--orange)] bg-[var(--orange-dim)] text-[var(--orange)] shadow-inner" : "border-border bg-bg-2 text-fg-2 hover:border-border-hover"}`}
                        style={{ cursor: "pointer" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <input type="number" min="0.01" step="0.01" placeholder="Custom SOL amount"
                      value={pledgeAmount} onChange={e => setPledgeAmount(e.target.value)}
                      className="input py-3.5 pr-14 text-base font-medium" style={{ background: "var(--bg-2)" }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs" style={{ color: "var(--fg-4)" }}>SOL</span>
                  </div>

                  <button onClick={handlePledge} disabled={isPledging || !pledgeAmount || parseFloat(pledgeAmount) <= 0}
                    className="btn-primary-lg w-full py-4 text-base" style={{ justifyContent: "center", borderRadius: "var(--r-sm)" }}>
                    {isPledging ? <><span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-2" />Processing...</> : "Pledge SOL Now"}
                  </button>
                  
                  <div className="pt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--fg-4)" }}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secure On-Chain Vault
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl py-8 text-center" style={{ background: "var(--bg-2)" }}>
                    <p className="text-4xl mb-2">
                      {rawStatus === 1 ? "🎉" : rawStatus === 2 ? "⚠️" : "🏁"}
                    </p>
                    <p className="font-bold text-lg uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>{statusLabel}</p>
                  </div>

                  {/* Creator Action: Withdraw */}
                  {isCreator && rawStatus === 1 && (
                    <button onClick={withdraw} disabled={isWithdrawing} className="btn-primary w-full py-3.5">
                      {isWithdrawing ? "Processing..." : "Withdraw Funds (99%)"}
                    </button>
                  )}

                  {/* Backer Action: Refund */}
                  {rawStatus === 2 && (
                    <button onClick={refund} disabled={isRefunding} className="btn-outline w-full py-3.5" style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}>
                      {isRefunding ? "Processing..." : "Claim Refund"}
                    </button>
                  )}
                </div>
              )}

              {/* Campaign Meta */}
              <div className="mt-10 space-y-4 border-t pt-8" style={{ borderColor: "var(--border)" }}>
                {[
                  ["Campaign ID", `#${campaignId.toString()}`],
                  ["Category", CategoryBadge({ category })],
                  ["Status", statusLabel.toUpperCase()],
                  ["Funding", `${percentFunded}% of goal`]
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-wider" style={{ color: "var(--fg-4)" }}>{k as string}</span>
                    <span className="font-medium text-fg-2">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
