import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "../../../../lib/session";


export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: { id: payload.sub, email: payload.email, accountType: payload.accountType },
  });
}
