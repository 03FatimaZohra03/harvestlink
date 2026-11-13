"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RequestItem = {
  id: string;
  status: string;
  quantityRequested: string;
  proposedPricePerUnit: string;
  currency: string;
  createdAt: string;
  produce: {
    id: string;
    name: string;
    quantityUnit: string;
    city: string | null;
    locationText: string;
    category: { name: string } | null;
  } | null;
};

type Stats = {
  PENDING: number;
  ACCEPTED: number;
  REJECTED: number;
  CANCELLED: number;
  COMPLETED: number;
};

const statusPill = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "hl-pill-terracotta",
    ACCEPTED: "hl-pill-sage",
    REJECTED: "hl-pill-gray",
    CANCELLED: "hl-pill-gray",
    COMPLETED: "hl-pill-sage",
  };
  return map[status] || "hl-pill-gray";
};

export default function BuyerDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/buyer/requests")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setRequests(data.requests);
          setStats(data.stats);
        }
        setLoading(false);
      });
  }, []);

  async function onCancel(id: string) {
    if (!confirm("Cancel this request? This cannot be undone.")) return;
    const res = await fetch(`/api/dashboard/buyer/requests/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "CANCELLED" } : r));
        if (stats) {
          setStats({
            ...stats,
            PENDING: Math.max(0, stats.PENDING - 1),
            CANCELLED: stats.CANCELLED + 1,
          });
        }
      }
    }
  }

  if (loading) return <div className="text-center py-8">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Requests</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          <div className="hl-card p-4">
            <div className="text-xs text-muted">Pending</div>
            <div className="text-xl font-bold text-terracotta-tint-text">{stats.PENDING}</div>
          </div>
          <div className="hl-card p-4">
            <div className="text-xs text-muted">Accepted</div>
            <div className="text-xl font-bold text-sage-tint-text">{stats.ACCEPTED}</div>
          </div>
          <div className="hl-card p-4">
            <div className="text-xs text-muted">Completed</div>
            <div className="text-xl font-bold text-sage-tint-text">{stats.COMPLETED}</div>
          </div>
          <div className="hl-card p-4">
            <div className="text-xs text-muted">Rejected</div>
            <div className="text-xl font-bold text-error">{stats.REJECTED}</div>
          </div>
          <div className="hl-card p-4">
            <div className="text-xs text-muted">Cancelled</div>
            <div className="text-xl font-bold text-muted">{stats.CANCELLED}</div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <Link href="/browse" className="hl-btn-primary">Browse Produce</Link>
        <Link href="/dashboard/buyer/requests" className="hl-btn-ghost">View All Requests</Link>
      </div>

      <h2 className="text-xl font-semibold mb-3 text-charcoal">Recent Requests</h2>

      {requests.length === 0 ? (
        <div className="text-muted">No requests yet. <Link href="/browse" className="text-sage hover:underline">Browse produce</Link> to send your first request.</div>
      ) : (
        <div className="space-y-3">
          {requests.slice(0, 5).map((r) => (
            <div key={r.id} className="hl-card p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="font-semibold text-charcoal">{r.produce?.name || "Unknown produce"}</span>
                  {r.produce?.category && (
                    <span className="text-xs text-muted ml-2">{r.produce.category.name}</span>
                  )}
                </div>
                <span className={`hl-pill ${statusPill(r.status)}`}>{r.status}</span>
              </div>
              <div className="text-sm text-muted mb-1">
                {r.quantityRequested} {r.produce?.quantityUnit} @ {r.currency} {r.proposedPricePerUnit}/{r.produce?.quantityUnit}
              </div>
              <div className="text-xs text-muted mt-1">
                {r.produce?.city || r.produce?.locationText} · Requested {new Date(r.createdAt).toLocaleDateString()}
              </div>
              {(r.status === "PENDING" || r.status === "ACCEPTED") && (
                <button onClick={() => onCancel(r.id)} className="text-xs text-error underline mt-2 hover:underline">Cancel request</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
