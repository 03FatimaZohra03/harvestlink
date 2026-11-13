import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/password";
import { signSession, SESSION_COOKIE, SESSION_EXPIRY } from "../../../../lib/session";
import { registerSchema } from "../../../../lib/validations";


export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        accountType: input.accountType,
        phone: input.phone ?? null,
        businessName: input.businessName ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        pincode: input.pincode ?? null,
      },
      select: { id: true, email: true, name: true, accountType: true },
    });

    const token = await signSession({
      sub: user.id,
      email: user.email,
      accountType: input.accountType as "SELLER" | "BUYER",
    });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY,
    });
    return res;
  } catch (err) {
    console.error("[register] internal error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
