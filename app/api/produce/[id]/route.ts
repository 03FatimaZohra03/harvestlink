import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { serializeProduce } from "../../../../lib/produce-serializers";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produce = await prisma.produce.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, businessName: true, city: true, state: true, phone: true } },
    },
  });
  if (!produce || produce.status === "EXPIRED") {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Check if the current user is the seller (for "Edit" button visibility)
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const isOwner = session?.sub === produce.sellerId;
  let canRequest = false;
  if (session && !isOwner && session.accountType === "BUYER" && produce.status === "AVAILABLE") {
    const existingPending = await prisma.produceRequest.findFirst({
      where: { buyerId: session.sub, produceId: produce.id, status: "PENDING" },
      select: { id: true },
    });
    canRequest = !existingPending;
  }

  return NextResponse.json({
    ok: true,
    produce: { ...serializeProduce(produce), isOwner, canRequest },
  });
}
