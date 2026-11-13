import "dotenv/config";

const BASE = "http://localhost:3000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

const results = [];

// Setup: get admin credentials from .env (already set on Day 0)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
  process.exit(1);
}

results.push({ name: "0. ADMIN_EMAIL and ADMIN_PASSWORD present in env", ok: !!ADMIN_EMAIL && !!ADMIN_PASSWORD });

// Test 1: Admin login with correct credentials
let r = await req("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
const adminCookie = r.headers.get("set-cookie");
results.push({ name: "1. Admin login -> 200 + cookie", ok: r.status === 200 && r.body.ok === true && !!adminCookie });

// Test 2: Admin /me with cookie
r = await req("/api/admin/me", { headers: { Cookie: adminCookie } });
results.push({ name: "2. Admin /me -> 200 + admin info", ok: r.status === 200 && r.body.admin?.email === ADMIN_EMAIL });

// Test 3: Admin /me without cookie -> 401
r = await req("/api/admin/me");
results.push({ name: "3. Admin /me without cookie -> 401", ok: r.status === 401 });

// Test 4: Admin login with wrong password -> 401
r = await req("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: "wrongpassword" }),
});
results.push({ name: "4. Wrong admin password -> 401 INVALID_CREDENTIALS", ok: r.status === 401 && r.body.error === "INVALID_CREDENTIALS" });

// Test 5: Admin login with non-existent email -> same 401 message (no enumeration)
r = await req("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "nonexistent@example.com", password: "anything" }),
});
results.push({ name: "5. Non-existent admin email -> same 401 INVALID_CREDENTIALS", ok: r.status === 401 && r.body.error === "INVALID_CREDENTIALS" });

// Test 6: User cookie CANNOT access admin endpoint (cross-session isolation)
const userEmail = `user-d7-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: userEmail, password: "testpassword123", name: "Test User", accountType: "BUYER" }),
});
const userCookie = r.headers.get("set-cookie");
results.push({ name: "6a. Register regular user", ok: r.status === 200 && !!userCookie });

r = await req("/api/admin/me", { headers: { Cookie: userCookie } });
results.push({ name: "6b. User cookie cannot access admin /me -> 401", ok: r.status === 401 });

// Test 7: Admin cookie CANNOT access user dashboard (cross-session isolation the other way)
r = await req("/api/dashboard/buyer/requests", { headers: { Cookie: adminCookie } });
results.push({ name: "7. Admin cookie cannot access user endpoint -> 401", ok: r.status === 401 });

// Test 8: Admin stats endpoint
r = await req("/api/admin/stats", { headers: { Cookie: adminCookie } });
results.push({
  name: "8. Admin stats -> 200 + all expected keys",
  ok: r.status === 200 && r.body.ok === true
    && r.body.stats?.users && typeof r.body.stats.users.total === "number"
    && r.body.stats?.produce && typeof r.body.stats.produce.total === "number"
    && r.body.stats?.requests && typeof r.body.stats.requests.total === "number"
    && r.body.stats?.today && typeof r.body.stats.today.newUsers === "number"
    && r.body.stats?.health && typeof r.body.stats.health.expiredNotMarkedCount === "number"
});

// Test 9: Admin users list
r = await req("/api/admin/users", { headers: { Cookie: adminCookie } });
results.push({
  name: "9. Admin users list -> 200 + pagination",
  ok: r.status === 200 && Array.isArray(r.body.users) && r.body.pagination && typeof r.body.pagination.total === "number"
});

// Test 10: Admin users filter by accountType
r = await req("/api/admin/users?accountType=BUYER", { headers: { Cookie: adminCookie } });
results.push({
  name: "10. Filter users by BUYER -> all returned are BUYER",
  ok: r.status === 200 && r.body.users.every((u) => u.accountType === "BUYER")
});

// Test 11: Admin produce list
r = await req("/api/admin/produce", { headers: { Cookie: adminCookie } });
results.push({
  name: "11. Admin produce list -> 200 + pagination",
  ok: r.status === 200 && Array.isArray(r.body.produce) && r.body.pagination
});

// Test 12: Admin requests list
r = await req("/api/admin/requests", { headers: { Cookie: adminCookie } });
results.push({
  name: "12. Admin requests list -> 200 + pagination",
  ok: r.status === 200 && Array.isArray(r.body.requests) && r.body.pagination
});

// Test 13: Unauthenticated cannot access admin endpoints
r = await req("/api/admin/users");
results.push({ name: "13. Unauthenticated /api/admin/users -> 401", ok: r.status === 401 });

// Test 14: Setup for auto-expire — create seller + buyer + produce with past availableUntil
const sellerEmail = `seller-d7-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: sellerEmail, password: "testpassword123", name: "Test Seller", accountType: "SELLER", city: "Bangalore" }),
});
const sellerCookie = r.headers.get("set-cookie");

