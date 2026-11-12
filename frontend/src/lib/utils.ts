import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFaviconUrl(domain: string): string {
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=64`;
}

export function getScoreBadgeStyles(score: number) {
  if (score >= 80) {
    return {
      bg: "bg-emerald-950/60",
      text: "text-emerald-400",
      border: "border-emerald-800/60",
      dot: "bg-emerald-400",
      progress: "bg-emerald-500",
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-amber-950/60",
      text: "text-amber-400",
      border: "border-amber-800/60",
      dot: "bg-amber-400",
      progress: "bg-amber-500",
    };
  }
  return {
    bg: "bg-rose-950/60",
    text: "text-rose-400",
    border: "border-rose-800/60",
    dot: "bg-rose-400",
    progress: "bg-rose-500",
  };
}

export function getTierBadgeStyles(tier: string) {
  if (tier.includes("Tier 1")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  }
  if (tier.includes("Tier 2")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }
  return "bg-rose-500/10 text-rose-400 border-rose-500/30";
}
