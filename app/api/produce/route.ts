import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { serializeProduce } from "../../../lib/produce-serializers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const categoryId = url.searchParams.get("categoryId");
  const city = url.searchParams.get("city") || undefined;
  const pincode = url.searchParams.get("pincode") || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const where = {
    status: "AVAILABLE" as const,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(pincode ? { pincode } : {}),
  };

  const [produce, total] = await Promise.all([
    prisma.produce.findMany({
      where,
      include: { category: true, seller: { select: { id: true, name: true, businessName: true, city: true, phone: true } } },
      orderBy: { availableUntil: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.produce.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    produce: produce.map(serializeProduce),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
