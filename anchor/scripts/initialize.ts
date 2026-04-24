/**
 * One-time bootstrap script: initializes the Kindling GlobalState PDA on-chain.
 * Run once from the platform authority wallet:
 *   cd anchor && anchor run initialize
 *
 * ANCHOR_PROVIDER_URL and ANCHOR_WALLET are set automatically by `anchor run`
 * based on [provider] in Anchor.toml.
 */
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import os from "os";

// ── Config ───────────────────────────────────────────────────────────────────
const PROGRAM_ID   = new PublicKey("JAL6KieMTfamqTRyPMx5CLUnDUU7GVaV7aSaEJhYSHHt");
const CLUSTER_URL  = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
const WALLET_PATH  = process.env.ANCHOR_WALLET      ?? path.join(os.homedir(), ".config", "solana", "id.json");
const FEE_BPS      = 100; // 100 basis points = 1%

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadKeypair(p: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

/** Compute SHA-256("global:initialize")[0:8] — the Anchor instruction discriminator */
async function ixDisc(name: string): Promise<Buffer> {
  const preimage = `global:${name}`;
  const encoded  = new TextEncoder().encode(preimage);
  const hash     = await crypto.subtle.digest("SHA-256", encoded);
  return Buffer.from(new Uint8Array(hash).slice(0, 8));
}

/** Encode u16 little-endian */
function encodeU16(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  const authority  = loadKeypair(WALLET_PATH);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Kindling — Initialize Platform");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Program ID  :", PROGRAM_ID.toBase58());
  console.log("  Cluster     :", CLUSTER_URL);
  console.log("  Authority   :", authority.publicKey.toBase58());
  console.log("  Fee         :", `${FEE_BPS / 100}% (${FEE_BPS} bps)`);

  // Derive GlobalState PDA
  const [globalStatePda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_state")],
    PROGRAM_ID
  );
  console.log("  GlobalState :", globalStatePda.toBase58(), `(bump ${bump})`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(globalStatePda);
  if (existing !== null) {
    console.log("\n✅ Platform already initialized — GlobalState exists.");
    console.log("   Nothing to do.");
    return;
  }

  // Build instruction data: discriminator + fee_basis_points (u16)
  const disc = await ixDisc("initialize");
  const data = Buffer.concat([disc, encodeU16(FEE_BPS)]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true,  isWritable: true  }, // authority
      { pubkey: globalStatePda,      isSigner: false, isWritable: true  }, // global_state
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ],
    data,
  });

  console.log("\n⏳ Sending initialize transaction…");
  const tx  = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [authority], {
    commitment: "confirmed",
  });

  console.log("\n🎉 Platform initialized successfully!");
  console.log("   Signature :", sig);
  console.log("   Explorer  :", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
