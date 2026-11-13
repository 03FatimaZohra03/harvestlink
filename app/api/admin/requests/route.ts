import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin-auth-server";
import { serializeRequest } from "../../../../lib/request-serializers";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "20")));
  const skip = (page - 1) * pageSize;
  const status = url.searchParams.get("status");

  const where = status ? { status: status as "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED" } : {};

  const [requests, total] = await Promise.all([
    prisma.produceRequest.findMany({
      where,
      include: {
        produce: { include: { category: true } },
        buyer: { select: { id: true, name: true, businessName: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.produceRequest.count({ where }),
  ]);

  const serialized = requests.map((r) => ({
    ...serializeRequest(r),
    buyer: r.buyer ? {
      id: r.buyer.id, name: r.buyer.name, businessName: r.buyer.businessName, city: r.buyer.city,
    } : null,
  }));

  return NextResponse.json({
    ok: true,
    requests: serialized,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
