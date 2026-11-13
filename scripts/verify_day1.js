import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const required = ["DATABASE_URL_UNPOOLED"];

for (const k of required) {
  if (!process.env[k] || process.env[k].length === 0) {
    console.error(`[env] ${k}: MISSING`);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  process.exit(0);
}

(async () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.user.count();
    const produceCount = await prisma.produce.count();
    const requestCount = await prisma.produceRequest.count();
    const pickupCount = await prisma.pickup.count();

    // Day 0 data integrity check
    const categoryCount = await prisma.category.count();
    const adminCount = await prisma.admin.count();

    const checks = [
      { name: "User table readable", ok: typeof userCount === "number" },
      { name: "Produce table readable", ok: typeof produceCount === "number" },
      { name: "ProduceRequest table readable", ok: typeof requestCount === "number" },
      { name: "Pickup table readable", ok: typeof pickupCount === "number" },
      { name: "Day 0 categories intact (4)", ok: categoryCount === 4 },
      { name: "Day 0 admin intact (1)", ok: adminCount === 1 },
    ];

    let allOk = true;

    for (const c of checks) {
      console.log(`[verify] ${c.name}: ${c.ok ? "ok" : "FAIL"}`);
      if (!c.ok) allOk = false;
    }

    console.log(`[verify] row counts: users=${userCount} produce=${produceCount} requests=${requestCount} pickups=${pickupCount} categories=${categoryCount} admins=${adminCount}`);

    if (!allOk) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("[verify] ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
