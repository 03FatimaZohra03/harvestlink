import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword } from "../../../../lib/password";
import { signSession, SESSION_COOKIE, SESSION_EXPIRY } from "../../../../lib/session";
import { loginSchema } from "../../../../lib/validations";


export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, name: true, accountType: true, passwordHash: true, isActive: true },
    });

    // Do NOT differentiate "email not found" vs "wrong password"
    if (!user || !user.isActive) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const token = await signSession({
      sub: user.id,
      email: user.email,
      accountType: user.accountType as "SELLER" | "BUYER",
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, accountType: user.accountType },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY,
    });
    return res;
  } catch (err) {
    console.error("[login] internal error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
