"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LiveCountdown from "../../_components/LiveCountdown";

type Produce = {
  id: string;
  name: string;
  description?: string | null;
  quantityAvailable: string;
  quantityUnit: string;
  pricePerUnit: string;
  currency: string;
  locationText: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  harvestDate?: string | null;
  availableUntil: string;
  status: string;
  pickupNotes?: string | null;
  categoryId: string;
  category?: { name: string };
  seller?: { name: string; businessName?: string | null; city?: string | null; state?: string | null; phone?: string | null };
  isOwner?: boolean;
  canRequest?: boolean;
};

export default function ProduceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [produce, setProduce] = useState<Produce | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/produce/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProduce(data.produce);
        else setNotFound(true);
      });
  }, [params.id]);

  if (notFound) return <div className="max-w-3xl mx-auto py-6 px-4">Produce not found or no longer available.</div>;
  if (!produce) return <div className="max-w-3xl mx-auto py-6 px-4">Loading…</div>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/browse" className="text-sm text-muted hover:underline mb-3 inline-block">← Back to browse</Link>

      <div className="hl-card p-6 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">{produce.name}</h1>
            {produce.category && <div className="text-sm text-muted mt-1">{produce.category.name}</div>}
          </div>
          <span className={`hl-pill hl-status-${produce.status.toLowerCase()}`}>
            {produce.status}
          </span>
        </div>

        {produce.description && (
          <p className="text-charcoal mb-4">{produce.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Price</div>
            <div className="font-semibold text-charcoal">{produce.currency} {produce.pricePerUnit} / {produce.quantityUnit}</div>
          </div>
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Quantity available</div>
            <div className="font-semibold text-charcoal">{produce.quantityAvailable} {produce.quantityUnit}</div>
          </div>
          <div className="bg-surface-container p-3 rounded-lg">
            <div className="text-xs text-muted">Location</div>
            <div className="font-semibold text-charcoal">{produce.city || produce.locationText}{produce.state ? `, ${produce.state}` : ""}</div>
          </div>
          <div className="bg-surface-container p-3 rounded-lg">
            <LiveCountdown availableUntil={produce.availableUntil} variant="large" />
          </div>
        </div>

        {produce.pickupNotes && (
          <div className="mb-4">
            <div className="text-sm font-semibold mb-1 text-charcoal">Pickup notes</div>
            <p className="text-charcoal text-sm">{produce.pickupNotes}</p>
          </div>
        )}

        {produce.seller && (
          <div className="mb-6 p-3 bg-sage-tint rounded-lg">
            <div className="text-sm font-semibold mb-1 text-sage-tint-text">Seller</div>
            <div className="text-sm text-charcoal">
              {produce.seller.businessName || produce.seller.name}
              {produce.seller.city ? ` · ${produce.seller.city}` : ""}
            </div>
          </div>
        )}

        {produce.isOwner ? (
          <Link
            href={`/dashboard/seller/listings/${produce.id}/edit`}
            className="hl-btn-ghost inline-block"
          >
            Edit this listing
          </Link>
        ) : produce.canRequest ? (
          <Link
            href={`/produce/${produce.id}/request`}
            className="hl-btn-primary inline-block"
          >
            Send Request
          </Link>
        ) : (
          <button
            onClick={() => router.push("/login?next=" + encodeURIComponent(`/produce/${produce.id}`))}
            className="hl-btn-primary inline-block"
          >
            Log in to send a request
          </button>
        )}
      </div>
    </main>
  );
}
