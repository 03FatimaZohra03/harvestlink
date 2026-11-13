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

  // Find the request, ensuring the linked produce is owned by this seller
  const existing = await prisma.produceRequest.findFirst({
    where: { id, produce: { sellerId: auth.sub } },
    include: { produce: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Must be PENDING to accept
  if (existing.status !== "PENDING") {
    return NextResponse.json({
      ok: false,
      error: "CANNOT_ACCEPT",
      detail: `Request status is ${existing.status}. Can only accept PENDING requests.`
    }, { status: 409 });
  }

  // Produce must be AVAILABLE (not already reserved/sold/expired)
  if (existing.produce.status !== "AVAILABLE") {
    return NextResponse.json({
      ok: false,
      error: "PRODUCE_NOT_AVAILABLE",
      detail: `Produce status is ${existing.produce.status}. Cannot accept until produce is AVAILABLE.`
    }, { status: 409 });
  }

  // Use a transaction: update request + update produce atomically
  const [updated] = await prisma.$transaction([
    prisma.produceRequest.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
      include: {
        produce: { include: { category: true } },
        buyer: { select: { id: true, name: true, businessName: true, city: true, phone: true } },
      },
    }),
    prisma.produce.update({
      where: { id: existing.produceId },
      data: { status: "RESERVED" },
    }),
  ]);

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
