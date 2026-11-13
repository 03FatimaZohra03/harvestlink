"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Produce = {
  id: string;
  name: string;
  quantityAvailable: string;
  quantityUnit: string;
  pricePerUnit: string;
  currency: string;
  locationText: string;
  city: string | null;
  availableUntil: string;
  status: string;
  canRequest: boolean;
  isOwner: boolean;
};

export default function SendRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [produce, setProduce] = useState<Produce | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/produce/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          if (data.error === "NOT_FOUND") setNotFound(true);
          else setForbidden(true);
          return;
        }
        if (!data.produce.canRequest) {
          setForbidden(true);
          return;
        }
        setProduce(data.produce);
      });
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const body = {
      produceId: params.id,
      quantityRequested: formData.get("quantityRequested"),
      proposedPricePerUnit: formData.get("proposedPricePerUnit"),
      proposedPickupTime: formData.get("proposedPickupTime") ? new Date(formData.get("proposedPickupTime") as string).toISOString() : "",
      pickupLocationText: formData.get("pickupLocationText") || undefined,
      pickupNotes: formData.get("pickupNotes") || undefined,
      buyerMessage: formData.get("buyerMessage") || undefined,
    };
    const res = await fetch("/api/dashboard/buyer/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      const messages: Record<string, string> = {
        VALIDATION: "Please check the form fields.",
        PRODUCE_NOT_FOUND: "This produce no longer exists.",
        PRODUCE_NOT_AVAILABLE: "This produce is no longer available.",
        CANNOT_REQUEST_OWN_PRODUCE: "You cannot request your own produce.",
        QUANTITY_EXCEEDS_AVAILABLE: "Requested quantity exceeds available amount.",
        PICKUP_TIME_IN_PAST: "Pickup time must be in the future.",
        PICKUP_AFTER_EXPIRY: "Pickup time must be before the produce expires.",
        PENDING_REQUEST_EXISTS: "You already have a pending request. Cancel it first.",
      };
      setError(messages[data.error] || data.detail || "Failed to send request.");
      return;
    }
    router.push("/dashboard/buyer/requests");
    router.refresh();
  }

  if (notFound) return <div className="max-w-2xl mx-auto py-6 px-4">Produce not found.</div>;
  if (forbidden) return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <p className="text-charcoal">You cannot send a request for this produce. This may be because:</p>
      <ul className="list-disc ml-6 mt-2 text-muted text-sm">
        <li>You already have a pending request for this produce</li>
        <li>The produce is no longer available</li>
        <li>You are not logged in as a buyer</li>
      </ul>
      <Link href={`/produce/${params.id}`} className="text-sage hover:underline mt-3 inline-block">← Back to produce</Link>
    </div>
  );
  if (!produce) return <div className="max-w-2xl mx-auto py-6 px-4">Loading…</div>;

  const availUntilLocal = new Date(produce.availableUntil).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={`/produce/${params.id}`} className="text-sm text-muted hover:underline mb-3 inline-block">← Back to {produce.name}</Link>

      <h1 className="text-2xl font-bold mb-1 text-charcoal">Send Request</h1>
      <p className="text-sm text-muted mb-4">
        For: <span className="font-semibold text-charcoal">{produce.name}</span> · {produce.currency} {produce.pricePerUnit}/{produce.quantityUnit} · {produce.quantityAvailable} {produce.quantityUnit} available
      </p>

      <form onSubmit={onSubmit} className="space-y-4 hl-card p-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Quantity requested ({produce.quantityUnit}) *</label>
          <input
            name="quantityRequested"
            type="number"
            step="0.01"
            min="0.01"
            max={produce.quantityAvailable}
            required
            className="hl-input"
            placeholder={`Max ${produce.quantityAvailable} ${produce.quantityUnit}`}
          />
          <p className="text-xs text-muted mt-1">{produce.quantityAvailable} {produce.quantityUnit} available</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Proposed price per {produce.quantityUnit} (INR) *</label>
          <input
            name="proposedPricePerUnit"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={produce.pricePerUnit}
            className="hl-input"
          />
          <p className="text-xs text-muted mt-1">Seller's listed price: {produce.currency} {produce.pricePerUnit}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Proposed pickup time</label>
          <input
            name="proposedPickupTime"
            type="datetime-local"
            className="hl-input"
          />
          <p className="text-xs text-muted mt-1">Must be before produce expires ({new Date(produce.availableUntil).toLocaleString()})</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Pickup location</label>
          <input
            name="pickupLocationText"
            maxLength={200}
            className="hl-input"
            defaultValue={produce.locationText}
            placeholder="Pickup address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Pickup notes</label>
          <textarea
            name="pickupNotes"
            maxLength={500}
            rows={2}
            className="hl-input"
            placeholder="e.g. Will bring my own transport"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Message to seller</label>
          <textarea
            name="buyerMessage"
            maxLength={1000}
            rows={3}
            className="hl-input"
            placeholder="Optional message to the seller"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="hl-btn-primary">
            {submitting ? "Sending…" : "Send Request"}
          </button>
          <button type="button" onClick={() => router.back()} className="hl-btn-ghost">Cancel</button>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>
    </div>
  );
}
