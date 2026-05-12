export const dynamic = "force-dynamic";
// app/api/admin/results/route.ts — v8 total score formula
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { computeFinalScore, MAX_TOTAL_SCORE, getCurrentVotePeriod } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = getCurrentVotePeriod();
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(current.month), 10);
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(current.year), 10);

  try {
    const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
    const resultsByCategory: Record<string, any[]> = {};

    for (const cat of categories) {
      const votes = await prisma.vote.findMany({
        where: { categoryId: cat.id, voteMonth: month, voteYear: year },
        include: { candidate: true },
      });

      // Aggregate per candidate — averageRating field now holds totalScore
      const candidateMap = new Map<string, {
        name: string; dept: string; role: string | null;
        voteCount: number; totalScoreSum: number;
      }>();

      for (const vote of votes) {
        const ex = candidateMap.get(vote.candidateId);
        if (ex) {
          ex.voteCount += 1;
          ex.totalScoreSum += vote.averageRating; // stored as total
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

      const maxVotes = Math.max(...Array.from(candidateMap.values()).map(v => v.voteCount), 1);

      const results = Array.from(candidateMap.entries()).map(([id, data]) => {
        // Average total score across all votes received
        const avgTotalScore = data.totalScoreSum / data.voteCount;
        const finalScore = computeFinalScore(avgTotalScore, data.voteCount, maxVotes);

        return {
          employeeId: id,
          employeeName: data.name,
          department: data.dept,
          role: data.role,
          category: cat.name,
          totalVotes: data.voteCount,
          totalScore: Math.round(avgTotalScore * 100) / 100, // avg total score out of 25
          maxPossibleScore: MAX_TOTAL_SCORE,
          finalScore,
        };
      });

      results.sort((a, b) => b.finalScore - a.finalScore);
      resultsByCategory[cat.name] = results.map((r, i) => ({ ...r, rank: i + 1 }));
    }

    const totalVotes = await prisma.vote.count({ where: { voteMonth: month, voteYear: year } });
    const totalVoters = await prisma.vote.groupBy({
      by: ["voterEmployeeId"],
      where: { voteMonth: month, voteYear: year },
      _count: true,
    });

    return NextResponse.json({ month, year, totalVotes, uniqueVoters: totalVoters.length, results: resultsByCategory });
  } catch (error) {
    console.error("[GET /api/admin/results]", error);
    return NextResponse.json({ error: "Failed to compute results" }, { status: 500 });
  }
}
