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

  // Must be ACCEPTED to complete
  if (existing.status !== "ACCEPTED") {
    return NextResponse.json({
      ok: false,
      error: "CANNOT_COMPLETE",
      detail: `Request status is ${existing.status}. Can only complete ACCEPTED requests.`
    }, { status: 409 });
  }

  // Transaction: complete request + mark produce as SOLD
  const now = new Date();
  const [updated] = await prisma.$transaction([
    prisma.produceRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        // Ensure respondedAt is set (in case of legacy data)
        respondedAt: existing.respondedAt ?? now,
      },
      include: {
        produce: { include: { category: true } },
        buyer: { select: { id: true, name: true, businessName: true, city: true, phone: true } },
      },
    }),
    prisma.produce.update({
      where: { id: existing.produceId },
      data: { status: "SOLD" },
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
