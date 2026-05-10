// app/api/admin/audit-logs/route.ts
// Super Admin sees ALL logs — Admin sees only their own
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 50;

  // Super Admin sees all, Admin sees only their own
  const where = admin.role === "SUPER_ADMIN" ? {} : { adminId: admin.id };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { admin: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
    viewingOwn: admin.role !== "SUPER_ADMIN",
  });
}
