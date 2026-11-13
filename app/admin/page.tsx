"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  users: { total: number; byType: Record<string, number> };
  produce: { total: number; byStatus: Record<string, number> };
  requests: { total: number; byStatus: Record<string, number> };
  today: { newUsers: number; newProduce: number; newRequests: number };
  health: { expiredNotMarkedCount: number };
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expireResult, setExpireResult] = useState<string | null>(null);
  const [expiring, setExpiring] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
        setLoading(false);
      });
  }, []);

  async function runExpire() {
    if (!confirm("Run auto-expire now? This will mark expired produce as EXPIRED and auto-reject pending requests on them.")) return;
    setExpiring(true);
    const res = await fetch("/api/admin/run-expire", { method: "POST" });
    const data = await res.json();
    setExpiring(false);
    if (data.ok) {
      setExpireResult(`Marked ${data.result.expiredProduce} produce as EXPIRED, auto-rejected ${data.result.rejectedRequests} pending requests.`);
      fetch("/api/admin/stats").then(r => r.json()).then(d => { if (d.ok) setStats(d.stats); });
    } else {
      setExpireResult("Failed to run auto-expire.");
    }
  }

  if (loading) return <div className="text-center py-8">Loading…</div>;
  if (!stats) return <div className="text-center py-8 text-muted">Failed to load stats.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-charcoal">Admin Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Total Users</div>
          <div className="text-2xl font-bold text-charcoal">{stats.users.total}</div>
          <div className="text-xs text-muted mt-1">
            {stats.users.byType.SELLER} sellers · {stats.users.byType.BUYER} buyers · {stats.users.byType.LOGISTICS} logistics
          </div>
        </div>
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Total Produce</div>
          <div className="text-2xl font-bold text-charcoal">{stats.produce.total}</div>
          <div className="text-xs text-muted mt-1">
            {stats.produce.byStatus.AVAILABLE} avail · {stats.produce.byStatus.RESERVED} reserved · {stats.produce.byStatus.SOLD} sold · {stats.produce.byStatus.EXPIRED} expired
          </div>
        </div>
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Total Requests</div>
          <div className="text-2xl font-bold text-charcoal">{stats.requests.total}</div>
          <div className="text-xs text-muted mt-1">
            {stats.requests.byStatus.PENDING} pending · {stats.requests.byStatus.ACCEPTED} accepted · {stats.requests.byStatus.COMPLETED} completed
          </div>
        </div>
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Today's Activity</div>
          <div className="text-2xl font-bold text-charcoal">{stats.today.newUsers + stats.today.newProduce + stats.today.newRequests}</div>
          <div className="text-xs text-muted mt-1">
            {stats.today.newUsers} users · {stats.today.newProduce} produce · {stats.today.newRequests} requests
          </div>
        </div>
      </div>

      <div className="hl-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-charcoal">Auto-Expire Status</h2>
          <button onClick={runExpire} disabled={expiring} className="hl-btn-ghost text-sm">
            {expiring ? "Running..." : "Run now"}
          </button>
        </div>
        {stats.health.expiredNotMarkedCount > 0 ? (
          <p className="text-terracotta-tint-text text-sm">
            ⚠ {stats.health.expiredNotMarkedCount} produce items are past their availableUntil but still marked AVAILABLE. Run auto-expire to fix.
          </p>
        ) : (
          <p className="text-sage text-sm">✓ All produce statuses are up to date.</p>
        )}
        {expireResult && <p className="text-sm text-charcoal mt-2">{expireResult}</p>}
      </div>

      <div className="flex gap-3">
        <Link href="/admin/users" className="hl-btn-ghost">Manage Users</Link>
        <Link href="/admin/produce" className="hl-btn-ghost">Manage Produce</Link>
        <Link href="/admin/requests" className="hl-btn-ghost">Manage Requests</Link>
      </div>
    </div>
  );
}
