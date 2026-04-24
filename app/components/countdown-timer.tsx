"use client";

import { useEffect, useState } from "react";
import { formatCountdown, secsRemaining } from "../lib/utils";

interface Props {
  deadline: number;
  className?: string;
}

export function CountdownTimer({ deadline, className = "" }: Props) {
  // Initialize to null so SSR renders a neutral placeholder — avoids hydration mismatch
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    // Set real value immediately after mount, then tick every second
    setSecs(secsRemaining(deadline));
    const id = setInterval(() => setSecs(secsRemaining(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // Neutral placeholder during SSR / before hydration
  if (secs === null) {
    return (
      <span className={className} style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
        —
      </span>
    );
  }

  const ended = secs <= 0;
  return (
    <span
      className={className}
      style={{
        color: ended ? "var(--fg-3)" : secs < 86400 ? "var(--danger)" : "var(--fg-2)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {ended ? "Ended" : formatCountdown(secs)}
    </span>
  );
}
