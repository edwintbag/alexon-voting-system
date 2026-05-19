export const dynamic = "force-dynamic";
// app/api/admin/publish/route.ts — fixed: strictly 1 winner per category
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { computeFinalScore, getCurrentVotePeriod } from "@/lib/scoring";

// GET — public, no auth needed
export async function GET(req: NextRequest) {
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");

  try {
    const where = month && year ? { month, year } : {};
    const winners = await prisma.publishedWinner.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { finalScore: "desc" }],
    });

    // Group by month/year — strictly 1 winner per category
    const grouped: Record<string, any> = {};
    for (const w of winners) {
      const key = `${w.year}-${String(w.month).padStart(2, "0")}`;
      if (!grouped[key]) {
        grouped[key] = { month: w.month, year: w.year, publishedAt: w.publishedAt, winners: [] };
      }
      // Only add if this category not already added (safety check)
      const alreadyHas = grouped[key].winners.find((x: any) => x.categoryId === w.categoryId);
      if (!alreadyHas) {
        grouped[key].winners.push(w);
      }
    }

    const periods = Object.values(grouped).sort((a: any, b: any) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );

    return NextResponse.json({ periods });
  } catch (error) {
    console.error("[GET /api/admin/publish]", error);
    return NextResponse.json({ error: "Failed to fetch winners" }, { status: 500 });
  }
}

// POST — publish winners (Super Admin only)
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const { month, year, message } = await req.json();
  if (!month || !year) return NextResponse.json({ error: "Month and year are required" }, { status: 400 });

  try {
    // ── Step 1: Delete ALL existing published winners for this month ──
    // This ensures a clean slate — exactly 1 winner per category
    await prisma.publishedWinner.deleteMany({ where: { month, year } });

    const categories = await prisma.category.findMany({ where: { isActive: true } });
    const published = [];

    for (const cat of categories) {
      // Get all votes for this category and period
      const votes = await prisma.vote.findMany({
        where: { categoryId: cat.id, voteMonth: month, voteYear: year },
        include: { candidate: true },
      });

      if (votes.length === 0) continue; // Skip categories with no votes

      // Aggregate per candidate
      const candidateMap = new Map<string, {
        name: string; dept: string; role: string | null;
        voteCount: number; totalScoreSum: number;
      }>();

      for (const vote of votes) {
        const ex = candidateMap.get(vote.candidateId);
        if (ex) {
          ex.voteCount += 1;
          ex.totalScoreSum += vote.averageRating; // stored as total score
        } else {
          candidateMap.set(vote.candidateId, {
            name: vote.candidate.name,
            dept: vote.candidate.department,
            role: vote.candidate.role,
            voteCount: 1,
            totalScoreSum: vote.averageRating,
          });
        }
      }

      // Find max votes for normalization
      const maxVotes = Math.max(...Array.from(candidateMap.values()).map(v => v.voteCount), 1);

      // ── Find THE ONE winner (highest final score only) ──
      let topWinnerId = "";
      let topWinner = null;
      let topScore = -1;

      for (const [id, data] of candidateMap.entries()) {
        const avgTotal = data.totalScoreSum / data.voteCount;
        const finalScore = computeFinalScore(avgTotal, data.voteCount, maxVotes);
        if (finalScore > topScore) {
          topScore = finalScore;
          topWinner = { ...data, avgTotal, finalScore };
          topWinnerId = id;
        }
      }

      if (!topWinner) continue;

      // ── Create exactly ONE winner record for this category ──
      const pw = await prisma.publishedWinner.create({
        data: {
          employeeId: topWinnerId,
          employeeName: topWinner.name,
          categoryId: cat.id,
          categoryName: cat.name,
          department: topWinner.dept,
          role: topWinner.role,
          month,
          year,
          finalScore: topScore,
          averageRating: Math.round(topWinner.avgTotal * 100) / 100,
          totalVotes: topWinner.voteCount,
          message: message || null,
          publishedById: admin.id,
        },
      });

      published.push(pw);
    }

    await logAudit(admin.id, "PUBLISH_WINNERS", {
      month, year,
      categoriesPublished: published.length,
      winnersCount: published.length,
    });

    return NextResponse.json({
      success: true,
      published: published.length,
      message: `${published.length} winner${published.length !== 1 ? "s" : ""} published — one per category.`,
      winners: published,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/publish]", error);
    return NextResponse.json({ error: "Failed to publish winners: " + error.message }, { status: 500 });
  }
}

// DELETE — unpublish a specific month (Super Admin only)
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { month, year } = await req.json();
  if (!month || !year) return NextResponse.json({ error: "Month and year required" }, { status: 400 });

  const deleted = await prisma.publishedWinner.deleteMany({ where: { month, year } });
  await logAudit(admin.id, "UNPUBLISH_WINNERS", { month, year, count: deleted.count });

  return NextResponse.json({ success: true, removed: deleted.count });
}
