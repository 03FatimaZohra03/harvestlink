import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    console.error("[auto-expire] DATABASE_URL_UNPOOLED is not set");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const now = new Date();

    // Step 1: Find all AVAILABLE produce past their availableUntil
    const expiredProduce = await prisma.produce.findMany({
      where: { status: "AVAILABLE", availableUntil: { lt: now } },
      select: { id: true, name: true },
    });

    console.log(`[auto-expire] Found ${expiredProduce.length} produce items to expire.`);

    if (expiredProduce.length > 0) {
      // Use a transaction to update produce + auto-reject pending requests atomically
      const result = await prisma.$transaction(async (tx) => {
        // Update produce status to EXPIRED
        const produceUpdate = await tx.produce.updateMany({
          where: { status: "AVAILABLE", availableUntil: { lt: now } },
          data: { status: "EXPIRED" },
        });

        // Auto-reject PENDING requests on the expired produce
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

      console.log(`[auto-expire] Marked ${result.expiredProduce} produce as EXPIRED.`);
      console.log(`[auto-expire] Auto-rejected ${result.rejectedRequests} pending requests.`);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("[auto-expire] Nothing to expire. All produce statuses are up to date.");
      console.log(JSON.stringify({ expiredProduce: 0, rejectedRequests: 0 }, null, 2));
    }
  } catch (err) {
    console.error("[auto-expire] ERROR:", err instanceof Error ? err.message : "unknown");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
