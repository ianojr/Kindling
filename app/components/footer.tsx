import Link from "next/link";

const LINKS = {
  Platform: [
    { label: "Explore Campaigns", href: "/explore" },
    { label: "Start a Campaign", href: "/create" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "How It Works", href: "/#how" },
  ],
  Resources: [
    { label: "Solana Docs", href: "https://docs.solana.com", ext: true },
    { label: "Anchor Docs", href: "https://www.anchor-lang.com", ext: true },
    { label: "Devnet Faucet", href: "https://faucet.solana.com", ext: true },
    { label: "Program Explorer", href: "https://explorer.solana.com/address/JAL6KieMTfamqTRyPMx5CLUnDUU7GVaV7aSaEJhYSHHt?cluster=devnet", ext: true },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Audit Report", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer style={{ background: "var(--bg-1)", borderTop: "1px solid var(--border)" }}>
      <div className="divider-glow" />
      {/* CTA strip */}
      <div className="section-sm" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container mx-auto flex flex-col items-center gap-6 md:flex-row md:justify-between px-6">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>Ready to spark something?</h2>
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>Launch your campaign in minutes. Powered by Solana.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/explore" className="btn-outline" style={{ fontSize: "0.875rem" }}>Explore</Link>
            <Link href="/create" className="btn-primary" style={{ fontSize: "0.875rem" }}>Start Campaign →</Link>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-6 py-14">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-dark))", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M12 3C8 8 6 10 6 14a6 6 0 0012 0c0-4-2-6-6-11z" fill="white" opacity="0.9"/>
                  <path d="M12 10C10 13 9 14 9 16a3 3 0 006 0c0-2-1-3-3-6z" fill="white"/>
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Kindling</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "var(--fg-3)" }}>
              Decentralized crowdfunding on Solana. Fund ideas that matter, backed by cryptographic guarantees.
            </p>
            <div className="flex items-center gap-2">
              {[
                { label: "GitHub", href: "https://github.com" },
                { label: "Twitter", href: "https://twitter.com" },
                { label: "Discord", href: "#" },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all"
                  style={{ background: "var(--bg-3)", color: "var(--fg-3)", border: "1px solid var(--border)" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color="var(--orange)"; el.style.borderColor="var(--border-hover)"; el.style.background="var(--orange-dim)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color="var(--fg-3)"; el.style.borderColor="var(--border)"; el.style.background="var(--bg-3)"; }}>
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: "var(--fg-4)" }}>{group}</p>
              <ul className="space-y-3">
                {links.map((l: any) => (
                  <li key={l.label}>
                    <Link href={l.href} target={l.ext ? "_blank" : undefined} rel={l.ext ? "noopener noreferrer" : undefined}
                      className="text-sm transition-colors"
                      style={{ color: "var(--fg-3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-3)")}>
                      {l.label}{l.ext && " ↗"}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-3 border-t pt-8 sm:flex-row sm:justify-between" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--fg-4)" }}>© {new Date().getFullYear()} Kindling. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
            <p className="text-xs" style={{ color: "var(--fg-4)" }}>Live on Solana Devnet · Program: JAL6KieM…YSHHt</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
