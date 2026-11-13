import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireBuyer } from "../../../../../../lib/auth-server";
import { serializeRequest } from "../../../../../../lib/request-serializers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBuyer();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const request = await prisma.produceRequest.findFirst({
    where: { id, buyerId: auth.sub },
    include: { produce: { include: { category: true } } },
  });
  if (!request) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, request: serializeRequest(request) });
}
