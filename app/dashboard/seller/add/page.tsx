"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

export default function AddProducePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => {
      if (data.ok) setCategories(data.categories);
    });
  }, []);

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
      currency: "INR",
      locationText: formData.get("locationText"),
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      pincode: formData.get("pincode") || undefined,
      harvestDate: formData.get("harvestDate") ? new Date(formData.get("harvestDate") as string).toISOString() : "",
      availableUntil: new Date(formData.get("availableUntil") as string).toISOString(),
      pickupNotes: formData.get("pickupNotes") || undefined,
    };
    const res = await fetch("/api/dashboard/seller/produce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError(data.error === "VALIDATION" ? "Please check the form fields." : "Failed to create listing.");
      return;
    }
    router.push("/dashboard/seller/listings");
    router.refresh();
  }

  const defaultAvailUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Add Produce Listing</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Produce name *</label>
          <input name="name" required maxLength={200} className="hl-input" placeholder="e.g. Tomatoes" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Description</label>
          <textarea name="description" maxLength={2000} className="hl-input" rows={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Category *</label>
            <select name="categoryId" required className="hl-input">
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Unit *</label>
            <select name="quantityUnit" required className="hl-input">
              <option value="kg">kg</option>
              <option value="quintal">quintal</option>
              <option value="tonne">tonne</option>
              <option value="dozen">dozen</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Quantity available *</label>
            <input name="quantityAvailable" type="number" step="0.01" min="0.01" required className="hl-input" placeholder="e.g. 50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Price per unit (INR) *</label>
            <input name="pricePerUnit" type="number" step="0.01" min="0.01" required className="hl-input" placeholder="e.g. 30" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Pickup location *</label>
          <input name="locationText" required maxLength={200} className="hl-input" placeholder="Village / address" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input name="city" className="hl-input" placeholder="City" />
          <input name="state" className="hl-input" placeholder="State" />
          <input name="pincode" className="hl-input" placeholder="Pincode" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Harvest date</label>
            <input name="harvestDate" type="datetime-local" className="hl-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-charcoal">Available until *</label>
            <input name="availableUntil" type="datetime-local" required defaultValue={defaultAvailUntil} className="hl-input" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-charcoal">Pickup notes</label>
          <textarea name="pickupNotes" maxLength={500} className="hl-input" rows={2} placeholder="e.g. Bring your own crates" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="hl-btn-primary">
            {submitting ? "Creating…" : "Create Listing"}
          </button>
          <button type="button" onClick={() => router.back()} className="hl-btn-ghost">Cancel</button>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>
    </div>
  );
}
