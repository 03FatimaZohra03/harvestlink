"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError("Invalid email or password");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <div className="max-w-sm w-full hl-card p-6">
        <h1 className="text-xl font-bold mb-1 text-charcoal">Admin Login</h1>
        <p className="text-sm text-muted mb-4">HarvestLink administration</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Admin email"
            required
            className="hl-input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="hl-input"
          />
          <button
            type="submit"
            disabled={submitting}
            className="hl-btn-primary w-full"
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
          {error && <p className="text-error text-sm">{error}</p>}
        </form>
        <p className="mt-4 text-xs text-muted">
          Admin access is restricted to authorized personnel.
        </p>
      </div>
    </main>
  );
}
