import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireSeller } from "../../../../../../lib/auth-server";
import { serializeRequest } from "../../../../../../lib/request-serializers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const request = await prisma.produceRequest.findFirst({
    where: { id, produce: { sellerId: auth.sub } },
    include: {
      produce: { include: { category: true } },
      buyer: { select: { id: true, name: true, businessName: true, city: true, phone: true } },
    },
  });
  if (!request) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    request: {
      ...serializeRequest(request),
      buyer: request.buyer ? {
        id: request.buyer.id,
        name: request.buyer.name,
        businessName: request.buyer.businessName,
        city: request.buyer.city,
        phone: request.buyer.phone,
      } : null,
    },
  });
}
