"use client";

export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Orb top-left */}
      <div
        className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px] dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle, #7c3aed 0%, #4f46e5 50%, transparent 80%)",
        }}
      />
      {/* Orb bottom-right */}
      <div
        className="absolute -bottom-60 -right-40 h-[700px] w-[700px] rounded-full opacity-15 blur-[140px] dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle, #8b5cf6 0%, #3b82f6 60%, transparent 80%)",
        }}
      />
      {/* Center mid-glow */}
      <div
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5 blur-[100px] dark:opacity-10"
        style={{
          background:
            "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid lines - light */}
      <div
        className="absolute inset-0 opacity-100 dark:opacity-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(124,58,237,0.07) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(124,58,237,0.07) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          mask: "radial-gradient(ellipse 80% 80% at 50% 0%, black, transparent)",
          WebkitMask:
            "radial-gradient(ellipse 80% 80% at 50% 0%, black, transparent)",
        }}
      />
      {/* Subtle grid lines - dark */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(139,92,246,0.06) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(139,92,246,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          mask: "radial-gradient(ellipse 80% 80% at 50% 0%, black, transparent)",
          WebkitMask:
            "radial-gradient(ellipse 80% 80% at 50% 0%, black, transparent)",
        }}
      />

      {/* Animated diagonal shimmer strip */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, rgba(139,92,246,0.03) 50%, transparent 60%)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift 12s ease infinite",
        }}
      />
    </div>
  );
}
