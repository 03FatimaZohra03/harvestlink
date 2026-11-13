import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "./session";
import { SignJWT } from "jose";

// Admin uses a SEPARATE cookie from regular users
const ADMIN_COOKIE_NAME = "hl_admin_session";
const ADMIN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours (shorter than user's 7 days)

export type AdminSessionPayload = {
  sub: string;
  email: string;
  role: "ADMIN";
};

export const ADMIN_COOKIE = ADMIN_COOKIE_NAME;
export const ADMIN_EXPIRY = ADMIN_EXPIRY_SECONDS;

// Sign a NEW admin-specific JWT (different accountType than user sessions)
export async function signAdminSession(payload: { sub: string; email: string }): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ ...payload, accountType: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_EXPIRY_SECONDS}s`)
    .sign(secretKey);
}

// Verify an admin token. Returns null for: missing, invalid, expired, or USER tokens (accountType != "ADMIN")
export async function verifyAdminSession(token: string | undefined): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  // verifySession returns SessionPayload with accountType cast to "SELLER"|"BUYER",
  // but the underlying JWT may have accountType:"ADMIN". Check via string comparison.
  if ((payload.accountType as string) !== "ADMIN") return null; // reject user tokens
  return {
    sub: payload.sub,
    email: payload.email,
    role: "ADMIN",
  };
}

// Helper for API routes — returns admin session or { error, status }
export async function requireAdmin(): Promise<AdminSessionPayload | { error: string; status: number }> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const admin = await verifyAdminSession(token);
  if (!admin) return { error: "UNAUTHORIZED", status: 401 };
  return admin;
}
