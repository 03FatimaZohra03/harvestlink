const BASE = "http://localhost:3000";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

const results = [];

// Test 1: /api/auth/me without cookie -> 401
let r = await req("/api/auth/me");
results.push({ name: "1. /api/auth/me without cookie -> 401", ok: r.status === 401 });

// Test 2: Register a Seller
const sellerEmail = `seller-test-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: sellerEmail, password: "testpassword123", name: "Test Seller",
    accountType: "SELLER", city: "Test City", pincode: "560001"
  }),
});
const sellerCookie = r.headers.get("set-cookie");
results.push({ name: "2. Register Seller -> 200 + cookie", ok: r.status === 200 && r.body.ok === true && !!sellerCookie });

// Test 3: /api/auth/me with Seller cookie
r = await req("/api/auth/me", { headers: { Cookie: sellerCookie } });
results.push({ name: "3. /api/auth/me with cookie -> 200 + SELLER", ok: r.status === 200 && r.body.user?.accountType === "SELLER" });

// Test 4: Register same email again -> 409
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: sellerEmail, password: "testpassword123", name: "Dup", accountType: "SELLER"
  }),
});
results.push({ name: "4. Duplicate email -> 409 EMAIL_TAKEN", ok: r.status === 409 && r.body.error === "EMAIL_TAKEN" });

// Test 5: Login with wrong password -> 401 INVALID_CREDENTIALS
r = await req("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: sellerEmail, password: "wrongpassword" }),
});
results.push({ name: "5. Wrong password -> 401 INVALID_CREDENTIALS", ok: r.status === 401 && r.body.error === "INVALID_CREDENTIALS" });

// Test 6: Login with non-existent email -> same 401 message (no enumeration)
r = await req("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "nonexistent@example.com", password: "anything" }),
});
results.push({ name: "6. Non-existent email -> same 401 INVALID_CREDENTIALS", ok: r.status === 401 && r.body.error === "INVALID_CREDENTIALS" });

// Test 7: Login with correct password -> 200 + cookie
r = await req("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: sellerEmail, password: "testpassword123" }),
});
results.push({ name: "7. Correct login -> 200 + cookie", ok: r.status === 200 && r.body.ok === true && !!r.headers.get("set-cookie") });

// Test 8: Register with short password -> 400 VALIDATION
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `short-${Date.now()}@example.com`, password: "abc", name: "Short", accountType: "BUYER"
  }),
});
results.push({ name: "8. Short password -> 400 VALIDATION", ok: r.status === 400 && r.body.error === "VALIDATION" });

// Test 9: Register a Buyer
const buyerEmail = `buyer-test-${Date.now()}@example.com`;
r = await req("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: buyerEmail, password: "testpassword123", name: "Test Buyer", accountType: "BUYER"
  }),
});
results.push({ name: "9. Register Buyer -> 200", ok: r.status === 200 && r.body.user?.accountType === "BUYER" });

// Test 10: /dashboard without cookie -> 302 redirect to /login
r = await req("/dashboard", { redirect: "manual" });
results.push({ name: "10. /dashboard without cookie -> redirect to /login", ok: r.status === 307 || r.status === 308 || (r.headers.get("location") || "").includes("/login") });

// Test 11: Logout
r = await req("/logout", { method: "POST", redirect: "manual" });
results.push({ name: "11. Logout -> redirect + cleared cookie", ok: (r.status === 307 || r.status === 308 || r.status === 303) && (r.headers.get("set-cookie") || "").includes("hl_session=") });

console.log("\n=== Day 2 Verification ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "[ok]" : "[FAIL]"} ${r.name}`);
  if (!r.ok) allOk = false;
}
console.log(`\n${allOk ? "ALL PASSED" : "SOME FAILED"}`);
process.exit(allOk ? 0 : 1);
