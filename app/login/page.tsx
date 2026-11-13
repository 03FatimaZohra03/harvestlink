"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
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
    router.push(next);
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Log in to HarvestLink</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="Email" required className="hl-input" />
        <input name="password" type="password" placeholder="Password" required className="hl-input" />
        <button type="submit" disabled={submitting} className="hl-btn-primary w-full">
          {submitting ? "Logging in..." : "Log In"}
        </button>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>
      <p className="mt-4 text-sm text-muted">
        Don't have an account? <a href="/register" className="text-sage hover:underline">Register</a>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-10 px-4">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
