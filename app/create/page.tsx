"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/navbar";
import { useWallet } from "../lib/wallet/context";
import { CATEGORY_LABELS } from "../lib/types";
import { useCreateCampaign } from "../lib/hooks/use-transactions";
import { toast } from "sonner";

const STEPS = ["Details","Funding","Review"];

interface Form {
  title: string; description: string; imageUrl: string;
  category: number; goal: string; deadlineDays: string;
}
const EMPTY: Form = { title:"", description:"", imageUrl:"", category:0, goal:"", deadlineDays:"30" };

export default function CreatePage() {
  const router = useRouter();
  const { status } = useWallet();
  const { create, isCreating } = useCreateCampaign();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const set = (k: keyof Form, v: string|number) => setForm(f=>({...f,[k]:v}));

  const canNext = () => {
    if (step===0) return form.title.length>=5 && form.description.length>=20;
    if (step===1) return parseFloat(form.goal)>=0.1 && parseInt(form.deadlineDays)>=1 && parseInt(form.deadlineDays)<=90;
    return true;
  };

  const handleSubmit = async () => {
    if (status !== "connected") { toast.error("Connect your wallet first"); return; }
    try {
      await create({
        title: form.title, description: form.description, imageUrl: form.imageUrl,
        category: form.category, goalSol: parseFloat(form.goal),
        deadlineDays: parseInt(form.deadlineDays),
      });
      toast.success("Campaign created! 🚀");
      router.push("/dashboard");
    } catch(e: any) { toast.error(e?.message ?? "Transaction failed"); }
  };

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2" style={{ fontFamily:"var(--font-serif)", fontSize:"2rem" }}>Create a Campaign</h1>
        <p className="mb-10 text-sm" style={{ color:"var(--fg-3)" }}>Everything stored on-chain. Goal must be ≥ 0.1 SOL.</p>

        {/* Step indicator */}
        <div className="mb-10 flex items-center">
          {STEPS.map((s,i)=>(
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all"
                  style={{ background:i<step?"var(--success)":i===step?"var(--orange)":"var(--bg-2)", color:i<=step?"#fff":"var(--fg-3)", border:i>step?"1px solid var(--border)":"none" }}>
                  {i<step?"✓":i+1}
                </div>
                <span className="mt-1.5 text-xs whitespace-nowrap" style={{ color:i===step?"var(--orange)":i<step?"var(--success)":"var(--fg-3)" }}>{s}</span>
              </div>
              {i<STEPS.length-1 && <div className="h-px flex-1 mb-4 mx-1" style={{ background:i<step?"var(--success)":"var(--border)" }} />}
            </div>
          ))}
        </div>

        <div className="animate-fade-up rounded-2xl border p-8" style={{ background:"var(--bg-1)", borderColor:"var(--border)" }}>
          {step===0 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Campaign Title * <span className="text-xs" style={{color:"var(--fg-3)"}}>(min 5 chars)</span></label>
                <input id="create-title" className="input" style={{ borderRadius:"var(--radius-sm)" }} placeholder="e.g. Open-source Solana tool" value={form.title} onChange={e=>set("title",e.target.value)} maxLength={100} />
                <p className="mt-1 text-right text-xs" style={{ color:"var(--fg-3)" }}>{form.title.length}/100</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Description * <span className="text-xs" style={{color:"var(--fg-3)"}}>(min 20 chars)</span></label>
                <textarea id="create-desc" className="input textarea" style={{ borderRadius:"var(--radius-sm)", minHeight:"140px" }}
                  placeholder="Describe your project…" value={form.description} onChange={e=>set("description",e.target.value)} maxLength={2000} />
                <p className="mt-1 text-right text-xs" style={{ color:"var(--fg-3)" }}>{form.description.length}/2000</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Cover Image URL</label>
                <input id="create-image" className="input" style={{ borderRadius:"var(--radius-sm)" }} placeholder="https://…" value={form.imageUrl} onChange={e=>set("imageUrl",e.target.value)} />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 h-32 w-full rounded-xl object-cover" onError={e=>(e.currentTarget.style.display="none")} />}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Category</label>
                <select id="create-category" className="input" style={{ borderRadius:"var(--radius-sm)", cursor:"pointer" }} value={form.category} onChange={e=>set("category",parseInt(e.target.value))}>
                  {CATEGORY_LABELS.map((l,i)=><option key={i} value={i}>{l}</option>)}
                </select>
              </div>
            </div>
          )}
          {step===1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Funding Goal * <span className="text-xs" style={{color:"var(--fg-3)"}}>(min 0.1 SOL)</span></label>
                <div className="relative">
                  <input id="create-goal" type="number" min="0.1" step="0.1" className="input" style={{ borderRadius:"var(--radius-sm)", paddingRight:"3.5rem" }} placeholder="e.g. 10" value={form.goal} onChange={e=>set("goal",e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:"var(--fg-3)" }}>SOL</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color:"var(--fg-2)" }}>Duration * <span className="text-xs" style={{color:"var(--fg-3)"}}>(1–90 days)</span></label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {["7","14","30","60"].map(d=>(
                    <button key={d} id={`duration-${d}`} onClick={()=>set("deadlineDays",d)} className="rounded-lg py-2.5 text-sm font-semibold transition-all"
                      style={{ background:form.deadlineDays===d?"var(--orange)":"var(--bg-2)", color:form.deadlineDays===d?"#fff":"var(--fg-2)", border:"1px solid var(--border)", cursor:"pointer" }}>
                      {d} days
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input id="create-days" type="number" min="1" max="90" className="input" style={{ borderRadius:"var(--radius-sm)", paddingRight:"3.5rem" }}
                    placeholder="Custom" value={form.deadlineDays} onChange={e=>set("deadlineDays",e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color:"var(--fg-3)" }}>days</span>
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor:"var(--border-hover)", background:"rgba(249,115,22,0.05)" }}>
                <p className="text-sm font-medium mb-1" style={{ color:"var(--orange)" }}>Platform fee: 1%</p>
                <p className="text-xs" style={{ color:"var(--fg-3)" }}>
                  {form.goal ? `On a ${form.goal} SOL goal: ~${(parseFloat(form.goal||"0")*0.99).toFixed(2)} SOL to you.` : "Deducted at withdrawal."}
                </p>
              </div>
            </div>
          )}
          {step===2 && (
            <div className="space-y-4">
              <h3 className="mb-4 font-semibold" style={{ fontFamily:"var(--font-serif)", fontSize:"1.25rem" }}>Review your campaign</h3>
              {form.imageUrl && (
                <div className="overflow-hidden rounded-xl aspect-[16/9]" style={{ background:"var(--bg-2)" }}>
                  <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover" />
                </div>
              )}
              {[["Title",form.title],["Category",CATEGORY_LABELS[form.category]],["Goal",`${form.goal} SOL`],["Duration",`${form.deadlineDays} days`]].map(([k,v])=>(
                <div key={k} className="flex justify-between rounded-xl border px-4 py-3 text-sm" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                  <span style={{ color:"var(--fg-3)" }}>{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="rounded-xl border px-4 py-3" style={{ background:"var(--bg-2)", borderColor:"var(--border)" }}>
                <p className="text-xs mb-1" style={{ color:"var(--fg-3)" }}>Description</p>
                <p className="text-sm line-clamp-4" style={{ color:"var(--fg-2)" }}>{form.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button id="create-back" onClick={()=>setStep(s=>s-1)} disabled={step===0} className="btn-outline" style={{ borderRadius:"var(--radius-sm)" }}>← Back</button>
          {step<2 ? (
            <button id="create-next" onClick={()=>setStep(s=>s+1)} disabled={!canNext()} className="btn-primary" style={{ borderRadius:"var(--radius-sm)" }}>Next →</button>
          ) : (
            <button id="create-submit" onClick={handleSubmit} disabled={isCreating} className="btn-primary" style={{ borderRadius:"var(--radius-sm)", minWidth:"160px", justifyContent:"center" }}>
              {isCreating ? <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-2"/>Creating…</> : "🚀 Launch Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
