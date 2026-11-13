"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LiveCountdown from "../_components/LiveCountdown";

type Category = { id: string; name: string };
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
  availableUntil: string;
  status: string;
  categoryId: string;
  category?: { name: string };
  seller?: { name: string; businessName?: string | null; city?: string | null };
};

function BrowseContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [produce, setProduce] = useState<Produce[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [pincode, setPincode] = useState(searchParams.get("pincode") || "");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => {
      if (d.ok) setCategories(d.categories);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (city) params.set("city", city);
    if (pincode) params.set("pincode", pincode);
    params.set("page", String(currentPage));
    fetch(`/api/produce?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setProduce(data.produce);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      });
  }, [search, categoryId, city, pincode, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setCity("");
    setPincode("");
    setCurrentPage(1);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold mb-4 text-charcoal">Browse Available Produce</h1>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0 mb-4 lg:mb-0">
          <button className="lg:hidden hl-btn-ghost mb-2 w-full" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="hl-card p-4 space-y-3">
              <h2 className="font-semibold text-sm text-charcoal">Filters</h2>
              <input
                type="search"
                placeholder="Search produce…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="hl-input text-sm"
              />
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setCurrentPage(1); }}
                className="hl-input text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => { setCity(e.target.value); setCurrentPage(1); }}
                className="hl-input text-sm"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value); setCurrentPage(1); }}
                className="hl-input text-sm"
              />
              <button
                onClick={clearFilters}
                className="text-xs text-muted underline hover:text-sage"
              >
                Clear all
              </button>
            </div>
          </div>
        </aside>

        {/* Produce grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-8">Loading…</div>
          ) : produce.length === 0 ? (
            <div className="text-muted">No produce found. Try adjusting your filters.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {produce.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produce/${p.id}`}
                    className="hl-card p-4 hl-card-hover block"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-charcoal">{p.name}</span>
                      <span className={`hl-pill hl-status-${p.status.toLowerCase()}`}>{p.status}</span>
                    </div>
                    {p.category && (
                      <div className="text-xs text-muted mb-1">{p.category.name}</div>
                    )}
                    <div className="text-sm text-charcoal mb-2">
                      {p.currency} {p.pricePerUnit}/{p.quantityUnit} · {p.quantityAvailable} {p.quantityUnit} available
                    </div>
                    <div className="text-xs text-muted mb-1">
                      {p.city || p.locationText}
                    </div>
                    <div className="mt-2">
                      <LiveCountdown availableUntil={p.availableUntil} />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${n === currentPage ? "bg-sage text-white border-sage" : "bg-surface border-border-ghost text-charcoal"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading…</div>}>
      <BrowseContent />
    </Suspense>
  );
}
