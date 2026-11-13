const BASE = "http://localhost:3000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

const results = [];

// Setup: register seller + 2 buyers
const sellerEmail = `seller-d6-${Date.now()}@example.com`;
const buyer1Email = `buyer1-d6-${Date.now()}@example.com`;
const buyer2Email = `buyer2-d6-${Date.now()}@example.com`;

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
  body: JSON.stringify({ email: buyer1Email, password: "testpassword123", name: "Buyer 1", accountType: "BUYER", city: "Bangalore" }),
});
const buyer1Cookie = r.headers.get("set-cookie");
results.push({ name: "2. Register buyer 1", ok: r.status === 200 && !!buyer1Cookie });

r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: buyer2Email, password: "testpassword123", name: "Buyer 2", accountType: "BUYER", city: "Bangalore" }),
});
const buyer2Cookie = r.headers.get("set-cookie");
results.push({ name: "3. Register buyer 2", ok: r.status === 200 && !!buyer2Cookie });

// Seller creates a produce listing
const availUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const categories = await req("/api/categories");
const firstCategoryId = categories.body.categories[0].id;

r = await req("/api/dashboard/seller/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: sellerCookie },
  body: JSON.stringify({
    name: "Day6 Tomatoes", categoryId: firstCategoryId,
    quantityAvailable: "50", quantityUnit: "kg", pricePerUnit: "30",
    locationText: "Farm plot", city: "Bangalore", pincode: "560001",
    availableUntil: availUntil,
  }),
});
const produceId = r.body.produce?.id;
results.push({ name: "4. Seller creates produce", ok: r.status === 201 && !!produceId });

// Both buyers send requests
const pickupTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyer1Cookie },
  body: JSON.stringify({ produceId, quantityRequested: "10", proposedPricePerUnit: "30", proposedPickupTime: pickupTime, buyerMessage: "From buyer 1" }),
});
const req1Id = r.body.request?.id;
results.push({ name: "5. Buyer 1 sends request -> 201", ok: r.status === 201 && !!req1Id });

r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyer2Cookie },
  body: JSON.stringify({ produceId, quantityRequested: "5", proposedPricePerUnit: "28", buyerMessage: "From buyer 2" }),
});
const req2Id = r.body.request?.id;
results.push({ name: "6. Buyer 2 sends request -> 201", ok: r.status === 201 && !!req2Id });

// Test 7: Seller lists incoming requests (should see 2)
r = await req("/api/dashboard/seller/requests", { headers: { Cookie: sellerCookie } });
results.push({
  name: "7. Seller lists requests -> 2 PENDING + stats",
  ok: r.status === 200 && r.body.requests?.length === 2 && r.body.stats?.PENDING === 2
});

// Test 8: Seller views single request detail
r = await req(`/api/dashboard/seller/requests/${req1Id}`, { headers: { Cookie: sellerCookie } });
results.push({
  name: "8. Seller views request detail -> buyer info included",
  ok: r.status === 200 && r.body.request?.buyer?.name === "Buyer 1"
});

// Test 9: Buyer 1 tries to access seller endpoint -> 403
r = await req(`/api/dashboard/seller/requests/${req1Id}`, { headers: { Cookie: buyer1Cookie } });
results.push({ name: "9. Buyer cannot access seller endpoint -> 403", ok: r.status === 403 });

// Test 10: Unauthenticated -> 401
r = await req(`/api/dashboard/seller/requests/${req1Id}`);
results.push({ name: "10. Unauthenticated -> 401", ok: r.status === 401 });

// Test 11: Seller accepts request 1 -> status=ACCEPTED, produce=RESERVED
r = await req(`/api/dashboard/seller/requests/${req1Id}/accept`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({
  name: "11. Seller accepts req1 -> 200 + ACCEPTED",
  ok: r.status === 200 && r.body.ok === true && r.body.request?.status === "ACCEPTED" && r.body.request?.respondedAt !== null
});

// Test 12: Verify produce is now RESERVED
r = await req(`/api/produce/${produceId}`);
results.push({ name: "12. Produce status after accept -> RESERVED", ok: r.status === 200 && r.body.produce?.status === "RESERVED" });

// Test 13: Buyer 2 tries to send ANOTHER request on RESERVED produce -> 409
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyer2Cookie },
  body: JSON.stringify({ produceId, quantityRequested: "3", proposedPricePerUnit: "30" }),
});
results.push({
  name: "13. New request on RESERVED produce -> 409 PRODUCE_NOT_AVAILABLE",
  ok: r.status === 409 && r.body.error === "PRODUCE_NOT_AVAILABLE"
});

