export const dynamic = "force-dynamic";
// app/api/admin/reset/route.ts — Clear all test/pilot data
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const body = await req.json();
  const { confirmText } = body;

  if (confirmText !== "CLEAR TEST DATA") {
    return NextResponse.json({ error: 'Please type "CLEAR TEST DATA" to confirm' }, { status: 400 });
  }

  try {
    // Delete in correct order — respect foreign key constraints
    const ratings = await prisma.rating.deleteMany();
    const comments = await prisma.commentModeration.deleteMany();
    const votes = await prisma.vote.deleteMany();
    const winners = await prisma.publishedWinner.deleteMany();
    const results = await prisma.monthlyResult.deleteMany();
    const logs = await prisma.auditLog.deleteMany();

    // Log the reset after clearing (using admin session still active)
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "RESET_TEST_DATA",
        details: JSON.stringify({
          clearedBy: admin.email,
          clearedAt: new Date().toISOString(),
          deleted: {
            ratings: ratings.count,
            votes: votes.count,
            publishedWinners: winners.count,
            monthlyResults: results.count,
            commentModerations: comments.count,
            auditLogs: logs.count,
          }
        }),
      }
    });

    return NextResponse.json({
      success: true,
      message: "All pilot data cleared successfully. Employees, categories and settings are preserved.",
      deleted: {
        ratings: ratings.count,
        votes: votes.count,
        publishedWinners: winners.count,
        monthlyResults: results.count,
        commentModerations: comments.count,
        auditLogs: logs.count,
      }
    });
  } catch (error: any) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({
      error: "Reset failed: " + error.message,
      details: error.code ?? null,
    }, { status: 500 });
  }
}
