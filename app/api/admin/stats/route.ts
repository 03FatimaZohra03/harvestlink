import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin-auth-server";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    usersByType,
    produceByStatus,
    requestsByStatus,
    newUsersToday,
    newProduceToday,
    newRequestsToday,
    expiredNotMarked,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["accountType"], _count: { accountType: true } }),
    prisma.produce.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.produceRequest.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.produce.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.produceRequest.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.produce.count({ where: { status: "AVAILABLE", availableUntil: { lt: new Date() } } }),
  ]);

  const usersByTypeObj: Record<string, number> = { SELLER: 0, BUYER: 0, LOGISTICS: 0 };
  for (const u of usersByType) usersByTypeObj[u.accountType] = u._count.accountType;

  const produceByStatusObj: Record<string, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, EXPIRED: 0 };
  for (const p of produceByStatus) produceByStatusObj[p.status] = p._count.status;

  const requestsByStatusObj: Record<string, number> = {
    PENDING: 0, ACCEPTED: 0, REJECTED: 0, CANCELLED: 0, COMPLETED: 0,
  };
  for (const r of requestsByStatus) requestsByStatusObj[r.status] = r._count.status;

  return NextResponse.json({
    ok: true,
    stats: {
      users: {
        total: usersByTypeObj.SELLER + usersByTypeObj.BUYER + usersByTypeObj.LOGISTICS,
        byType: usersByTypeObj,
      },
      produce: {
        total: produceByStatusObj.AVAILABLE + produceByStatusObj.RESERVED + produceByStatusObj.SOLD + produceByStatusObj.EXPIRED,
        byStatus: produceByStatusObj,
      },
      requests: {
        total: requestsByStatusObj.PENDING + requestsByStatusObj.ACCEPTED + requestsByStatusObj.REJECTED + requestsByStatusObj.CANCELLED + requestsByStatusObj.COMPLETED,
        byStatus: requestsByStatusObj,
      },
      today: {
        newUsers: newUsersToday,
        newProduce: newProduceToday,
        newRequests: newRequestsToday,
      },
      health: {
        expiredNotMarkedCount: expiredNotMarked,
      },
    },
  });
}
