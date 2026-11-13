import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin-auth-server";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "20")));
  const skip = (page - 1) * pageSize;
  const accountType = url.searchParams.get("accountType"); // SELLER | BUYER | LOGISTICS
  const search = url.searchParams.get("search") || undefined;

  const where = {
    ...(accountType ? { accountType: accountType as "SELLER" | "BUYER" | "LOGISTICS" } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { businessName: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, accountType: true, businessName: true,
        city: true, state: true, pincode: true, phone: true, isActive: true,
        createdAt: true, updatedAt: true,
        _count: { select: { produceListings: true, buyerRequests: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  // Serialize (remove nothing — admin can see all fields except passwordHash which we didn't select)
  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    users: serialized,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
