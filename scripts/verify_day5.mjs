const BASE = "http://localhost:3000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

const results = [];

// Setup: register a fresh seller + buyer
const sellerEmail = `seller-d5-${Date.now()}@example.com`;
const buyerEmail = `buyer-d5-${Date.now()}@example.com`;

let r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: sellerEmail, password: "testpassword123", name: "Test Seller", accountType: "SELLER", city: "Bangalore", pincode: "560001" }),
});
const sellerCookie = r.headers.get("set-cookie");
results.push({ name: "1. Register seller", ok: r.status === 200 && !!sellerCookie });

r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: buyerEmail, password: "testpassword123", name: "Test Buyer", accountType: "BUYER", city: "Bangalore", pincode: "560001" }),
});
const buyerCookie = r.headers.get("set-cookie");
results.push({ name: "2. Register buyer", ok: r.status === 200 && !!buyerCookie });

// Seller creates a produce listing
const availUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const categories = await req("/api/categories");
const firstCategoryId = categories.body.categories[0].id;

r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    name: "Day5 Tomatoes", categoryId: firstCategoryId,
    quantityAvailable: "50", quantityUnit: "kg", pricePerUnit: "30",
    locationText: "Farm plot", city: "Bangalore", pincode: "560001",
    availableUntil: availUntil,
  }),
});
const produceId = r.body.produce?.id;
results.push({ name: "3. Seller creates produce", ok: r.status === 201 && !!produceId });

// Test 4: Buyer fetches produce detail — canRequest should be true
r = await req(`/api/produce/${produceId}`, { headers: { Cookie: buyerCookie } });
results.push({ name: "4. Buyer views produce -> canRequest=true", ok: r.status === 200 && r.body.produce?.canRequest === true });

// Test 5: Seller views own produce — canRequest should be false, isOwner true
r = await req(`/api/produce/${produceId}`, { headers: { Cookie: sellerCookie } });
results.push({ name: "5. Seller views own produce -> isOwner=true, canRequest=false", ok: r.status === 200 && r.body.produce?.isOwner === true && r.body.produce?.canRequest === false });

// Test 6: Unauthenticated views produce — canRequest false
r = await req(`/api/produce/${produceId}`);
results.push({ name: "6. Unauthenticated views produce -> canRequest=false", ok: r.status === 200 && r.body.produce?.canRequest === false });

// Test 7: Buyer sends a request
const pickupTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "10",
    proposedPricePerUnit: "30",
    proposedPickupTime: pickupTime,
    pickupLocationText: "Farm plot",
    buyerMessage: "Looking forward to picking these up",
  }),
});
const requestId = r.body.request?.id;
results.push({ name: "7. Buyer sends request -> 201 + id", ok: r.status === 201 && r.body.ok === true && !!requestId });

// Test 8: Buyer tries to send DUPLICATE pending request -> 409
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "25",
  }),
});
results.push({ name: "8. Duplicate pending request -> 409 PENDING_REQUEST_EXISTS", ok: r.status === 409 && r.body.error === "PENDING_REQUEST_EXISTS" });

// Test 9: Buyer requests more than available -> 400
// First cancel the existing request so we can send a new one
await req(`/api/dashboard/buyer/requests/${requestId}/cancel`, { method: "POST", headers: { Cookie: buyerCookie } });

r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "100",  // more than 50 available
    proposedPricePerUnit: "30",
  }),
});
results.push({ name: "9. Quantity exceeds available -> 400 QUANTITY_EXCEEDS_AVAILABLE", ok: r.status === 400 && r.body.error === "QUANTITY_EXCEEDS_AVAILABLE" });

// Test 10: Buyer requests with pickup time in the past -> 400
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "30",
    proposedPickupTime: new Date(Date.now() - 100000).toISOString(),
  }),
});
results.push({ name: "10. Pickup time in past -> 400 PICKUP_TIME_IN_PAST", ok: r.status === 400 && r.body.error === "PICKUP_TIME_IN_PAST" });

// Test 11: Buyer requests with pickup time after produce expiry -> 400
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "30",
    proposedPickupTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  }),
});
results.push({ name: "11. Pickup after expiry -> 400 PICKUP_AFTER_EXPIRY", ok: r.status === 400 && r.body.error === "PICKUP_AFTER_EXPIRY" });

