"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useWallet } from "../lib/wallet/context";
import { ellipsify } from "../lib/utils";

const NAV_LINKS = [
  { label: "Explore", href: "/explore" },
  { label: "How It Works", href: "/#how" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const { wallet, status, connect, disconnect, connectors } = useWallet();
  const [walletOpen, setWalletOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const address = wallet?.account.address;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!walletOpen) return;
    const fn = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest("#wallet-dropdown") && !t.closest("#wallet-btn")) setWalletOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [walletOpen]);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,8,9,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <div className="container-wide mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-dark))", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M12 3C8 8 6 10 6 14a6 6 0 0012 0c0-4-2-6-6-11z" fill="white" opacity="0.9"/>
              <path d="M12 10C10 13 9 14 9 16a3 3 0 006 0c0-2-1-3-3-6z" fill="white"/>
            </svg>
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Kindling
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} className="btn-ghost text-sm font-medium">
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/create" className="hidden md:inline-flex btn-outline" style={{ fontSize: "0.85rem", padding: "0.55rem 1rem" }}>
            ✦ Start a Campaign
          </Link>

          {/* Wallet */}
          <div className="relative">
            {status === "connected" && address ? (
              <button
                id="wallet-btn"
                onClick={() => setWalletOpen(p => !p)}
                className="flex items-center gap-2"
                style={{
                  background: "var(--bg-2)", border: "1px solid var(--border-mid)",
                  borderRadius: "var(--r-sm)", padding: "0.5rem 0.875rem", cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--fg-2)",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--fg)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLElement).style.color = "var(--fg-2)"; }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
                {ellipsify(address, 4)}
                <svg className="h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            ) : (
              <button
                id="connect-wallet-btn"
                onClick={() => setWalletOpen(p => !p)}
                className="btn-primary"
                style={{ fontSize: "0.875rem", padding: "0.6rem 1.1rem" }}
              >
                Connect Wallet
              </button>
            )}

            {/* Wallet dropdown */}
            {walletOpen && (
              <div
                id="wallet-dropdown"
                className="animate-scale-in absolute right-0 top-full mt-2 w-72 rounded-2xl border p-4 shadow-2xl"
                style={{ background: "var(--bg-1)", borderColor: "var(--border-mid)", zIndex: 100 }}
              >
                {status === "connected" && address ? (
                  <>
                    <div className="mb-3 rounded-xl p-3" style={{ background: "var(--bg-2)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--fg-3)" }}>Connected wallet</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--fg-2)", wordBreak: "break-all" }}>{address}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/dashboard" onClick={() => setWalletOpen(false)}
                        className="btn-outline flex-1 text-center" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>
                        Dashboard
                      </Link>
                      <button onClick={() => { disconnect(); setWalletOpen(false); }}
                        className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                        style={{ color: "var(--danger)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Select Wallet</p>
                    {connectors.length === 0 ? (
                      <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-2)" }}>
                        <p className="text-sm mb-2" style={{ color: "var(--fg-3)" }}>No wallets detected</p>
                        <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: "var(--orange)" }}>
                          Install Phantom →
                        </a>
                      </div>
                    ) : connectors.map(c => (
                      <button key={c.id} id={`wallet-${c.id}`}
                        onClick={async () => { try { await connect(c.id); setWalletOpen(false); } catch {} }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors mb-1"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {c.icon && <img src={c.icon} alt="" className="h-8 w-8 rounded-lg" />}
                        <span className="font-medium">{c.name}</span>
                        <svg className="ml-auto h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: "var(--fg-2)", background: menuOpen ? "var(--bg-2)" : "transparent" }}
            onClick={() => setMenuOpen(p => !p)}
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-6 py-4 space-y-1 animate-fade-down"
          style={{ borderColor: "var(--border)", background: "rgba(8,8,9,0.97)", backdropFilter: "blur(20px)" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: "var(--fg-2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; (e.currentTarget as HTMLElement).style.color = "var(--fg)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--fg-2)"; }}
            >
              {label}
              <svg className="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </Link>
          ))}
          <div className="pt-2">
            <Link href="/create" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center" style={{ fontSize: "0.9rem" }}>
              ✦ Start a Campaign
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
