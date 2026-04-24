"use client";
import { useState, useMemo } from "react";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { CampaignCard } from "../components/campaign-card";
import { useCampaigns } from "../lib/hooks/use-campaigns";
import { CATEGORY_LABELS } from "../lib/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Recently Launched" },
  { value: "backers", label: "Most Backed" },
  { value: "funded", label: "Top Funded %" },
  { value: "ending", label: "Ending Soon" },
];

const STATUS_OPTIONS = [
  { value: null, label: "All Campaigns" },
  { value: 0, label: "Active" },
  { value: 1, label: "Successful" },
  { value: 2, label: "Failed" },
];

function Skeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/9] w-full" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-4 w-12 rounded-full" /></div>
        <div className="skeleton h-6 w-full rounded-md" />
        <div className="skeleton h-4 w-3/4 rounded-md" />
        <div className="skeleton h-2 w-full rounded-full mt-4" />
        <div className="flex justify-between items-center pt-2"><div className="skeleton h-4 w-16 rounded" /><div className="skeleton h-4 w-24 rounded" /></div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { campaigns, isLoading } = useCampaigns();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const [status, setStatus] = useState<number | null>(0); // Default to active
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...campaigns];
    if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== null) list = list.filter(c => c.category === category);
    if (status !== null) list = list.filter(c => c.status === status);
    
    switch (sort) {
      case "backers": list.sort((a, b) => b.backerCount - a.backerCount); break;
      case "funded": list.sort((a, b) => b.percentFunded - a.percentFunded); break;
      case "ending": list.sort((a, b) => (a.deadline - Date.now()/1000) - (b.deadline - Date.now()/1000)); break;
      default: list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [campaigns, search, category, status, sort]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <section className="relative overflow-hidden pt-16 pb-12" style={{ background: "var(--bg-1)" }}>
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="container mx-auto px-6 relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--orange)" }}>Discover</p>
          <h1 className="mb-6 leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            The next big thing is <span className="gradient-text">here</span>
          </h1>
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-[var(--orange)] opacity-0 group-focus-within:opacity-10 blur-2xl transition-opacity duration-500" />
            <div className="relative flex items-center">
              <svg className="absolute left-5 h-5 w-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input id="explore-search" type="text" placeholder="Search by project title, description, or creator..." 
                value={search} onChange={e => setSearch(e.target.value)} 
                className="input py-5 pl-14 pr-6 text-lg shadow-2xl focus:border-[var(--orange)]" style={{ background: "var(--bg-2)", borderRadius: "var(--r)" }} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-10">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest mb-4" style={{ color: "var(--fg-4)" }}>Category</p>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setCategory(null)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${category === null ? "bg-[var(--orange-dim)] text-[var(--orange)]" : "text-fg-3 hover:bg-bg-2"}`}>
                  All Categories
                </button>
                {CATEGORY_LABELS.map((l, i) => (
                  <button key={i} onClick={() => setCategory(i)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${category === i ? "bg-[var(--orange-dim)] text-[var(--orange)]" : "text-fg-3 hover:bg-bg-2"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest mb-4" style={{ color: "var(--fg-4)" }}>Status</p>
              <div className="flex flex-col gap-1.5">
                {STATUS_OPTIONS.map(o => (
                  <button key={o.label} onClick={() => setStatus(o.value)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${status === o.value ? "bg-[var(--orange-dim)] text-[var(--orange)]" : "text-fg-3 hover:bg-bg-2"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest mb-4" style={{ color: "var(--fg-4)" }}>Sort By</p>
              <select value={sort} onChange={e => setSort(e.target.value)} className="input w-full cursor-pointer" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm font-medium" style={{ color: "var(--fg-3)" }}>
                {isLoading ? "Fetching data..." : `Showing ${filtered.length} matching campaigns`}
              </p>
              <div className="flex gap-2">
                {/* Mobile filters toggle would go here */}
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-32 text-center rounded-3xl border border-dashed" style={{ borderColor: "var(--border)", background: "var(--bg-1)" }}>
                <p className="text-6xl mb-6">🔍</p>
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>No results found</h3>
                <p className="text-fg-3 mb-8">Try adjusting your filters or search terms.</p>
                <button onClick={() => { setSearch(""); setCategory(null); setStatus(null); }} className="btn-outline">Clear all filters</button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c, i) => <CampaignCard key={c.publicKey} campaign={c} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