// Test 12: Seller tries to create a request -> 403
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "30",
  }),
});
results.push({ name: "12. Seller cannot create request -> 403 FORBIDDEN", ok: r.status === 403 && r.body.error === "FORBIDDEN" });

// Test 13: Unauthenticated tries to create a request -> 401
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "30",
  }),
});
results.push({ name: "13. Unauthenticated -> 401 UNAUTHORIZED", ok: r.status === 401 && r.body.error === "UNAUTHORIZED" });

// Send a valid request for the remaining tests
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "10",
    proposedPricePerUnit: "30",
    proposedPickupTime: pickupTime,
    buyerMessage: "Test message",
  }),
});
const requestId2 = r.body.request?.id;
results.push({ name: "14. Buyer sends valid request -> 201", ok: r.status === 201 && !!requestId2 });

// Test 15: Buyer lists their requests
r = await req("/api/dashboard/buyer/requests", { headers: { Cookie: buyerCookie } });
results.push({
  name: "15. Buyer lists requests -> has stats",
  ok: r.status === 200 && r.body.ok === true && r.body.stats && typeof r.body.stats.PENDING === "number" && r.body.requests.length >= 1
});

// Test 16: Buyer views a single request
r = await req(`/api/dashboard/buyer/requests/${requestId2}`, { headers: { Cookie: buyerCookie } });
results.push({ name: "16. Buyer views single request -> 200", ok: r.status === 200 && r.body.request?.id === requestId2 });

// Test 17: Buyer tries to view another buyer's request -> 404 (register a second buyer)
const buyer2Email = `buyer2-d5-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: buyer2Email, password: "testpassword123", name: "Buyer 2", accountType: "BUYER" }),
});
const buyer2Cookie = r.headers.get("set-cookie");

r = await req(`/api/dashboard/buyer/requests/${requestId2}`, { headers: { Cookie: buyer2Cookie } });
results.push({ name: "17. Other buyer views request -> 404 (no leak)", ok: r.status === 404 });

// Test 18: Buyer cancels their request
r = await req(`/api/dashboard/buyer/requests/${requestId2}/cancel`, { method: "POST", headers: { Cookie: buyerCookie } });
results.push({ name: "18. Buyer cancels request -> 200 + status=CANCELLED", ok: r.status === 200 && r.body.ok === true && r.body.request?.status === "CANCELLED" });

// Test 19: Buyer tries to cancel an already-cancelled request -> 409
r = await req(`/api/dashboard/buyer/requests/${requestId2}/cancel`, { method: "POST", headers: { Cookie: buyerCookie } });
results.push({ name: "19. Cancel already-cancelled -> 409 CANNOT_CANCEL", ok: r.status === 409 && r.body.error === "CANNOT_CANCEL" });

// Test 20: Buyer2 tries to cancel buyer1's request -> 404
// Send a new request as buyer1 first
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyerCookie },
  body: JSON.stringify({
    produceId: produceId,
    quantityRequested: "5",
    proposedPricePerUnit: "30",
  }),
});
const requestId3 = r.body.request?.id;
r = await req(`/api/dashboard/buyer/requests/${requestId3}/cancel`, { method: "POST", headers: { Cookie: buyer2Cookie } });
results.push({ name: "20. Other buyer cancels -> 404 (no leak)", ok: r.status === 404 });

// Cancel requestId3 as buyer1 (so canRequest is true again for test 21)
await req(`/api/dashboard/buyer/requests/${requestId3}/cancel`, { method: "POST", headers: { Cookie: buyerCookie } });

// Test 21: After cancellation, canRequest should be true again (no pending)
r = await req(`/api/produce/${produceId}`, { headers: { Cookie: buyerCookie } });
results.push({ name: "21. After cancel, canRequest=true again", ok: r.status === 200 && r.body.produce?.canRequest === true });

console.log("\n=== Day 5 Verification ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "[ok]" : "[FAIL]"} ${r.name}`);
  if (!r.ok) allOk = false;
}
console.log(`\n${allOk ? "ALL PASSED" : "SOME FAILED"}`);
process.exit(allOk ? 0 : 1);