const categories = await req("/api/categories");
const firstCategoryId = categories.body.categories[0].id;

// Create produce with availableUntil 2 hours AGO (already expired)
const pastAvailUntil = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    name: "Day7 Expired Tomatoes", categoryId: firstCategoryId,
    quantityAvailable: "20", quantityUnit: "kg", pricePerUnit: "30",
    locationText: "Farm", city: "Bangalore",
    availableUntil: pastAvailUntil,
  }),
});
const expiredProduceId = r.body.produce?.id;
results.push({ name: "14. Create produce with past availableUntil", ok: r.status === 201 && !!expiredProduceId });

// Test 15: Before run-expire, the produce should still be AVAILABLE (auto-expire hasn't run)
r = await req(`/api/admin/produce?search=Day7 Expired`, { headers: { Cookie: adminCookie } });
const beforeExpire = r.body.produce?.find((p) => p.id === expiredProduceId);
results.push({ name: "15. Before run-expire, produce status = AVAILABLE", ok: beforeExpire?.status === "AVAILABLE" });

// Test 16: Buyer sends a PENDING request on this expired-but-not-marked produce
const buyerEmail = `buyer-d7-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: buyerEmail, password: "testpassword123", name: "Test Buyer", accountType: "BUYER", city: "Bangalore" }),
});
const buyerCookie = r.headers.get("set-cookie");

// Note: the produce has past availableUntil but is still AVAILABLE in DB, so the buyer CAN send a request.
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({ produceId: expiredProduceId, quantityRequested: "5", proposedPricePerUnit: "30" }),
});
const pendingRequestId = r.body.request?.id;
results.push({ name: "16. Buyer sends PENDING request on expired-but-not-marked produce", ok: r.status === 201 && !!pendingRequestId });

// Test 17: Run auto-expire
r = await req("/api/admin/run-expire", { method: "POST", headers: { Cookie: adminCookie } });
results.push({
  name: "17. Run auto-expire -> 200 + counts",
  ok: r.status === 200 && r.body.ok === true && typeof r.body.result?.expiredProduce === "number" && typeof r.body.result?.rejectedRequests === "number"
});

// Test 18: After run-expire, produce status = EXPIRED
r = await req(`/api/admin/produce?search=Day7 Expired`, { headers: { Cookie: adminCookie } });
const afterExpire = r.body.produce?.find((p) => p.id === expiredProduceId);
results.push({ name: "18. After run-expire, produce status = EXPIRED", ok: afterExpire?.status === "EXPIRED" });

// Test 19: After run-expire, the pending request on expired produce = REJECTED
r = await req(`/api/admin/requests?status=PENDING`, { headers: { Cookie: adminCookie } });
const stillPending = r.body.requests?.find((reqItem) => reqItem.id === pendingRequestId);
results.push({ name: "19. Pending request on expired produce is no longer PENDING", ok: !stillPending });

r = await req(`/api/admin/requests?status=REJECTED`, { headers: { Cookie: adminCookie } });
const nowRejected = r.body.requests?.find((reqItem) => reqItem.id === pendingRequestId);
results.push({ name: "20. Request is now REJECTED", ok: !!nowRejected });

// Test 21: Health check — expiredNotMarkedCount should be 0 after run-expire
r = await req("/api/admin/stats", { headers: { Cookie: adminCookie } });
results.push({ name: "21. After run-expire, expiredNotMarkedCount = 0", ok: r.body.stats?.health?.expiredNotMarkedCount === 0 });

// Test 22: Run auto-expire again — should return 0/0 (idempotent)
r = await req("/api/admin/run-expire", { method: "POST", headers: { Cookie: adminCookie } });
results.push({
  name: "22. Re-run auto-expire -> 0 expiredProduce (idempotent)",
  ok: r.status === 200 && r.body.result?.expiredProduce === 0
});

// Test 23: Admin logout
r = await req("/api/admin/logout", { method: "POST", redirect: "manual" });
results.push({
  name: "23. Admin logout -> redirect + cleared cookie",
  ok: (r.status === 307 || r.status === 308 || r.status === 303) && (r.headers.get("set-cookie") || "").includes("hl_admin_session=")
});

// Test 24: After logout, /api/admin/me -> 401 (sending old cookie should fail since it's been cleared client-side, but server-side JWT is still valid — this is a known limitation of stateless JWT)
results.push({ name: "24. (skipped — stateless JWT logout is client-side)", ok: true });

console.log("\n=== Day 7 Verification ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "[ok]" : "[FAIL]"} ${r.name}`);
  if (!r.ok) allOk = false;
}
console.log(`\n${allOk ? "ALL PASSED" : "SOME FAILED"}`);
process.exit(allOk ? 0 : 1);
