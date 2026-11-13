import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword } from "../../../../lib/password";
import { signAdminSession, ADMIN_COOKIE, ADMIN_EXPIRY } from "../../../../lib/admin-auth-server";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  // Do NOT differentiate "email not found" vs "wrong password"
  if (!admin) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const ok = await comparePassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = await signAdminSession({ sub: admin.id, email: admin.email });

  const res = NextResponse.json({
    ok: true,
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_EXPIRY,
  });
  return res;
}
