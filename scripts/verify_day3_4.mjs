const BASE = "http://localhost:3000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

const results = [];

// Setup: register seller + buyer
const sellerEmail = `seller-d34-${Date.now()}@example.com`;
const buyerEmail = `buyer-d34-${Date.now()}@example.com`;

let r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: sellerEmail, password: "testpassword123", name: "Test Seller", accountType: "SELLER", city: "Bangalore", pincode: "560001" }),
});
const sellerCookie = r.headers.get("set-cookie");
results.push({ name: "1. Register seller for Day 3+4", ok: r.status === 200 && !!sellerCookie });

r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: buyerEmail, password: "testpassword123", name: "Test Buyer", accountType: "BUYER", city: "Bangalore", pincode: "560001" }),
});
const buyerCookie = r.headers.get("set-cookie");
results.push({ name: "2. Register buyer for Day 3+4", ok: r.status === 200 && !!buyerCookie });

// Test 3: GET /api/categories
r = await req("/api/categories");
results.push({ name: "3. GET /api/categories -> 4 categories", ok: r.status === 200 && r.body.categories?.length === 4 });
const firstCategoryId = r.body.categories?.[0]?.id;

// Test 4: GET /api/produce (empty initially)
r = await req("/api/produce");
results.push({ name: "4. GET /api/produce (empty initially) -> 200", ok: r.status === 200 });

// Test 5: Seller creates produce
const availUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    name: "Test Tomatoes",
    categoryId: firstCategoryId,
    quantityAvailable: "50",
    quantityUnit: "kg",
    pricePerUnit: "30",
    currency: "INR",
    locationText: "Farm plot",
    city: "Bangalore",
    pincode: "560001",
    availableUntil: availUntil,
  }),
});
const produceId = r.body.produce?.id;
results.push({ name: "5. Seller creates produce -> 201 + id", ok: r.status === 201 && !!produceId });

// Test 6: Invalid category
r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    name: "Test Tomatoes 2",
    categoryId: "invalid-category-id",
    quantityAvailable: "10",
    quantityUnit: "kg",
    pricePerUnit: "20",
    availableUntil: availUntil,
  }),
});
results.push({ name: "6. Invalid category -> 400 INVALID_CATEGORY", ok: r.status === 400 && r.body.error === "INVALID_CATEGORY" });

// Test 7: Buyer cannot create produce
r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    name: "Test Tomatoes 3",
    categoryId: firstCategoryId,
    quantityAvailable: "10",
    quantityUnit: "kg",
    pricePerUnit: "20",
    availableUntil: availUntil,
  }),
});
results.push({ name: "7. Buyer cannot create produce -> 403 FORBIDDEN", ok: r.status === 403 && r.body.error === "FORBIDDEN" });

// Test 8: Unauthenticated
r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Tomatoes 4",
    categoryId: firstCategoryId,
    quantityAvailable: "10",
    quantityUnit: "kg",
    pricePerUnit: "20",
    availableUntil: availUntil,
  }),
});
results.push({ name: "8. Unauthenticated -> 401 UNAUTHORIZED", ok: r.status === 401 && r.body.error === "UNAUTHORIZED" });

// Test 9: Seller lists own produce
r = await req("/api/dashboard/seller/produce", { headers: { Cookie: sellerCookie } });
results.push({ name: "9. Seller lists own produce -> 1 listing", ok: r.status === 200 && r.body.produce?.length === 1 });

// Test 10: Public browse shows the listing
r = await req("/api/produce");
results.push({ name: "10. Public browse shows seller's listing -> >=1 listing", ok: r.status === 200 && r.body.produce?.length >= 1 });

// Test 11: Public produce detail
r = await req(`/api/produce/${produceId}`);
results.push({ name: "11. Public produce detail -> 200 + seller info", ok: r.status === 200 && r.body.produce?.seller?.name === "Test Seller" });

// Test 12: isOwner flag — when seller views their own produce
r = await req(`/api/produce/${produceId}`, { headers: { Cookie: sellerCookie } });
results.push({ name: "12. Seller views own produce -> isOwner=true", ok: r.status === 200 && r.body.produce?.isOwner === true });

// Test 13: Seller edits produce
r = await req(`/api/dashboard/seller/produce/${produceId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({ name: "Test Tomatoes Updated", pricePerUnit: "35" }),
});
results.push({ name: "13. Seller edits produce -> 200 + updated name", ok: r.status === 200 && r.body.produce?.name === "Test Tomatoes Updated" && r.body.produce?.pricePerUnit === "35" });

// Test 14: Buyer cannot edit seller's produce
r = await req(`/api/dashboard/seller/produce/${produceId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({ name: "Hacked" }),
});
results.push({ name: "14. Buyer cannot edit seller's produce -> 404", ok: r.status === 404 && r.body.error === "NOT_FOUND" });

// Test 15: Filter by category (use real category ID)
r = await req(`/api/produce?categoryId=${firstCategoryId}`);
results.push({ name: "15. Filter by categoryId -> shows listing", ok: r.status === 200 && r.body.produce?.length >= 1 });
r = await req("/api/produce?categoryId=invalid-id");
results.push({ name: "16. Filter by invalid categoryId -> empty", ok: r.status === 200 && r.body.produce?.length === 0 });

// Test 17: Search filter
r = await req("/api/produce?search=tomato");
results.push({ name: "17. Search 'tomato' -> shows listing", ok: r.status === 200 && r.body.produce?.length >= 1 });

// Test 18: Seller deletes produce
r = await req(`/api/dashboard/seller/produce/${produceId}`, {
  method: "DELETE",
  headers: { Cookie: sellerCookie },
});
results.push({ name: "18. Seller deletes produce -> 200 + status=EXPIRED", ok: r.status === 200 && r.body.status === "EXPIRED" });

// Test 19: After delete, produce not in browse
r = await req("/api/produce");
const hasDeleted = r.body.produce?.some((p) => p.id === produceId);
results.push({ name: "19. After delete, produce not in browse", ok: r.status === 200 && !hasDeleted });

// Test 20: Expired produce detail -> 404
r = await req(`/api/produce/${produceId}`);
results.push({ name: "20. Expired produce detail -> 404", ok: r.status === 404 && r.body.error === "NOT_FOUND" });

console.log("\n=== Day 3+4 Verification ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "[ok]" : "[FAIL]"} ${r.name}`);
  if (!r.ok) allOk = false;
}
console.log(`\n${allOk ? "ALL PASSED" : "SOME FAILED"}`);
process.exit(allOk ? 0 : 1);