// Test 14: Seller tries to ACCEPT request 2 (which is PENDING) but produce is RESERVED -> 409
r = await req(`/api/dashboard/seller/requests/${req2Id}/accept`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({
  name: "14. Seller accepts req2 (produce RESERVED) -> 409 PRODUCE_NOT_AVAILABLE",
  ok: r.status === 409 && r.body.error === "PRODUCE_NOT_AVAILABLE"
});

// Test 15: Seller can still REJECT request 2 (PENDING) even though produce is RESERVED
r = await req(`/api/dashboard/seller/requests/${req2Id}/reject`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({
  name: "15. Seller rejects req2 (produce RESERVED) -> 200 + REJECTED",
  ok: r.status === 200 && r.body.ok === true && r.body.request?.status === "REJECTED"
});

// Test 16: Seller tries to accept already-ACCEPTED request 1 -> 409
r = await req(`/api/dashboard/seller/requests/${req1Id}/accept`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({ name: "16. Accept already-accepted -> 409 CANNOT_ACCEPT", ok: r.status === 409 && r.body.error === "CANNOT_ACCEPT" });

// Test 17: Seller tries to reject already-ACCEPTED request 1 -> 409
r = await req(`/api/dashboard/seller/requests/${req1Id}/reject`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({ name: "17. Reject already-accepted -> 409 CANNOT_REJECT", ok: r.status === 409 && r.body.error === "CANNOT_REJECT" });

// Test 18: Seller cannot cancel (no cancel endpoint for seller) -> 404
r = await req(`/api/dashboard/seller/requests/${req1Id}/cancel`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({ name: "18. Seller cancel endpoint -> 404", ok: r.status === 404 });

// Test 19: Buyer 1 cancels ACCEPTED request -> request CANCELLED, produce reverts to AVAILABLE
r = await req(`/api/dashboard/buyer/requests/${req1Id}/cancel`, { method: "POST", headers: { Cookie: buyer1Cookie } });
results.push({
  name: "19. Buyer cancels ACCEPTED -> 200 + CANCELLED",
  ok: r.status === 200 && r.body.ok === true && r.body.request?.status === "CANCELLED"
});

// Test 20: Verify produce reverted to AVAILABLE
r = await req(`/api/produce/${produceId}`);
results.push({ name: "20. Produce reverts to AVAILABLE after cancel", ok: r.status === 200 && r.body.produce?.status === "AVAILABLE" });

// Test 21: Now buyer 2 can send a new request (produce is AVAILABLE, prior request was rejected)
// But buyer 2 has no pending request anymore (req2 was rejected, not pending)
r = await req("/api/dashboard/buyer/requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: buyer2Cookie },
  body: JSON.stringify({ produceId, quantityRequested: "5", proposedPricePerUnit: "30" }),
});
results.push({ name: "21. Buyer 2 sends new request -> 201", ok: r.status === 201 && r.body.ok === true });

// Test 22: Seller accepts new request, then completes it -> COMPLETED + SOLD
const req3Id = r.body.request?.id;
r = await req(`/api/dashboard/seller/requests/${req3Id}/accept`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({ name: "22. Seller accepts req3 -> ACCEPTED", ok: r.status === 200 && r.body.request?.status === "ACCEPTED" });

r = await req(`/api/dashboard/seller/requests/${req3Id}/complete`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({
  name: "23. Seller completes req3 -> COMPLETED + completedAt set",
  ok: r.status === 200 && r.body.request?.status === "COMPLETED" && r.body.request?.completedAt !== null
});

// Test 24: Verify produce is now SOLD
r = await req(`/api/produce/${produceId}`);
results.push({ name: "24. Produce status after complete -> SOLD", ok: r.status === 200 && r.body.produce?.status === "SOLD" });

// Test 25: Seller tries to complete already-completed -> 409
r = await req(`/api/dashboard/seller/requests/${req3Id}/complete`, { method: "POST", headers: { Cookie: sellerCookie } });
results.push({ name: "25. Complete already-completed -> 409 CANNOT_COMPLETE", ok: r.status === 409 && r.body.error === "CANNOT_COMPLETE" });

// Test 26: Buyer tries to cancel COMPLETED request -> 409
r = await req(`/api/dashboard/buyer/requests/${req3Id}/cancel`, { method: "POST", headers: { Cookie: buyer2Cookie } });
results.push({ name: "26. Cancel COMPLETED -> 409 CANNOT_CANCEL", ok: r.status === 409 && r.body.error === "CANNOT_CANCEL" });

console.log("\n=== Day 6 Verification ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "[ok]" : "[FAIL]"} ${r.name}`);
  if (!r.ok) allOk = false;
}
console.log(`\n${allOk ? "ALL PASSED" : "SOME FAILED"}`);
process.exit(allOk ? 0 : 1);
