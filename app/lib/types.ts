// ─── On-chain types ───────────────────────────────────────────────────────────

export type CampaignStatus = "active" | "successful" | "failed" | "cancelled" | "withdrawn";

export const CATEGORY_LABELS = [
  "Technology", "Art", "Music", "Film", "Games",
  "Food", "Fashion", "Health", "Education", "Environment", "Community", "Other",
] as const;

export type Category = typeof CATEGORY_LABELS[number];

export interface Campaign {
  publicKey: string;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  category: number;
  goal: bigint;        // lamports
  pledgedAmount: bigint;
  backerCount: number;
  deadline: number;    // unix timestamp
  status: number;
  isFeatured: boolean;
  createdAt: number;
  campaignId: bigint;
}

export interface CreatorProfile {
  publicKey: string;
  owner: string;
  name: string;
  bio: string;
  avatarUrl: string;
  twitter: string;
  isVerified: boolean;
  campaignsCreated: number;
  totalRaised: bigint;
  createdAt: number;
}

export interface Contribution {
  publicKey: string;
  campaign: string;
  backer: string;
  amount: bigint;
  pledgedAt: number;
  refunded: boolean;
}

export interface GlobalState {
  authority: string;
  feeBasisPoints: number;
  totalCampaigns: bigint;
  totalRaised: bigint;
  isPaused: boolean;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface CampaignWithMeta extends Campaign {
  percentFunded: number;
  secsRemaining: number;
  statusLabel: CampaignStatus;
  categoryLabel: string;
}
