"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveCountdown from "../../../_components/LiveCountdown";

type Listing = {
  id: string;
  name: string;
  status: string;
  quantityAvailable: string;
  quantityUnit: string;
  pricePerUnit: string;
  currency: string;
  availableUntil: string;
  categoryId: string;
  category?: { name: string };
};

export default function SellerListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/seller/produce")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setListings(data.produce);
        setLoading(false);
      });
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Mark this listing as expired? This cannot be undone.")) return;
    const res = await fetch(`/api/dashboard/seller/produce/${id}`, { method: "DELETE" });
    if (res.ok) {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "EXPIRED" } : l));
    }
  }

  if (loading) return <div className="text-center py-8">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link href="/dashboard/seller/add" className="hl-btn-primary">Add Produce</Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-muted">No listings yet. Click "Add Produce" to create your first listing.</div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="hl-card p-4 flex justify-between items-start hl-card-hover">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-charcoal">{l.name}</span>
                  <span className={`hl-pill hl-status-${l.status.toLowerCase()}`}>{l.status}</span>
                </div>
                <div className="text-sm text-muted">
                  {l.quantityAvailable} {l.quantityUnit} × {l.currency} {l.pricePerUnit}/{l.quantityUnit}
                  {l.category ? ` · ${l.category.name}` : null}
                </div>
                <div className="text-xs text-muted mt-1">
                  Available until: {new Date(l.availableUntil).toLocaleString()}
                </div>
                <div className="mt-2">
                  <LiveCountdown availableUntil={l.availableUntil} />
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/seller/listings/${l.id}/edit`} className="text-sm text-muted underline hover:text-sage">Edit</Link>
                {l.status !== "EXPIRED" && (
                  <button onClick={() => onDelete(l.id)} className="text-sm text-error underline hover:underline">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
