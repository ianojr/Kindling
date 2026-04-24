"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CampaignRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/explore");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
    </div>
  );
}
