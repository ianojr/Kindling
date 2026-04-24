// Program ID — deployed to devnet
export const PROGRAM_ID = "JAL6KieMTfamqTRyPMx5CLUnDUU7GVaV7aSaEJhYSHHt";

export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const MIN_GOAL_SOL = 0.1;
export const PLATFORM_FEE_PCT = 1; // 1%

export const CATEGORY_COLORS: Record<number, string> = {
  0: "bg-blue-500/10 text-blue-400",
  1: "bg-purple-500/10 text-purple-400",
  2: "bg-pink-500/10 text-pink-400",
  3: "bg-red-500/10 text-red-400",
  4: "bg-green-500/10 text-green-400",
  5: "bg-yellow-500/10 text-yellow-400",
  6: "bg-orange-500/10 text-orange-400",
  7: "bg-teal-500/10 text-teal-400",
  8: "bg-cyan-500/10 text-cyan-400",
  9: "bg-emerald-500/10 text-emerald-400",
  10: "bg-violet-500/10 text-violet-400",
  11: "bg-zinc-500/10 text-zinc-400",
};

export const STATUS_COLORS: Record<number, string> = {
  0: "bg-orange-500/10 text-orange-400",   // active
  1: "bg-green-500/10 text-green-400",     // successful
  2: "bg-red-500/10 text-red-400",         // failed
  3: "bg-zinc-500/10 text-zinc-400",       // cancelled
  4: "bg-blue-500/10 text-blue-400",       // withdrawn
};

export const STATUS_LABELS = ["Active", "Successful", "Failed", "Cancelled", "Withdrawn"];

// Placeholder images using gradient data URIs for demo
export const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&q=80",
  "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80",
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
];
