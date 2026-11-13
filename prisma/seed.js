import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const REQUIRED_VARS = ["DATABASE_URL_UNPOOLED", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

function isEmptyValue(value) {
  return value === undefined || value === null || value === "" || value === "__TODO_USER_FILLS_THIS__";
}

function failEnv(missing) {
  for (const key of missing) {
    console.log(`[env] ${key}: MISSING`);
  }
  process.exitCode = 1;
}

async function main() {
  const missing = REQUIRED_VARS.filter((key) => isEmptyValue(process.env[key]));

  if (missing.length) {
    failEnv(missing);
    return;
  }

  console.log("[env] DATABASE_URL_UNPOOLED: present");
  console.log("[env] ADMIN_EMAIL: present");
  console.log("[env] ADMIN_PASSWORD: present");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const prisma = new PrismaClient({ adapter });

  try {
    const categories = [
      { name: "Vegetables", description: "Fresh vegetables and seasonal produce" },
      { name: "Fruits", description: "Fresh fruits and seasonal fruit" },
      { name: "Grains", description: "Cereal grains and pulses" },
      { name: "Dairy", description: "Milk and dairy products" },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: { name: category.name, description: category.description },
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPasswordHash = bcrypt.hashSync(adminPassword, 12);

    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        name: "Administrator",
        role: "admin",
        passwordHash: adminPasswordHash,
      },
      create: {
        email: adminEmail,
        name: "Administrator",
        role: "admin",
        passwordHash: adminPasswordHash,
      },
    });

    const cats = await prisma.category.findMany();
    if (cats.length !== 4) {
      console.log(`[verify] FAILED: category count = ${cats.length}, expected 4`);
      process.exitCode = 1;
      return;
    }

    const catNames = new Set(cats.map((cat) => cat.name));
    if (catNames.size !== 4 || !catNames.has("Vegetables") || !catNames.has("Fruits") || !catNames.has("Grains") || !catNames.has("Dairy")) {
      console.log("[verify] FAILED: category names do not match expected set");
      process.exitCode = 1;
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      console.log("[verify] FAILED: admin record not found");
      process.exitCode = 1;
      return;
    }
    if (admin.role !== "admin") {
      console.log("[verify] FAILED: admin role is not admin");
      process.exitCode = 1;
      return;
    }
    if (!bcrypt.compareSync(adminPassword, admin.passwordHash)) {
      console.log("[verify] FAILED: password hash does not verify");
      process.exitCode = 1;
      return;
    }

    console.log("[seed] 4 categories seeded & verified");
    console.log("[seed] admin seeded & verified");
    console.log("[seed] password hash verified");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
