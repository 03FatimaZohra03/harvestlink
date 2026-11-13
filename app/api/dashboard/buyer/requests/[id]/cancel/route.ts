import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { requireBuyer } from "../../../../../../../lib/auth-server";
import { serializeRequest } from "../../../../../../../lib/request-serializers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBuyer();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  // Verify ownership
  const existing = await prisma.produceRequest.findFirst({
    where: { id, buyerId: auth.sub },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Can only cancel if PENDING or ACCEPTED
  if (existing.status !== "PENDING" && existing.status !== "ACCEPTED") {
    return NextResponse.json({ ok: false, error: "CANNOT_CANCEL", detail: `Request status is ${existing.status}. Can only cancel PENDING or ACCEPTED requests.` }, { status: 409 });
  }

  // If the request was ACCEPTED, the produce is currently RESERVED — revert it to AVAILABLE
  // (PENDING cancellations don't need this since the produce was never reserved)
  const wasAccepted = existing.status === "ACCEPTED";

  // Use a transaction: cancel the request + revert produce status if needed
  const [updated] = await prisma.$transaction([
    prisma.produceRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { produce: { include: { category: true } } },
    }),
    ...(wasAccepted ? [
      prisma.produce.update({
        where: { id: existing.produceId },
        data: { status: "AVAILABLE" },
      }),
    ] : []),
  ]);

  return NextResponse.json({ ok: true, request: serializeRequest(updated) });
}
