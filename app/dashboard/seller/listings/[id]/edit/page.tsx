"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Category = { id: string; name: string };
type Listing = {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  quantityAvailable: string;
  quantityUnit: string;
  pricePerUnit: string;
  locationText: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  harvestDate?: string | null;
  availableUntil: string;
  pickupNotes?: string | null;
};

export default function EditProducePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/dashboard/seller/produce/${params.id}`).then((r) => r.json()),
    ]).then(([catData, prodData]) => {
      if (catData.ok) setCategories(catData.categories);
      if (prodData.ok) setListing(prodData.produce);
    });
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId"),
      quantityAvailable: formData.get("quantityAvailable"),
      quantityUnit: formData.get("quantityUnit"),
      pricePerUnit: formData.get("pricePerUnit"),
      locationText: formData.get("locationText"),
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      pincode: formData.get("pincode") || undefined,
      harvestDate: formData.get("harvestDate") ? new Date(formData.get("harvestDate") as string).toISOString() : "",
      availableUntil: new Date(formData.get("availableUntil") as string).toISOString(),
      pickupNotes: formData.get("pickupNotes") || undefined,
    };
    const res = await fetch(`/api/dashboard/seller/produce/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError("Failed to update listing.");
      return;
    }
    router.push("/dashboard/seller/listings");
    router.refresh();
  }

  if (!listing) return <div className="text-center py-8">Loading…</div>;

  const toLocalInput = (iso?: string | null) => iso ? new Date(iso).toISOString().slice(0, 16) : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="name" required defaultValue={listing.name} className="hl-input" />
        <textarea name="description" defaultValue={listing.description || ""} className="hl-input" rows={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select name="categoryId" required defaultValue={listing.categoryId} className="hl-input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="quantityUnit" defaultValue={listing.quantityUnit} className="hl-input">
            <option value="kg">kg</option>
            <option value="quintal">quintal</option>
            <option value="tonne">tonne</option>
            <option value="dozen">dozen</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="quantityAvailable" type="number" step="0.01" min="0.01" required defaultValue={listing.quantityAvailable} className="hl-input" />
          <input name="pricePerUnit" type="number" step="0.01" min="0.01" required defaultValue={listing.pricePerUnit} className="hl-input" />
        </div>
        <input name="locationText" required defaultValue={listing.locationText} className="hl-input" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input name="city" defaultValue={listing.city || ""} className="hl-input" placeholder="City" />
          <input name="state" defaultValue={listing.state || ""} className="hl-input" placeholder="State" />
          <input name="pincode" defaultValue={listing.pincode || ""} className="hl-input" placeholder="Pincode" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="harvestDate" type="datetime-local" defaultValue={toLocalInput(listing.harvestDate)} className="hl-input" />
          <input name="availableUntil" type="datetime-local" required defaultValue={toLocalInput(listing.availableUntil)} className="hl-input" />
        </div>
        <textarea name="pickupNotes" defaultValue={listing.pickupNotes || ""} className="hl-input" rows={2} placeholder="Pickup notes" />
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="hl-btn-primary">
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="hl-btn-ghost">Cancel</button>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>
    </div>
  );
}
