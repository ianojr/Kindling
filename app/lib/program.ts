import type { Campaign, CreatorProfile, Contribution, GlobalState } from "./types";
import { PROGRAM_ID } from "./constants";

/* ── Base58 ──────────────────────────────────────────────────────────────── */
const B58_ABC = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function encodeBase58(bytes: Uint8Array): string {
  const d = [0];
  for (const b of bytes) {
    let c = b;
    for (let i = 0; i < d.length; i++) { c += d[i] << 8; d[i] = c % 58; c = (c / 58) | 0; }
    while (c > 0) { d.push(c % 58); c = (c / 58) | 0; }
  }
  let s = "";
  for (let i = bytes.length - 1; i >= 0 && bytes[i] === 0; i--) s += "1";
  for (let i = d.length - 1; i >= 0; i--) s += B58_ABC[d[i]];
  return s;
}
export function decodeBase58(s: string): Uint8Array {
  const d = [0];
  for (const ch of s) {
    let c = B58_ABC.indexOf(ch);
    for (let i = 0; i < d.length; i++) { c += d[i] * 58; d[i] = c & 0xff; c >>= 8; }
    while (c > 0) { d.push(c & 0xff); c >>= 8; }
  }
  const bytes = new Uint8Array(d.length);
  for (let i = 0; i < d.length; i++) bytes[i] = d[d.length - 1 - i];
  let start = 0;
  for (const ch of s) { if (ch !== "1") break; start++; }
  return bytes.slice(bytes.length - start - (d.length - start));
}

/* ── Borsh Reader ────────────────────────────────────────────────────────── */
export class BorshReader {
  private v: DataView;
  public o = 0;
  constructor(data: Uint8Array) { this.v = new DataView(data.buffer, data.byteOffset, data.byteLength); }
  u8()  { return this.v.getUint8(this.o++); }
  u16() { const n = this.v.getUint16(this.o, true); this.o += 2; return n; }
  u32() { const n = this.v.getUint32(this.o, true); this.o += 4; return n; }
  u64() { const lo = BigInt(this.v.getUint32(this.o, true)); const hi = BigInt(this.v.getUint32(this.o+4, true)); this.o += 8; return lo | (hi << 32n); }
  i64() { const lo = BigInt(this.v.getUint32(this.o, true)); const hi = BigInt(this.v.getInt32(this.o+4, true)); this.o += 8; return Number(lo | (hi << 32n)); }
  bool() { return this.u8() !== 0; }
  pubkey() { const b = new Uint8Array(this.v.buffer, this.v.byteOffset + this.o, 32); this.o += 32; return encodeBase58(b); }
  str()  { const len = this.u32(); const b = new Uint8Array(this.v.buffer, this.v.byteOffset + this.o, len); this.o += len; return new TextDecoder().decode(b); }
}

/* ── Borsh Writer ────────────────────────────────────────────────────────── */
export class BorshWriter {
  private b: number[] = [];
  u8(n: number)  { this.b.push(n & 0xff); }
  u32(n: number) { this.b.push(n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff); }
  u64(n: bigint) { this.u32(Number(n & 0xFFFFFFFFn)); this.u32(Number(n >> 32n)); }
  i64(n: number) { this.u64(BigInt(n)); }
  bool(b: boolean){ this.u8(b ? 1 : 0); }
  str(s: string)  { const b = new TextEncoder().encode(s); this.u32(b.length); this.b.push(...b); }
  bytes() { return new Uint8Array(this.b); }
}

