"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusTimeline from "../_components/StatusTimeline";

type RequestDetail = {
  id: string;
  status: string;
  quantityRequested: string;
  proposedPricePerUnit: string;
  currency: string;
  proposedPickupTime: string | null;
  pickupLocationText: string | null;
  pickupNotes: string | null;
  buyerMessage: string | null;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
  produce: {
    id: string;
    name: string;
    quantityAvailable: string;
    quantityUnit: string;
    pricePerUnit: string;
    currency: string;
    availableUntil: string;
    status: string;
    locationText: string;
    city: string | null;
    category: { name: string } | null;
  } | null;
  buyer: {
    id: string;
    name: string;
    businessName: string | null;
    city: string | null;
    phone: string | null;
  } | null;
};

export default function SellerRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<RequestDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/seller/requests/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setReq(data.request);
        else setNotFound(true);
      });
  }, [params.id]);

  async function doAction(action: "accept" | "reject" | "complete") {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    setActing(action);
    setError(null);
    const res = await fetch(`/api/dashboard/seller/requests/${params.id}/${action}`, { method: "POST" });
    const data = await res.json();
    setActing(null);
    if (!data.ok) {
      const messages: Record<string, string> = {
        CANNOT_ACCEPT: "This request cannot be accepted (it's no longer PENDING or produce is not AVAILABLE).",
        CANNOT_REJECT: "This request cannot be rejected (it's no longer PENDING).",
        CANNOT_COMPLETE: "This request cannot be completed (it's not in ACCEPTED state).",
        PRODUCE_NOT_AVAILABLE: "The produce is no longer available (reserved, sold, or expired).",
      };
      setError(messages[data.error] || data.detail || `Failed to ${action} request.`);
      return;
    }
    setReq(data.request);
  }

  if (notFound) return <div className="py-6 px-4">Request not found. <Link href="/dashboard/seller/requests" className="text-sage hover:underline">Back to requests</Link></div>;
  if (!req) return <div className="text-center py-8">Loading…</div>;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "hl-pill-terracotta",
      ACCEPTED: "hl-pill-sage",
      COMPLETED: "hl-pill-sage",
      REJECTED: "hl-pill-gray",
      CANCELLED: "hl-pill-gray",
    };
    return map[status] || "hl-pill-gray";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/dashboard/seller/requests" className="text-sm text-muted underline hover:text-sage mb-3 inline-block">← Back to requests</Link>

      <div className="hl-card p-6 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{req.produce?.name || "Unknown produce"}</h1>
            {req.produce?.category && <div className="text-sm text-muted">{req.produce.category.name}</div>}
          </div>
          <span className={`hl-pill ${statusBadge(req.status)}`}>
            {req.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Quantity requested</div>
            <div className="font-semibold text-charcoal">{req.quantityRequested} {req.produce?.quantityUnit}</div>
          </div>
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Proposed price</div>
            <div className="font-semibold text-charcoal">{req.currency} {req.proposedPricePerUnit}/{req.produce?.quantityUnit}</div>
            {req.produce && Number(req.proposedPricePerUnit) !== Number(req.produce.pricePerUnit) && (
              <div className="text-xs text-terracotta-tint-text mt-1">Seller's list price: {req.produce.currency} {req.produce.pricePerUnit}</div>
            )}
          </div>
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Total value</div>
            <div className="font-semibold text-charcoal">{req.currency} {(Number(req.quantityRequested) * Number(req.proposedPricePerUnit)).toFixed(2)}</div>
          </div>
          {req.proposedPickupTime && (
            <div className="bg-surface-container p-3 rounded-lg sm:col-span-2">
              <div className="text-xs text-muted">Proposed pickup</div>
              <div className="font-semibold text-sm text-charcoal">{new Date(req.proposedPickupTime).toLocaleString()}</div>
            </div>
          )}
          {req.pickupLocationText && (
            <div className="bg-surface-container p-3 rounded-lg">
              <div className="text-xs text-muted">Pickup location</div>
              <div className="font-semibold text-sm text-charcoal">{req.pickupLocationText}</div>
            </div>
          )}
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Produce status</div>
            <div className="font-semibold text-sm text-charcoal">{req.produce?.status}</div>
          </div>
        </div>

        {req.pickupNotes && (
          <div className="mb-3">
            <div className="text-sm font-semibold mb-1 text-charcoal">Pickup notes (from buyer)</div>
            <p className="text-sm text-charcoal bg-surface-container p-2 rounded-lg">{req.pickupNotes}</p>
          </div>
        )}

        {req.buyerMessage && (
          <div className="mb-3">
            <div className="text-sm font-semibold mb-1 text-charcoal">Message from buyer</div>
            <p className="text-sm text-charcoal bg-surface-container p-2 rounded-lg">{req.buyerMessage}</p>
          </div>
        )}

        {req.buyer && (
          <div className="p-3 bg-sage-tint rounded-lg mb-4">
            <div className="text-sm font-semibold mb-1 text-sage-tint-text">Buyer</div>
            <div className="text-sm text-charcoal">
              {req.buyer.businessName || req.buyer.name}
              {req.buyer.city ? ` · ${req.buyer.city}` : ""}
              {req.buyer.phone ? ` · ${req.buyer.phone}` : ""}
            </div>
          </div>
        )}

        {error && <div className="text-error text-sm mb-3">{error}</div>}

        {req.status === "PENDING" && (
          <div className="flex gap-3">
            <button
              onClick={() => doAction("accept")}
              disabled={acting !== null}
              className="hl-btn-primary"
            >
              {acting === "accept" ? "Accepting…" : "Accept Request"}
            </button>
            <button
              onClick={() => doAction("reject")}
              disabled={acting !== null}
              className="hl-btn-urgent"
            >
              {acting === "reject" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        )}

        {req.status === "ACCEPTED" && (
          <div className="flex gap-3">
            <button
              onClick={() => doAction("complete")}
              disabled={acting !== null}
              className="hl-btn-primary"
            >
              {acting === "complete" ? "Completing…" : "Mark as Completed"}
            </button>
            <p className="text-xs text-muted self-center">Produce is RESERVED. Waiting for pickup, then mark as completed.</p>
          </div>
        )}

        {(req.status === "REJECTED" || req.status === "CANCELLED" || req.status === "COMPLETED") && (
          <p className="text-sm text-muted">This request is in a terminal state. No further actions possible.</p>
        )}
      </div>

      <div className="hl-card p-6">
        <h2 className="text-lg font-semibold mb-4 text-charcoal">Status Timeline</h2>
        <StatusTimeline
          status={req.status as "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED"}
          createdAt={req.createdAt}
          respondedAt={req.respondedAt}
          completedAt={req.completedAt}
        />
      </div>
    </div>
  );
}
