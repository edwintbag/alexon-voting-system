// app/api/admin/results/route.ts — v3 dynamic categories
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { computeFinalScore, getCurrentVotePeriod } from "@/lib/scoring";

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

      const candidateMap = new Map<string, { name: string; dept: string; voteCount: number; ratingSum: number }>();
      for (const vote of votes) {
        const ex = candidateMap.get(vote.candidateId);
        if (ex) { ex.voteCount += 1; ex.ratingSum += vote.averageRating; }
        else candidateMap.set(vote.candidateId, { name: vote.candidate.name, dept: vote.candidate.department, voteCount: 1, ratingSum: vote.averageRating });
      }

      const maxVotes = Math.max(...Array.from(candidateMap.values()).map(v => v.voteCount), 1);
      const results = Array.from(candidateMap.entries()).map(([id, d]) => {
        const avgRating = d.ratingSum / d.voteCount;
        return { employeeId: id, employeeName: d.name, department: d.dept, category: cat.name, totalVotes: d.voteCount, averageRating: Math.round(avgRating * 100) / 100, finalScore: computeFinalScore(avgRating, d.voteCount, maxVotes) };
      });
      results.sort((a, b) => b.finalScore - a.finalScore);
      resultsByCategory[cat.name] = results.map((r, i) => ({ ...r, rank: i + 1 }));
    }

    const totalVotes = await prisma.vote.count({ where: { voteMonth: month, voteYear: year } });
    const totalVoters = await prisma.vote.groupBy({ by: ["voterEmployeeId"], where: { voteMonth: month, voteYear: year }, _count: true });

    return NextResponse.json({ month, year, totalVotes, uniqueVoters: totalVoters.length, results: resultsByCategory });
  } catch (error) {
    console.error("[GET /api/admin/results]", error);
    return NextResponse.json({ error: "Failed to compute results" }, { status: 500 });
  }
}