/* ── Discriminators (SHA-256("account:Name" or "global:ixName")[0:8]) ────── */
const _cache = new Map<string, Uint8Array>();
async function disc(preimage: string): Promise<Uint8Array> {
  if (_cache.has(preimage)) return _cache.get(preimage)!;
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(preimage));
  const d = new Uint8Array(h).slice(0, 8);
  _cache.set(preimage, d);
  return d;
}
export const DISC = {
  Campaign:       () => disc("account:Campaign"),
  CreatorProfile: () => disc("account:CreatorProfile"),
  Contribution:   () => disc("account:Contribution"),
  GlobalState:    () => disc("account:GlobalState"),
};
export const IX = {
  initialize:      () => disc("global:initialize"),
  createProfile:   () => disc("global:create_profile"),
  updateProfile:   () => disc("global:update_profile"),
  createCampaign:  () => disc("global:create_campaign"),
  pledge:          () => disc("global:pledge"),
  withdraw:        () => disc("global:withdraw"),
  refund:          () => disc("global:refund"),
  closeCampaign:   () => disc("global:close_campaign"),
  pausePlatform:   () => disc("global:pause_platform"),
  unpausePlatform: () => disc("global:unpause_platform"),
  featureCampaign: () => disc("global:feature_campaign"),
  verifyCreator:   () => disc("global:verify_creator"),
  updateConfig:    () => disc("global:update_config"),
};

/* ── Disc as base58 for memcmp filter ────────────────────────────────────── */
export async function discBase58(fn: () => Promise<Uint8Array>): Promise<string> {
  return encodeBase58(await fn());
}

/* ── Account decoders ───────────────────────────────────────────────────── */
export function decodeCampaign(raw: Uint8Array, pubkey: string): Campaign {
  const r = new BorshReader(raw.slice(8));
  return {
    publicKey: pubkey, creator: r.pubkey(),
    title: r.str(), description: r.str(), imageUrl: r.str(),
    category: r.u8(), goal: r.u64(), pledgedAmount: r.u64(),
    backerCount: r.u32(), deadline: r.i64(), status: r.u8(),
    isFeatured: r.bool(), createdAt: r.i64(), campaignId: r.u64(),
  };
}
export function decodeProfile(raw: Uint8Array, pubkey: string): CreatorProfile {
  const r = new BorshReader(raw.slice(8));
  return {
    publicKey: pubkey, owner: r.pubkey(),
    name: r.str(), bio: r.str(), avatarUrl: r.str(), twitter: r.str(),
    isVerified: r.bool(), campaignsCreated: r.u32(),
    totalRaised: r.u64(), createdAt: r.i64(),
  };
}
export function decodeContribution(raw: Uint8Array, pubkey: string): Contribution {
  const r = new BorshReader(raw.slice(8));
  return {
    publicKey: pubkey, campaign: r.pubkey(), backer: r.pubkey(),
    amount: r.u64(), pledgedAt: r.i64(), refunded: r.bool(),
  };
}
export function decodeGlobalState(raw: Uint8Array): GlobalState {
  const r = new BorshReader(raw.slice(8));
  return {
    authority: r.pubkey(), feeBasisPoints: r.u16(),
    totalCampaigns: r.u64(), totalRaised: r.u64(), isPaused: r.bool(),
  };
}

/* ── PDA derivation (sync, using findProgramAddressSync-style logic) ─────── */
async function findPda(seeds: Uint8Array[]): Promise<[string, number]> {
  const { getProgramDerivedAddress } = await import("@solana/kit");
  const [addr, bump] = await getProgramDerivedAddress({
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    seeds,
  });
  return [addr as string, bump];
}
export const GLOBAL_STATE_SEED = new TextEncoder().encode("global_state");
export async function getGlobalStatePda() { return findPda([GLOBAL_STATE_SEED]); }
export async function getProfilePda(owner: string) {
  return findPda([new TextEncoder().encode("creator_profile"), decodeBase58(owner)]);
}
export async function getCampaignPda(creator: string, id: bigint) {
  const idBytes = new Uint8Array(8);
  new DataView(idBytes.buffer).setBigUint64(0, id, true);
  return findPda([new TextEncoder().encode("campaign"), decodeBase58(creator), idBytes]);
}
export async function getVaultPda(campaign: string) {
  return findPda([new TextEncoder().encode("campaign_vault"), decodeBase58(campaign)]);
}
export async function getContributionPda(campaign: string, backer: string) {
  return findPda([new TextEncoder().encode("contribution"), decodeBase58(campaign), decodeBase58(backer)]);
}

