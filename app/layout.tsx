import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/providers";

export const metadata: Metadata = {
  title: { default: "Kindling — Fund What Matters", template: "%s | Kindling" },
  description: "Decentralized crowdfunding on Solana. Back projects, support creators, earn rewards — all on-chain.",
  keywords: ["Solana", "crowdfunding", "Web3", "DeFi", "blockchain"],
  openGraph: {
    title: "Kindling — Fund What Matters",
    description: "Decentralized crowdfunding on Solana.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
