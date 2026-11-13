import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireSeller } from "../../../../../lib/auth-server";
import { serializeRequest } from "../../../../../lib/request-serializers";

export async function GET() {
  const auth = await requireSeller();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  // Find all requests where the linked produce is owned by this seller
  const [requests, stats] = await Promise.all([
    prisma.produceRequest.findMany({
      where: { produce: { sellerId: auth.sub } },
      include: {
        produce: { include: { category: true } },
        buyer: { select: { id: true, name: true, businessName: true, city: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.produceRequest.groupBy({
      by: ["status"],
      where: { produce: { sellerId: auth.sub } },
      _count: { status: true },
    }),
  ]);

  const statsObj: Record<string, number> = {
    PENDING: 0, ACCEPTED: 0, REJECTED: 0, CANCELLED: 0, COMPLETED: 0,
  };
  for (const s of stats) {
    statsObj[s.status] = s._count.status;
  }

  // Use serializeRequest but also include buyer info (extend manually)
  const serialized = requests.map((r) => ({
    ...serializeRequest(r),
    buyer: r.buyer ? {
      id: r.buyer.id,
      name: r.buyer.name,
      businessName: r.buyer.businessName,
      city: r.buyer.city,
      phone: r.buyer.phone,
    } : null,
  }));

  return NextResponse.json({
    ok: true,
    requests: serialized,
    stats: statsObj,
  });
}