/* ── Instruction builders ───────────────────────────────────────────────── */
import type { IInstruction, IAccountMeta } from "@solana/kit";
import { AccountRole } from "@solana/kit";

const SYSTEM_PROGRAM = "11111111111111111111111111111111";
function W(addr: string): IAccountMeta { return { address: addr as import("@solana/kit").Address, role: AccountRole.WRITABLE }; }
function R2(addr: string): IAccountMeta { return { address: addr as import("@solana/kit").Address, role: AccountRole.READONLY }; }
function WS(addr: string): IAccountMeta { return { address: addr as import("@solana/kit").Address, role: AccountRole.WRITABLE_SIGNER }; }

export async function buildCreateCampaignIx(
  creator: string, globalStatePda: string, campaignCount: bigint,
  args: { title: string; description: string; imageUrl: string; category: number; goal: bigint; deadlineSecs: number }
): Promise<IInstruction> {
  const [campaignPda] = await getCampaignPda(creator, campaignCount);
  const [vaultPda] = await getVaultPda(campaignPda);
  const w = new BorshWriter();
  w.str(args.title); w.str(args.description); w.str(args.imageUrl);
  w.u8(args.category); w.u64(args.goal); w.i64(args.deadlineSecs);
  const data = new Uint8Array([...await IX.createCampaign(), ...w.bytes()]);
  return {
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    accounts: [WS(creator), W(campaignPda), R2(vaultPda), W(globalStatePda), R2(SYSTEM_PROGRAM)],
    data,
  };
}

export async function buildPledgeIx(
  backer: string, campaign: Campaign, globalStatePda: string, amount: bigint
): Promise<IInstruction> {
  const [contributionPda] = await getContributionPda(campaign.publicKey, backer);
  const [vaultPda] = await getVaultPda(campaign.publicKey);
  const w = new BorshWriter(); w.u64(amount);
  const data = new Uint8Array([...await IX.pledge(), ...w.bytes()]);
  return {
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    accounts: [WS(backer), W(campaign.publicKey), W(contributionPda), W(vaultPda), R2(globalStatePda), R2(SYSTEM_PROGRAM)],
    data,
  };
}

export async function buildWithdrawIx(
  creator: string, campaign: Campaign, globalStatePda: string, authority: string
): Promise<IInstruction> {
  const [vaultPda] = await getVaultPda(campaign.publicKey);
  const data = await IX.withdraw();
  return {
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    accounts: [WS(creator), W(campaign.publicKey), W(vaultPda), W(globalStatePda), W(authority), R2(SYSTEM_PROGRAM)],
    data,
  };
}

export async function buildRefundIx(
  backer: string, campaign: Campaign
): Promise<IInstruction> {
  const [contributionPda] = await getContributionPda(campaign.publicKey, backer);
  const [vaultPda] = await getVaultPda(campaign.publicKey);
  const data = await IX.refund();
  return {
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    accounts: [WS(backer), R2(campaign.publicKey), W(contributionPda), W(vaultPda), R2(SYSTEM_PROGRAM)],
    data,
  };
}

export async function buildCreateProfileIx(
  signer: string, args: { name: string; bio: string; avatarUrl: string; twitter: string }
): Promise<IInstruction> {
  const [profilePda] = await getProfilePda(signer);
  const w = new BorshWriter();
  w.str(args.name); w.str(args.bio); w.str(args.avatarUrl); w.str(args.twitter);
  const data = new Uint8Array([...await IX.createProfile(), ...w.bytes()]);
  return {
    programAddress: PROGRAM_ID as import("@solana/kit").Address,
    accounts: [WS(signer), W(profilePda), R2(SYSTEM_PROGRAM)],
    data,
  };
}
