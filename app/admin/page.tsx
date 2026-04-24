"use client";
import { useState } from "react";
import { Navbar } from "../components/navbar";
import { CategoryBadge } from "../components/category-badge";
import { useCampaigns } from "../lib/hooks/use-campaigns";
import { useGlobalState } from "../lib/hooks/use-global-state";
import { useWallet } from "../lib/wallet/context";
import { formatSol, ellipsify } from "../lib/utils";
import { STATUS_LABELS, STATUS_COLORS, PROGRAM_ID } from "../lib/constants";

const ADMIN_WALLET = ""; // Set to your admin pubkey to gate access in production

export default function AdminPage() {
  const { wallet, status } = useWallet();
  const { campaigns, isLoading } = useCampaigns();
  const { globalState } = useGlobalState();
  const [tab, setTab] = useState<"overview"|"campaigns"|"config">("overview");
  const address = wallet?.account.address;

  // In production: replace `status === "connected"` with `address === ADMIN_WALLET`
  if (status !== "connected") return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}><Navbar />
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center px-6">
        <p className="text-5xl">🛡️</p>
        <h1 style={{ fontFamily:"var(--font-serif)", fontSize:"2rem" }}>Access Denied</h1>
        <p style={{ color:"var(--fg-3)" }}>Connect the platform authority wallet to access this page.</p>
      </div>
    </div>
  );

  const active    = campaigns.filter(c=>c.status===0).length;
  const success   = campaigns.filter(c=>c.status===1).length;
  const totalPledged = campaigns.reduce((s,c)=>s+c.pledgedAmount, 0n);
  const totalBackers = campaigns.reduce((s,c)=>s+c.backerCount, 0);

  const STATS = [
    { label:"Total Campaigns",  value: campaigns.length.toString() },
    { label:"Active",           value: active.toString() },
    { label:"Successful",       value: success.toString() },
    { label:"Total Pledged",    value: `${formatSol(totalPledged)} SOL` },
    { label:"Total Raised",     value: globalState ? `${formatSol(globalState.totalRaised)} SOL` : "—" },
    { label:"Total Backers",    value: totalBackers.toString() },
    { label:"Platform Fee",     value: globalState ? `${(globalState.feeBasisPoints/100).toFixed(1)}%` : "—" },
    { label:"Platform Status",  value: globalState ? (globalState.isPaused ? "⏸ Paused" : "✅ Live") : "—" },
  ];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background:"var(--orange-dim)", border:"1px solid var(--border-hover)" }}>🛡️</div>
          <div>
            <h1 style={{ fontFamily:"var(--font-serif)", fontSize:"1.875rem" }}>Admin Panel</h1>
            <p className="text-xs" style={{ fontFamily:"var(--font-mono)", color:"var(--fg-3)" }}>{address ? ellipsify(address,8) : "—"}</p>
          </div>
          <div className="ml-auto">
            <a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
              className="btn-outline text-xs" style={{ borderRadius:"var(--radius-xs)" }}>
              View Program →
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex rounded-xl border p-1" style={{ background:"var(--bg-1)", borderColor:"var(--border)", width:"fit-content" }}>
          {(["overview","campaigns","config"] as const).map(t=>(
            <button key={t} id={`admin-tab-${t}`} onClick={()=>setTab(t)} className="capitalize rounded-lg px-5 py-2 text-sm font-medium transition-all"
              style={{ background:tab===t?"var(--orange)":"transparent", color:tab===t?"#fff":"var(--fg-2)", cursor:"pointer" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab==="overview" && (
          <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s,i)=>(
              <div key={i} className="animate-fade-up rounded-2xl border p-5" style={{ background:"var(--bg-1)", borderColor:"var(--border)" }}>
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily:"var(--font-serif)", color:"var(--orange)" }}>{s.value}</p>
                <p className="text-xs" style={{ color:"var(--fg-3)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaigns table */}
        {tab==="campaigns" && (
          isLoading ? <div className="space-y-2">{[0,1,2,3].map(i=><div key={i} className="skeleton h-14 w-full rounded-xl"/>)}</div>
          : campaigns.length===0 ? (
            <p className="text-center py-12" style={{ color:"var(--fg-3)" }}>No campaigns on-chain yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor:"var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                    {["Campaign","Category","Status","Progress","Backers","Raised"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color:"var(--fg-3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c,i)=>(
                    <tr key={c.publicKey} className="border-b transition-colors hover:bg-[var(--bg-2)]" style={{ borderColor:"var(--border)", background:"var(--bg-1)" }}>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium line-clamp-1" style={{ fontFamily:"var(--font-serif)" }}>{c.title}</p>
                        <p className="text-xs" style={{ fontFamily:"var(--font-mono)", color:"var(--fg-3)" }}>#{c.campaignId.toString()}</p>
                      </td>
                      <td className="px-4 py-3"><CategoryBadge category={c.category}/></td>
                      <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[c.status]}`} style={{ fontSize:"0.7rem" }}>{STATUS_LABELS[c.status]}</span></td>
                      <td className="px-4 py-3" style={{ minWidth:"120px" }}>
                        <div className="progress-track mb-1" style={{ height:"4px" }}><div className="progress-fill" style={{ "--fill":`${c.percentFunded}%`, animationDelay:`${i*80}ms` } as React.CSSProperties}/></div>
                        <p className="text-xs" style={{ color:"var(--fg-3)" }}>{c.percentFunded}%</p>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily:"var(--font-mono)" }}>{c.backerCount}</td>
                      <td className="px-4 py-3 font-medium" style={{ color:"var(--orange)" }}>{formatSol(c.pledgedAmount)} SOL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Config */}
        {tab==="config" && (
          <div className="max-w-lg space-y-6">
            <div className="rounded-2xl border p-6" style={{ background:"var(--bg-1)", borderColor:"var(--border)" }}>
              <h2 className="mb-4 font-semibold" style={{ fontFamily:"var(--font-serif)", fontSize:"1.25rem" }}>Platform Configuration</h2>
              <div className="space-y-4 text-sm">
                {globalState ? (
                  <>
                    <div className="flex justify-between rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                      <span style={{ color:"var(--fg-3)" }}>Authority</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem" }}>{ellipsify(globalState.authority, 8)}</span>
                    </div>
                    <div className="flex justify-between rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                      <span style={{ color:"var(--fg-3)" }}>Platform Fee</span>
                      <span className="font-medium">{(globalState.feeBasisPoints/100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                      <span style={{ color:"var(--fg-3)" }}>Status</span>
                      <span style={{ color: globalState.isPaused ? "var(--danger)" : "var(--success)" }}>{globalState.isPaused ? "⏸ Paused" : "✅ Live"}</span>
                    </div>
                    <div className="flex justify-between rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                      <span style={{ color:"var(--fg-3)" }}>Total Campaigns</span>
                      <span className="font-medium">{globalState.totalCampaigns.toString()}</span>
                    </div>
                    <div className="flex justify-between rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                      <span style={{ color:"var(--fg-3)" }}>Total Raised (all time)</span>
                      <span className="font-medium">{formatSol(globalState.totalRaised)} SOL</span>
                    </div>
                  </>
                ) : (
                  <p style={{ color:"var(--fg-3)" }}>GlobalState not initialized yet. Run the <code className="px-1 rounded" style={{ background:"var(--bg-3)", fontFamily:"var(--font-mono)" }}>initialize</code> instruction first.</p>
                )}
              </div>
              <p className="mt-4 text-xs" style={{ color:"var(--fg-3)" }}>
                Admin instructions (pause, fee update, feature, verify) must be called directly via CLI or a custom admin UI using the program IDL.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
