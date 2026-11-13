"use client";

import { useEffect, useState } from "react";

type User = {
  id: string; email: string; name: string; accountType: string;
  businessName: string | null; city: string | null; state: string | null;
  pincode: string | null; phone: string | null; isActive: boolean;
  createdAt: string; updatedAt: string;
  _count: { produceListings: number; buyerRequests: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("accountType", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUsers(data.users);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      });
  }, [page, filter, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-charcoal">Users</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name, email, business..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="hl-input flex-1"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="hl-input"
        >
          <option value="">All types</option>
          <option value="SELLER">Sellers</option>
          <option value="BUYER">Buyers</option>
          <option value="LOGISTICS">Logistics</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-muted">No users found.</div>
      ) : (
        <>
          <div className="hl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-surface-container text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Listings</th>
                    <th className="p-2">Requests</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border-ghost">
                      <td className="p-2 font-medium text-charcoal">{u.businessName || u.name}</td>
                      <td className="p-2 text-muted">{u.email}</td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-container-high text-muted">{u.accountType}</span>
                      </td>
                      <td className="p-2 text-muted">{u.city || "—"}{u.pincode ? ` · ${u.pincode}` : ""}</td>
                      <td className="p-2 text-center text-charcoal">{u._count.produceListings}</td>
                      <td className="p-2 text-center text-charcoal">{u._count.buyerRequests}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${u.isActive ? "bg-sage-tint text-sage-tint-text" : "bg-surface-container-high text-muted"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-2 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
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
