"use client";

import { CATEGORY_LABELS } from "../lib/types";
import { CATEGORY_COLORS } from "../lib/constants";

interface Props {
  category: number;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const label = CATEGORY_LABELS[category] ?? "Other";
  const color = CATEGORY_COLORS[category] ?? "bg-zinc-500/10 text-zinc-400";
  return (
    <span
      className={`badge ${color}`}
      style={{ fontSize: size === "md" ? "0.8rem" : "0.7rem" }}
    >
      {label}
    </span>
  );
}
