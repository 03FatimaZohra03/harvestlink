"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
};

export default function SellerDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ email: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard/seller/produce").then((r) => r.json()),
    ]).then(([meData, prodData]) => {
      if (meData.ok) setMe(meData.user);
      if (prodData.ok) setListings(prodData.produce);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-8">Loading…</div>;

  const active = listings.filter((l) => l.status === "AVAILABLE").length;
  const expired = listings.filter((l) => l.status === "EXPIRED").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {me?.email}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Active listings</div>
          <div className="text-2xl font-bold text-sage-tint-text">{active}</div>
        </div>
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Expired listings</div>
          <div className="text-2xl font-bold text-muted">{expired}</div>
        </div>
        <div className="hl-card p-4">
          <div className="text-sm text-muted">Total listings</div>
          <div className="text-2xl font-bold text-charcoal">{listings.length}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/dashboard/seller/listings" className="hl-btn-primary">My Listings</Link>
        <Link href="/dashboard/seller/add" className="hl-btn-ghost">Add Produce</Link>
      </div>
    </div>
  );
}
