// Helper: get the current user from the request cookie (for API routes).
// This is the same pattern as /api/auth/me but inlined for reuse.
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE, type SessionPayload } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return await verifySession(token);
}

export async function requireSeller(): Promise<SessionPayload | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED", status: 401 };
  if (user.accountType !== "SELLER") return { error: "FORBIDDEN", status: 403 };
  return user;
}

export async function requireBuyer(): Promise<SessionPayload | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED", status: 401 };
  if (user.accountType !== "BUYER") return { error: "FORBIDDEN", status: 403 };
  return user;
}
