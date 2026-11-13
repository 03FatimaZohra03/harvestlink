"use client";

import { useEffect, useState } from "react";

type Props = {
  availableUntil: string; // ISO datetime string
  variant?: "badge" | "large"; // badge = small pill, large = big display on detail page
};

function formatDuration(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m ${seconds}s left`;
}

export default function LiveCountdown({ availableUntil, variant = "badge" }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const ms = new Date(availableUntil).getTime() - now;
  const isExpired = ms <= 0;
  const isUrgent = !isExpired && ms < 24 * 60 * 60 * 1000; // <24h
  const label = formatDuration(ms);

  if (variant === "large") {
    return (
      <div className={`p-3 rounded-lg ${isUrgent ? "bg-terracotta-tint" : "bg-surface-container"}`}>
        <div className={`text-xs ${isUrgent ? "text-terracotta-tint-text" : "text-muted"}`}>Available for</div>
        <div className={`font-semibold text-lg ${isUrgent ? "text-terracotta" : "text-charcoal"}`}>
          {label}
        </div>
      </div>
    );
  }

  return (
    <span className={`hl-pill ${isUrgent ? "hl-pill-terracotta" : "hl-pill-sage"}`}>
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        schedule
      </span>
      {label}
    </span>
  );
}
