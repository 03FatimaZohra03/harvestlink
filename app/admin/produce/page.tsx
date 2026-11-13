"use client";

import { useEffect, useState } from "react";

type Produce = {
  id: string; name: string; status: string;
  quantityAvailable: string; quantityUnit: string;
  pricePerUnit: string; currency: string;
  city: string | null; pincode: string | null;
  availableUntil: string; createdAt: string;
  category: { name: string } | null;
  seller: { name: string; businessName: string | null; city: string | null } | null;
};

const statusPill = (status: string) => {
  const map: Record<string, string> = {
    AVAILABLE: "hl-pill-sage",
    RESERVED: "hl-pill-terracotta",
    SOLD: "hl-pill-sage",
    EXPIRED: "hl-pill-gray",
  };
  return map[status] || "hl-pill-gray";
};

export default function AdminProducePage() {
  const [produce, setProduce] = useState<Produce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/admin/produce?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setProduce(data.produce);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      });
  }, [page, filter, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-charcoal">Produce Listings</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search produce name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="hl-input flex-1"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="hl-input"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading…</div>
      ) : produce.length === 0 ? (
        <div className="text-muted">No produce found.</div>
      ) : (
        <>
          <div className="hl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-surface-container text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Seller</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Available Until</th>
                    <th className="p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {produce.map((p) => (
                    <tr key={p.id} className="border-t border-border-ghost">
                      <td className="p-2 font-medium text-charcoal">{p.name}</td>
                      <td className="p-2 text-muted">{p.category?.name || "—"}</td>
                      <td className="p-2 text-muted">{p.seller?.businessName || p.seller?.name || "—"}</td>
                      <td className="p-2 text-charcoal">{p.quantityAvailable} {p.quantityUnit}</td>
                      <td className="p-2 text-charcoal">{p.currency} {p.pricePerUnit}/{p.quantityUnit}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${statusPill(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="p-2 text-muted">{p.city || "—"}</td>
                      <td className="p-2 text-muted">{new Date(p.availableUntil).toLocaleDateString()}</td>
                      <td className="p-2 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${n === page ? "bg-charcoal text-white border-charcoal" : "bg-surface border-border-ghost text-charcoal"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
