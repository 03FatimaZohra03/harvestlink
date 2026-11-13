"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveCountdown from "../../../_components/LiveCountdown";

type RequestItem = {
  id: string;
  status: string;
  quantityRequested: string;
  proposedPricePerUnit: string;
  currency: string;
  createdAt: string;
  respondedAt: string | null;
  produce: {
    id: string;
    name: string;
    quantityUnit: string;
    availableUntil: string;
    status: string;
    category: { name: string } | null;
  } | null;
  buyer: {
    id: string;
    name: string;
    businessName: string | null;
    city: string | null;
  } | null;
};

type Stats = {
  PENDING: number;
  ACCEPTED: number;
  REJECTED: number;
  CANCELLED: number;
  COMPLETED: number;
};

export default function SellerRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/dashboard/seller/requests")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setRequests(data.requests);
          setStats(data.stats);
        }
        setLoading(false);
      });
  }, []);

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  if (loading) return <div className="text-center py-8">Loading…</div>;

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Buyer Requests</h1>
        <Link href="/dashboard/seller" className="text-sm text-muted underline hover:text-sage">Back to dashboard</Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
          <button onClick={() => setFilter("ALL")} className={`p-3 rounded-lg border text-left ${filter === "ALL" ? "border-sage bg-sage-tint" : "border-border-ghost bg-surface"}`}>
            <div className="text-xs text-muted">All</div>
            <div className="text-xl font-bold text-charcoal">{requests.length}</div>
          </button>
          <button onClick={() => setFilter("PENDING")} className={`p-3 rounded-lg border text-left ${filter === "PENDING" ? "border-terracotta bg-terracotta-tint" : "border-border-ghost bg-surface"}`}>
            <div className="text-xs text-muted">Pending</div>
            <div className="text-xl font-bold text-terracotta-tint-text">{stats.PENDING}</div>
          </button>
          <button onClick={() => setFilter("ACCEPTED")} className={`p-3 rounded-lg border text-left ${filter === "ACCEPTED" ? "border-sage bg-sage-tint" : "border-border-ghost bg-surface"}`}>
            <div className="text-xs text-muted">Accepted</div>
            <div className="text-xl font-bold text-sage-tint-text">{stats.ACCEPTED}</div>
          </button>
          <button onClick={() => setFilter("COMPLETED")} className={`p-3 rounded-lg border text-left ${filter === "COMPLETED" ? "border-sage bg-sage-tint" : "border-border-ghost bg-surface"}`}>
            <div className="text-xs text-muted">Completed</div>
            <div className="text-xl font-bold text-sage-tint-text">{stats.COMPLETED}</div>
          </button>
          <button onClick={() => setFilter("REJECTED")} className={`p-3 rounded-lg border text-left ${filter === "REJECTED" ? "border-border-ghost bg-surface-container-high" : "border-border-ghost bg-surface"}`}>
            <div className="text-xs text-muted">Rejected</div>
            <div className="text-xl font-bold text-muted">{stats.REJECTED}</div>
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-muted">No requests {filter !== "ALL" ? `with status ${filter}` : "yet"}.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/seller/requests/${r.id}`}
              className="hl-card p-4 hl-card-hover block"
            >
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
              <div className="text-xs text-muted">
                From: {r.buyer?.businessName || r.buyer?.name || "Unknown buyer"}
                {r.buyer?.city ? ` · ${r.buyer.city}` : ""}
                {" · "}Requested {new Date(r.createdAt).toLocaleDateString()}
              </div>
              {r.produce && (
                <div className="mt-2">
                  <LiveCountdown availableUntil={r.produce.availableUntil} />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
