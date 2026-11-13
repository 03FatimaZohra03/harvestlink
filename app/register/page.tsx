"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountType = "SELLER" | "BUYER";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("SELLER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const body = {
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      accountType,
      phone: formData.get("phone") || undefined,
      businessName: formData.get("businessName") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      pincode: formData.get("pincode") || undefined,
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError(data.error === "EMAIL_TAKEN" ? "Email already registered" : "Registration failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Create your HarvestLink account</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["SELLER", "BUYER"] as AccountType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setAccountType(t)}
            className={`p-4 border rounded-lg text-left ${accountType === t ? "border-sage bg-sage-tint" : "border-border-ghost bg-surface"}`}
          >
            <div className="font-semibold text-charcoal">{t === "SELLER" ? "I'm a Farmer" : "I'm a Buyer"}</div>
            <div className="text-sm text-muted">
              {t === "SELLER" ? "List produce for sale" : "Wholesaler, restaurant, market"}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="Email" required className="hl-input" />
        <input name="password" type="password" placeholder="Password (min 8 chars)" required minLength={8} className="hl-input" />
        <input name="name" placeholder="Your name" required className="hl-input" />
        <input name="businessName" placeholder={accountType === "SELLER" ? "Farm name (optional)" : "Business name (optional)"} className="hl-input" />
        <input name="phone" placeholder="Phone (optional)" className="hl-input" />
        <input name="city" placeholder="City (optional)" className="hl-input" />
        <input name="state" placeholder="State (optional)" className="hl-input" />
        <input name="pincode" placeholder="Pincode (optional)" className="hl-input" />
        <button type="submit" disabled={submitting} className="hl-btn-primary w-full">
          {submitting ? "Creating..." : "Create Account"}
        </button>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have an account? <a href="/login" className="text-sage hover:underline">Log in</a>
      </p>
    </main>
  );
}
