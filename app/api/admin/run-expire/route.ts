import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin-auth-server";

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const produceUpdate = await tx.produce.updateMany({
        where: { status: "AVAILABLE", availableUntil: { lt: now } },
        data: { status: "EXPIRED" },
      });

      const requestUpdate = await tx.produceRequest.updateMany({
        where: {
          status: "PENDING",
          produce: { status: "EXPIRED" },
        },
        data: {
          status: "REJECTED",
          respondedAt: now,
        },
      });

      return {
        expiredProduce: produceUpdate.count,
        rejectedRequests: requestUpdate.count,
      };
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[run-expire] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
