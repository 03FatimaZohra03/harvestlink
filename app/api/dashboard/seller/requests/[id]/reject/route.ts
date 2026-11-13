import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { requireSeller } from "../../../../../../../lib/auth-server";
import { serializeRequest } from "../../../../../../../lib/request-serializers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const existing = await prisma.produceRequest.findFirst({
    where: { id, produce: { sellerId: auth.sub } },
    include: { produce: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Must be PENDING to reject
  if (existing.status !== "PENDING") {
    return NextResponse.json({
      ok: false,
      error: "CANNOT_REJECT",
      detail: `Request status is ${existing.status}. Can only reject PENDING requests.`
    }, { status: 409 });
  }

  // Rejecting does NOT change produce status (it was AVAILABLE, stays AVAILABLE)
  const updated = await prisma.produceRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      respondedAt: new Date(),
    },
    include: {
      produce: { include: { category: true } },
      buyer: { select: { id: true, name: true, businessName: true, city: true, phone: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      ...serializeRequest(updated),
      buyer: updated.buyer ? {
        id: updated.buyer.id,
        name: updated.buyer.name,
        businessName: updated.buyer.businessName,
        city: updated.buyer.city,
        phone: updated.buyer.phone,
      } : null,
    },
  });
}
