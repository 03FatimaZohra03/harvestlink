import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireBuyer } from "../../../../../lib/auth-server";
import { createRequestSchema } from "../../../../../lib/validations-request";
import { serializeRequest } from "../../../../../lib/request-serializers";

export async function GET() {
  const auth = await requireBuyer();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const [requests, stats] = await Promise.all([
    prisma.produceRequest.findMany({
      where: { buyerId: auth.sub },
      include: { produce: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.produceRequest.groupBy({
      by: ["status"],
      where: { buyerId: auth.sub },
      _count: { status: true },
    }),
  ]);

  // Convert stats array to object: { PENDING: 5, ACCEPTED: 2, ... }
  const statsObj: Record<string, number> = {
    PENDING: 0, ACCEPTED: 0, REJECTED: 0, CANCELLED: 0, COMPLETED: 0,
  };
  for (const s of stats) {
    statsObj[s.status] = s._count.status;
  }

  return NextResponse.json({
    ok: true,
    requests: requests.map(serializeRequest),
    stats: statsObj,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireBuyer();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Fetch produce with lock-like check
  const produce = await prisma.produce.findUnique({
    where: { id: input.produceId },
  });

  if (!produce) {
    return NextResponse.json({ ok: false, error: "PRODUCE_NOT_FOUND" }, { status: 404 });
  }

  // Produce must be AVAILABLE
  if (produce.status !== "AVAILABLE") {
    return NextResponse.json({ ok: false, error: "PRODUCE_NOT_AVAILABLE", detail: `Produce status is ${produce.status}` }, { status: 409 });
  }

  // Buyer cannot request their own produce (safety — shouldn't happen since accountType differs, but check anyway)
  if (produce.sellerId === auth.sub) {
    return NextResponse.json({ ok: false, error: "CANNOT_REQUEST_OWN_PRODUCE" }, { status: 400 });
  }

  // Quantity validation
  const requestedQty = Number(input.quantityRequested);
  const availableQty = Number(produce.quantityAvailable);
  if (requestedQty > availableQty) {
    return NextResponse.json({ ok: false, error: "QUANTITY_EXCEEDS_AVAILABLE", detail: `Requested ${requestedQty} but only ${availableQty} ${produce.quantityUnit} available` }, { status: 400 });
  }

  // Pickup time validation (if provided)
  if (input.proposedPickupTime) {
    const pickupTime = new Date(input.proposedPickupTime);
    const now = new Date();
    if (pickupTime <= now) {
      return NextResponse.json({ ok: false, error: "PICKUP_TIME_IN_PAST" }, { status: 400 });
    }
    if (pickupTime > produce.availableUntil) {
      return NextResponse.json({ ok: false, error: "PICKUP_AFTER_EXPIRY", detail: "Pickup time must be before produce expires" }, { status: 400 });
    }
  }

  // Check for existing PENDING request by this buyer for this produce
  const existingPending = await prisma.produceRequest.findFirst({
    where: {
      buyerId: auth.sub,
      produceId: input.produceId,
      status: "PENDING",
    },
  });
  if (existingPending) {
    return NextResponse.json({ ok: false, error: "PENDING_REQUEST_EXISTS", detail: "You already have a pending request for this produce. Cancel it first to send a new one." }, { status: 409 });
  }

  // Create the request
  const request = await prisma.produceRequest.create({
    data: {
      produceId: input.produceId,
      buyerId: auth.sub,
      quantityRequested: input.quantityRequested,
      proposedPricePerUnit: input.proposedPricePerUnit,
      currency: input.currency,
      proposedPickupTime: input.proposedPickupTime ? new Date(input.proposedPickupTime) : null,
      pickupLocationText: input.pickupLocationText || null,
      pickupNotes: input.pickupNotes || null,
      buyerMessage: input.buyerMessage || null,
      status: "PENDING",
    },
    include: { produce: { include: { category: true } } },
  });

  return NextResponse.json({ ok: true, request: serializeRequest(request) }, { status: 201 });
}
