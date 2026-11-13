import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin-auth-server";
import { serializeProduce } from "../../../../lib/produce-serializers";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "20")));
  const skip = (page - 1) * pageSize;
  const status = url.searchParams.get("status"); // AVAILABLE | RESERVED | SOLD | EXPIRED
  const search = url.searchParams.get("search") || undefined;

  const where = {
    ...(status ? { status: status as "AVAILABLE" | "RESERVED" | "SOLD" | "EXPIRED" } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [produce, total] = await Promise.all([
    prisma.produce.findMany({
      where,
      include: {
        category: true,
        seller: { select: { id: true, name: true, businessName: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
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
