"use client";
import Link from "next/link";
import { type CampaignWithMeta } from "../lib/types";
import { formatSol, ellipsify } from "../lib/utils";
import { CategoryBadge } from "./category-badge";
import { CountdownTimer } from "./countdown-timer";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/constants";

interface Props { campaign: CampaignWithMeta; index?: number; compact?: boolean; }

export function CampaignCard({ campaign, index = 0, compact = false }: Props) {
  const { publicKey, title, creator, imageUrl, percentFunded, pledgedAmount, goal, backerCount, deadline, status, category, isFeatured } = campaign;

  return (
    <Link href={`/campaign/${publicKey}`} id={`campaign-card-${index}`}
      className="card block overflow-hidden group animate-fade-up"
      style={{ animationDelay: `${index * 80}ms`, textDecoration: "none", color: "inherit", height: "100%" }}>

      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", background: "var(--bg-3)" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
            style={{ transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)" }}
          />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, var(--bg-3), var(--bg-4))` }}>
            <div className="flex h-full items-center justify-center text-4xl opacity-20">🔥</div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,8,9,0.7) 0%, transparent 60%)" }} />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={category} />
          {isFeatured && (
            <span className="badge" style={{ background: "var(--orange)", color: "#fff", boxShadow: "0 2px 8px rgba(249,115,22,0.4)" }}>⚡ Featured</span>
          )}
        </div>
        {status !== 0 && (
          <div className="absolute right-3 top-3">
            <span className={`badge ${STATUS_COLORS[status]}`} style={{ fontSize: "0.68rem", backdropFilter: "blur(8px)" }}>{STATUS_LABELS[status]}</span>
          </div>
        )}

        {/* % funded badge on image */}
        {status === 0 && percentFunded > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="badge" style={{ background: percentFunded >= 100 ? "rgba(34,197,94,0.9)" : "rgba(249,115,22,0.9)", color: "#fff", backdropFilter: "blur(8px)", fontSize: "0.72rem", fontFamily: "var(--font-display)" }}>
              {percentFunded}%
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col" style={{ flex: 1 }}>
        {/* Creator */}
        <p className="mb-1.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-4)", letterSpacing: "0.03em" }}>
          {ellipsify(creator, 4)}
        </p>

        {/* Title */}
        <h3 className="mb-4 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[var(--orange)]"
          style={{ fontFamily: "var(--font-display)", fontSize: compact ? "1rem" : "1.1rem", fontWeight: 600 }}>
          {title}
        </h3>

        {/* Progress */}
        {!compact && (
          <div className="mb-4">
            <div className="progress-track">
              <div className="progress-fill" style={{ "--fill": `${percentFunded}%` } as React.CSSProperties} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: percentFunded >= 100 ? "var(--success)" : "var(--orange)" }}>
                {formatSol(pledgedAmount)} SOL raised
              </span>
              <span style={{ color: "var(--fg-4)" }}>Goal: {formatSol(goal)} SOL</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-auto flex items-center justify-between border-t pt-3.5 text-xs" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1.5" style={{ color: "var(--fg-3)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="font-medium" style={{ color: "var(--fg-2)" }}>{backerCount.toLocaleString()}</span>
            <span>backers</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--fg-3)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <CountdownTimer deadline={deadline} className="font-medium" />
          </div>
        </div>
      </div>
    </Link>
  );
}
