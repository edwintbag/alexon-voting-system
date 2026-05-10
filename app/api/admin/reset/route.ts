export const dynamic = "force-dynamic";
// app/api/admin/reset/route.ts — Clear all test data (Super Admin only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const { confirmText } = await req.json();

  // Require confirmation text to prevent accidental reset
  if (confirmText !== "CLEAR TEST DATA") {
    return NextResponse.json({ error: 'Please type "CLEAR TEST DATA" to confirm' }, { status: 400 });
  }

  try {
    // Delete in correct order to respect foreign keys
    await prisma.rating.deleteMany();
    await prisma.commentModeration.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.publishedWinner.deleteMany();
    await prisma.monthlyResult.deleteMany();
    await prisma.auditLog.deleteMany();

    await logAudit(admin.id, "RESET_TEST_DATA", {
      clearedBy: admin.email,
      clearedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "All test data cleared. Employees, categories and settings are preserved.",
      cleared: ["votes", "ratings", "published winners", "monthly results", "audit logs", "comment moderations"],
    });
  } catch (error: any) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Failed to reset data: " + error.message }, { status: 500 });
  }
}
