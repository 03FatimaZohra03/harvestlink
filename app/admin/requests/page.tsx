"use client";

import { useEffect, useState } from "react";

type RequestItem = {
  id: string; status: string;
  quantityRequested: string; proposedPricePerUnit: string; currency: string;
  createdAt: string; respondedAt: string | null; completedAt: string | null;
  produce: { id: string; name: string; quantityUnit: string } | null;
  buyer: { name: string; businessName: string | null; city: string | null } | null;
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

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    params.set("page", String(page));
    fetch(`/api/admin/requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setRequests(data.requests);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      });
  }, [page, filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-charcoal">Requests</h1>

      <div className="flex gap-3 mb-4">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="hl-input"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-muted">No requests found.</div>
      ) : (
        <>
          <div className="hl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-surface-container text-left">
                  <tr>
                    <th className="p-2">Produce</th>
                    <th className="p-2">Buyer</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Responded</th>
                    <th className="p-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-border-ghost">
                      <td className="p-2 font-medium text-charcoal">{r.produce?.name || "—"}</td>
                      <td className="p-2 text-muted">{r.buyer?.businessName || r.buyer?.name || "—"}</td>
                      <td className="p-2 text-charcoal">{r.quantityRequested} {r.produce?.quantityUnit}</td>
                      <td className="p-2 text-charcoal">{r.currency} {r.proposedPricePerUnit}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${statusPill(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="p-2 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 text-muted">{r.respondedAt ? new Date(r.respondedAt).toLocaleDateString() : "—"}</td>
                      <td className="p-2 text-muted">{r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}</td>
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
