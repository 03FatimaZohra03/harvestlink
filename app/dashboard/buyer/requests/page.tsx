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
  proposedPickupTime: string | null;
  buyerMessage: string | null;
  createdAt: string;
  respondedAt: string | null;
  produce: {
    id: string;
    name: string;
    quantityUnit: string;
    city: string | null;
    locationText: string;
    availableUntil: string;
    status: string;
    category: { name: string } | null;
  } | null;
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

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/buyer/requests")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRequests(data.requests);
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
      }
    }
  }

  if (loading) return <div className="text-center py-8">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-charcoal">All My Requests</h1>
        <Link href="/browse" className="hl-btn-primary">Browse Produce</Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-muted">No requests yet. <Link href="/browse" className="text-sage hover:underline">Browse produce</Link> to send your first request.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="hl-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link href={`/produce/${r.produce?.id}`} className="font-semibold text-charcoal hover:underline">{r.produce?.name || "Unknown produce"}</Link>
                  {r.produce?.category && (
                    <span className="text-xs text-muted ml-2">{r.produce.category.name}</span>
                  )}
                </div>
                <span className={`hl-pill ${statusPill(r.status)}`}>{r.status}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted mb-2">
                <div>
                  <span className="text-xs text-muted">Quantity:</span> {r.quantityRequested} {r.produce?.quantityUnit}
                </div>
                <div>
                  <span className="text-xs text-muted">Proposed price:</span> {r.currency} {r.proposedPricePerUnit}/{r.produce?.quantityUnit}
                </div>
                <div>
                  <span className="text-xs text-muted">Requested:</span> {new Date(r.createdAt).toLocaleDateString()}
                </div>
                {r.proposedPickupTime && (
                  <div>
                    <span className="text-xs text-muted">Pickup:</span> {new Date(r.proposedPickupTime).toLocaleString()}
                  </div>
                )}
                {r.respondedAt && (
                  <div>
                    <span className="text-xs text-muted">Seller responded:</span> {new Date(r.respondedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              {r.buyerMessage && (
                <div className="text-sm text-charcoal bg-surface-container p-2 rounded-lg mb-2">
                  <span className="text-xs text-muted">Your message:</span> {r.buyerMessage}
                </div>
              )}
              {(r.status === "PENDING" || r.status === "ACCEPTED") && (
                <button onClick={() => onCancel(r.id)} className="text-sm text-error underline hover:underline">Cancel request</button>
              )}
              {r.produce && (
                <div className="mt-2">
                  <LiveCountdown availableUntil={r.produce.availableUntil} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
