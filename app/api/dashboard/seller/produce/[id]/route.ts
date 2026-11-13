import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser, requireSeller } from "../../../../../../lib/auth-server";
import { updateProduceSchema } from "../../../../../../lib/validations-produce";
import { serializeProduce } from "../../../../../../lib/produce-serializers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const produce = await prisma.produce.findFirst({
    where: { id, sellerId: auth.sub },
    include: { category: true },
  });
  if (!produce) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, produce: serializeProduce(produce) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = updateProduceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Verify ownership before update — return 404 for non-owners (no leakage)
  const existing = await prisma.produce.findFirst({ where: { id, sellerId: user.sub } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Build update object — only include provided fields
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.categoryId !== undefined) {
    const cat = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!cat) return NextResponse.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 400 });
    updateData.categoryId = input.categoryId;
  }
  if (input.quantityAvailable !== undefined) updateData.quantityAvailable = input.quantityAvailable;
  if (input.quantityUnit !== undefined) updateData.quantityUnit = input.quantityUnit;
  if (input.pricePerUnit !== undefined) updateData.pricePerUnit = input.pricePerUnit;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.locationText !== undefined) updateData.locationText = input.locationText;
  if (input.city !== undefined) updateData.city = input.city || null;
  if (input.state !== undefined) updateData.state = input.state || null;
  if (input.pincode !== undefined) updateData.pincode = input.pincode || null;
  if (input.harvestDate !== undefined) updateData.harvestDate = input.harvestDate ? new Date(input.harvestDate) : null;
  if (input.availableUntil !== undefined) updateData.availableUntil = new Date(input.availableUntil);
  if (input.pickupNotes !== undefined) updateData.pickupNotes = input.pickupNotes || null;
  if (input.imageUrls !== undefined) updateData.imageUrls = input.imageUrls;

  const updated = await prisma.produce.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return NextResponse.json({ ok: true, produce: serializeProduce(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  // Verify ownership before soft-delete
  const existing = await prisma.produce.findFirst({ where: { id, sellerId: auth.sub } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Soft delete — mark as EXPIRED, do NOT actually delete from DB
  const updated = await prisma.produce.update({
    where: { id },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}
