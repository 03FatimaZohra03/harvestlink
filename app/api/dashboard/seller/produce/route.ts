import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireSeller } from "../../../../../lib/auth-server";
import { createProduceSchema } from "../../../../../lib/validations-produce";
import { serializeProduce } from "../../../../../lib/produce-serializers";

export async function GET() {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const listings = await prisma.produce.findMany({
    where: { sellerId: auth.sub },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, produce: listings.map(serializeProduce) });
}

export async function POST(req: NextRequest) {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = createProduceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Verify category exists
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    return NextResponse.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 400 });
  }

  const produce = await prisma.produce.create({
    data: {
      sellerId: auth.sub,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description || null,
      quantityAvailable: input.quantityAvailable,
      quantityUnit: input.quantityUnit,
      pricePerUnit: input.pricePerUnit,
      currency: input.currency,
      locationText: input.locationText,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      harvestDate: input.harvestDate ? new Date(input.harvestDate) : null,
      availableUntil: new Date(input.availableUntil),
      pickupNotes: input.pickupNotes || null,
      imageUrls: input.imageUrls,
      status: "AVAILABLE",
    },
    include: { category: true },
  });

  return NextResponse.json({ ok: true, produce: serializeProduce(produce) }, { status: 201 });
}
