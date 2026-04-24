"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { CampaignCard } from "./components/campaign-card";
import { Carousel } from "./components/carousel";
import { useCampaigns } from "./lib/hooks/use-campaigns";
import { useGlobalState } from "./lib/hooks/use-global-state";
import { formatSol } from "./lib/utils";

/* ── Animated counter ────────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = Date.now(); const dur = 1800;
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / dur);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(Math.round(ease * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const TRUST_ITEMS = [
  { icon: "⛓️", label: "100% On-Chain" },
  { icon: "🔐", label: "Non-Custodial" },
  { icon: "⚡", label: "Solana Speed" },
  { icon: "🌍", label: "Permissionless" },
  { icon: "🛡️", label: "Anchor Verified" },
  { icon: "💎", label: "No Hidden Fees" },
];

const HOW_STEPS = [
  { n:"01", icon:"🚀", title:"Launch your campaign", body:"Set your goal, deadline, and story. One transaction — your campaign is live on Solana forever." },
  { n:"02", icon:"💎", title:"Backers pledge SOL", body:"Supporters send SOL directly into your campaign vault PDA. No middlemen, no delays." },
  { n:"03", icon:"🔓", title:"Funds release if goal is met", body:"After the deadline, withdraw if funded (1% fee). Backers are automatically refunded if not." },
];

const WHY_ITEMS = [
  { icon:"🏦", title:"No banks, no gatekeepers", body:"Traditional crowdfunding holds your money for weeks. Kindling releases it in seconds via smart contract." },
  { icon:"🔒", title:"Cryptographic guarantees", body:"Funds are locked in a PDA vault. Not even the team can touch backer money — the program enforces the rules." },
  { icon:"🌐", title:"Global from day one", body:"Accept pledges from anywhere in the world. SOL crosses borders; wire transfers don't." },
  { icon:"📊", title:"Fully transparent", body:"Every pledge, refund, and withdrawal is a public Solana transaction. Anyone can audit anytime." },
  { icon:"⚡", title:"Sub-second confirmations", body:"Solana finalizes in ~400ms. Your supporters see confirmation before they can blink." },
  { icon:"🎯", title:"All-or-nothing protection", body:"If the goal isn't met, every backer is automatically made whole. No partial campaigns, no disputes." },
];

function CampaignSkeleton() {
  return (
    <div className="card overflow-hidden" style={{ height: "340px" }}>
      <div className="skeleton" style={{ height: "190px", width: "100%", borderRadius: 0 }} />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-2 w-full rounded-full mt-4" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { campaigns, isLoading } = useCampaigns();
  const { globalState } = useGlobalState();
  const featured = campaigns.filter(c => c.isFeatured && c.status === 0);
  const trending = [...campaigns].sort((a,b) => b.backerCount - a.backerCount).slice(0, 6);
  const active = campaigns.filter(c => c.status === 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>
        {/* Background decorations */}
        <div className="grid-overlay absolute inset-0 opacity-40" />
        <div className="hero-blob" style={{ width:"700px",height:"700px",top:"-200px",left:"50%",transform:"translateX(-50%)" }} />
        <div className="hero-blob" style={{ width:"400px",height:"400px",bottom:"0",left:"-100px",opacity:0.5 }} />
        <div className="hero-blob" style={{ width:"300px",height:"300px",top:"20%",right:"-50px",opacity:0.4 }} />

        <div className="relative container mx-auto px-6 py-20 text-center">
          {/* Pill badge */}
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm"
            style={{ borderColor: "var(--border-hover)", background: "rgba(249,115,22,0.08)", color: "var(--orange)" }}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--orange)", boxShadow: "0 0 8px var(--orange)" }} />
            Now live on Solana · {active.length > 0 ? `${active.length} active campaigns` : "Launching soon"}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mx-auto mb-6"
            style={{ animationDelay:"100ms", fontFamily:"var(--font-display)", fontSize:"clamp(2.8rem,8vw,5.5rem)", fontWeight:700, lineHeight:1.05, letterSpacing:"-0.03em", maxWidth:"900px" }}>
            Fund what{" "}
            <span className="gradient-text">matters</span>
            {" "}to the world
          </h1>

          {/* Sub */}
          <p className="animate-fade-up mx-auto mb-10 text-lg leading-relaxed"
            style={{ animationDelay:"200ms", color:"var(--fg-2)", maxWidth:"540px", lineHeight:1.75 }}>
            The first fully on-chain crowdfunding platform on Solana. Your funds are protected by math, not trust.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up flex flex-wrap items-center justify-center gap-4 mb-16" style={{ animationDelay:"300ms" }}>
            <Link href="/explore" className="btn-primary-lg">Explore Campaigns</Link>
            <Link href="/create" className="btn-outline-lg">Start a Campaign ✦</Link>
          </div>

          {/* Floating stats cards */}
          <div className="animate-fade-up grid grid-cols-2 gap-4 max-w-lg mx-auto md:grid-cols-4 md:max-w-3xl" style={{ animationDelay:"400ms" }}>
            {[
              { label:"Campaigns", value: globalState ? Number(globalState.totalCampaigns) : campaigns.length, suffix:"+" },
              { label:"SOL Raised", value: globalState ? Math.round(Number(globalState.totalRaised)/1e9) : 0, suffix:"+" },
              { label:"Active Now", value: active.length, suffix:"" },
              { label:"Fee", value: globalState ? Math.round(globalState.feeBasisPoints/100) : 1, suffix:"%" },
            ].map((s,i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center"
                style={{ border:"1px solid var(--border-mid)", boxShadow:"var(--shadow-sm)" }}>
                <p className="text-2xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--orange)" }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs mt-1" style={{ color:"var(--fg-3)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TRUST BAR ════════════════════════ */}
      <section style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--bg-1)", padding:"1.25rem 1.5rem", overflow:"hidden" }}>
        <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-3">
          {TRUST_ITEMS.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm" style={{ color:"var(--fg-3)" }}>
              <span>{icon}</span>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ FEATURED CAROUSEL ════════════════════════ */}
      <section className="section">
        <div className="container-wide mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--orange)" }}>Featured</p>
              <h2 className="text-4xl font-bold" style={{ fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>Live Campaigns</h2>
            </div>
            <Link href="/explore" className="btn-ghost hidden md:flex items-center gap-1" style={{ color:"var(--orange)" }}>
              View all <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0,1,2].map(i => <CampaignSkeleton key={i} />)}
            </div>
          ) : (featured.length > 0 ? featured : campaigns.slice(0, 6)).length === 0 ? (
            <div className="py-24 text-center rounded-2xl border" style={{ borderColor:"var(--border)", background:"var(--bg-1)" }}>
              <p className="text-5xl mb-4">🔥</p>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily:"var(--font-display)" }}>No campaigns yet</h3>
              <p className="mb-6" style={{ color:"var(--fg-3)" }}>Be the first to launch something amazing</p>
              <Link href="/create" className="btn-primary">Start a Campaign →</Link>
            </div>
          ) : (
            <>
              {/* Desktop grid */}
              <div className="hidden md:grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(featured.length > 0 ? featured : campaigns.slice(0, 6)).slice(0, 6).map((c,i) => (
                  <CampaignCard key={c.publicKey} campaign={c} index={i} />
                ))}
              </div>
              {/* Mobile carousel */}
              <div className="md:hidden">
                <Carousel autoPlay interval={4000} showArrows={false}>
                  {(featured.length > 0 ? featured : campaigns.slice(0, 6)).slice(0, 6).map((c,i) => (
                    <CampaignCard key={c.publicKey} campaign={c} index={0} />
                  ))}
                </Carousel>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section id="how" className="section" style={{ borderTop:"1px solid var(--border)", background:"var(--bg-1)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"var(--orange)" }}>Simple Process</p>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>How Kindling Works</h2>
            <p style={{ color:"var(--fg-3)", maxWidth:"480px", margin:"0 auto" }}>Three steps from idea to funded. Everything happens on-chain — no paperwork, no middlemen.</p>
          </div>
          <div className="stagger grid gap-6 md:grid-cols-3 relative">
            {/* Connector lines (desktop) */}
            <div className="absolute hidden md:block" style={{ top:"40px", left:"calc(33.33% + 1rem)", right:"calc(33.33% + 1rem)", height:"1px", background:"linear-gradient(90deg, var(--border-glow), transparent, var(--border-glow))" }} />
            {HOW_STEPS.map(({ n, icon, title, body }, i) => (
              <div key={i} className="animate-fade-up relative rounded-2xl border p-8"
                style={{ borderColor:"var(--border)", background:"var(--bg-2)", animationDelay:`${i*120}ms` }}>
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shrink-0"
                    style={{ background:"var(--orange-dim)", border:"1px solid var(--border-glow)" }}>{icon}</div>
                  <span className="text-4xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--bg-3)", lineHeight:1 }}>{n}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily:"var(--font-display)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"var(--fg-3)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TRENDING ════════════════════════ */}
      {trending.length > 0 && (
        <section className="section">
          <div className="container-wide mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--orange)" }}>Trending</p>
                <h2 className="text-4xl font-bold" style={{ fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>Most Backed</h2>
              </div>
              <Link href="/explore?sort=backers" className="btn-ghost hidden md:flex items-center gap-1" style={{ color:"var(--orange)" }}>
                View all <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
            {/* Carousel for all screens */}
            <Carousel autoPlay interval={5000} showArrows itemsPerView={1}>
              {trending.slice(0,6).map((c,i) => <CampaignCard key={c.publicKey} campaign={c} index={0} />)}
            </Carousel>
          </div>
        </section>
      )}

      {/* ════════════════════════ WHY KINDLING ════════════════════════ */}
      <section className="section" style={{ borderTop:"1px solid var(--border)", background:"var(--bg-1)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"var(--orange)" }}>Why Us</p>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>Built differently</h2>
            <p style={{ color:"var(--fg-3)", maxWidth:"480px", margin:"0 auto" }}>Traditional crowdfunding is broken. We replaced every human intermediary with verifiable code.</p>
          </div>
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map(({ icon, title, body }, i) => (
              <div key={i} className="animate-fade-up rounded-2xl border p-6 transition-all duration-300"
                style={{ borderColor:"var(--border)", background:"var(--bg-2)", animationDelay:`${i*80}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="var(--border-hover)"; el.style.background="var(--bg-3)"; el.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="var(--border)"; el.style.background="var(--bg-2)"; el.style.transform="translateY(0)"; }}>
                <div className="mb-4 text-3xl">{icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily:"var(--font-display)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"var(--fg-3)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ FINAL CTA ════════════════════════ */}
      <section className="section relative overflow-hidden text-center">
        <div className="hero-blob" style={{ width:"600px",height:"600px",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:0.7 }} />
        <div className="grid-overlay absolute inset-0 opacity-30" />
        <div className="relative container mx-auto px-6">
          <div className="animate-fade-up mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"var(--orange)" }}>Get Started</p>
            <h2 className="mb-6 text-5xl font-bold leading-tight" style={{ fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>
              Your idea deserves<br/><span className="gradient-text">real funding</span>
            </h2>
            <p className="mb-10 text-lg" style={{ color:"var(--fg-2)", lineHeight:1.75 }}>
              Launch a campaign in under 5 minutes. No approval needed. Just connect your wallet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/create" className="btn-primary-lg">🚀 Start a Campaign</Link>
              <Link href="/explore" className="btn-outline-lg">Browse Projects</Link>
            </div>
            <p className="mt-6 text-xs" style={{ color:"var(--fg-4)" }}>
              Powered by Solana · Program: JAL6KieMTf…SHHt ·{" "}
              <a href="https://explorer.solana.com/address/JAL6KieMTfamqTRyPMx5CLUnDUU7GVaV7aSaEJhYSHHt?cluster=devnet"
                target="_blank" rel="noopener noreferrer" style={{ color:"var(--fg-3)" }}>View on Explorer →</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
