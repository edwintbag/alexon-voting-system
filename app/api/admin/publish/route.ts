// app/api/admin/publish/route.ts
// POST — publish winners for a month
// GET  — get published winners (public)

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

    // Group by month/year
    const grouped: Record<string, any> = {};
    for (const w of winners) {
      const key = `${w.year}-${String(w.month).padStart(2, "0")}`;
      if (!grouped[key]) {
        grouped[key] = { month: w.month, year: w.year, publishedAt: w.publishedAt, winners: [] };
      }
      grouped[key].winners.push(w);
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
    // Get all active categories
    const categories = await prisma.category.findMany({ where: { isActive: true } });

    const published = [];

    for (const cat of categories) {
      // Get votes for this category and period
      const votes = await prisma.vote.findMany({
        where: { categoryId: cat.id, voteMonth: month, voteYear: year },
        include: { candidate: true },
      });

      if (votes.length === 0) continue;

      // Aggregate per candidate
      const candidateMap = new Map<string, { name: string; dept: string; role: string | null; voteCount: number; ratingSum: number }>();
      for (const vote of votes) {
        const ex = candidateMap.get(vote.candidateId);
        if (ex) { ex.voteCount += 1; ex.ratingSum += vote.averageRating; }
        else candidateMap.set(vote.candidateId, { name: vote.candidate.name, dept: vote.candidate.department, role: vote.candidate.role, voteCount: 1, ratingSum: vote.averageRating });
      }

      const maxVotes = Math.max(...Array.from(candidateMap.values()).map(v => v.voteCount), 1);

      // Find winner (highest final score)
      let winner = null;
      let winnerScore = -1;
      let winnerId = "";

      for (const [id, data] of candidateMap.entries()) {
        const avgRating = data.ratingSum / data.voteCount;
        const finalScore = computeFinalScore(avgRating, data.voteCount, maxVotes);
        if (finalScore > winnerScore) {
          winnerScore = finalScore;
          winner = { ...data, avgRating, finalScore };
          winnerId = id;
        }
      }

      if (!winner) continue;

      // Upsert published winner
      const pw = await prisma.publishedWinner.upsert({
        where: { categoryId_month_year: { categoryId: cat.id, month, year } },
        create: {
          employeeId: winnerId,
          employeeName: winner.name,
          categoryId: cat.id,
          categoryName: cat.name,
          department: winner.dept,
          role: winner.role,
          month,
          year,
          finalScore: winnerScore,
          averageRating: Math.round(winner.avgRating * 100) / 100,
          totalVotes: winner.voteCount,
          message: message || null,
          publishedById: admin.id,
        },
        update: {
          employeeId: winnerId,
          employeeName: winner.name,
          finalScore: winnerScore,
          averageRating: Math.round(winner.avgRating * 100) / 100,
          totalVotes: winner.voteCount,
          message: message || null,
          publishedById: admin.id,
          publishedAt: new Date(),
        },
      });

      published.push(pw);
    }

    await logAudit(admin.id, "PUBLISH_WINNERS", { month, year, count: published.length });

    return NextResponse.json({ success: true, published: published.length, winners: published });
  } catch (error) {
    console.error("[POST /api/admin/publish]", error);
    return NextResponse.json({ error: "Failed to publish winners" }, { status: 500 });
  }
}
