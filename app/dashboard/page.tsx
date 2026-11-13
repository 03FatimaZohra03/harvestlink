"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          router.replace("/login?next=/dashboard");
          return;
        }
        router.replace(data.user.accountType === "SELLER" ? "/dashboard/seller" : "/dashboard/buyer");
      })
      .catch(() => setError("Failed to load session"));
  }, [router]);

  if (error) return <div className="text-error">{error}</div>;
  return <div className="text-center py-8">Loading…</div>;
}
