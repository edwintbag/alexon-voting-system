export const dynamic = "force-dynamic";
// app/api/votes/progress/route.ts — only count categories with members
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentVotePeriod } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const voterEmployeeId = req.nextUrl.searchParams.get("voterEmployeeId");
  if (!voterEmployeeId) {
    return NextResponse.json({ error: "Missing voterEmployeeId" }, { status: 400 });
  }

  const { month, year } = getCurrentVotePeriod();

  try {
    // Only count categories that are active AND have at least one eligible member
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        members: {
          some: {
            employee: { isActive: true, isExcluded: false }
          }
        }
      },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            members: {
              where: {
                employee: { isActive: true, isExcluded: false }
              }
            }
          }
        }
      },
    });

    // Get votes already cast this month
    const votes = await prisma.vote.findMany({
      where: { voterEmployeeId, voteMonth: month, voteYear: year },
      select: { categoryId: true },
    });

    const votedCategoryIds = new Set(votes.map(v => v.categoryId));

    const progress = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      memberCount: cat._count.members,
      hasVoted: votedCategoryIds.has(cat.id),
    }));

    const totalCategories = categories.length;
    const votedCount = progress.filter(p => p.hasVoted).length;
    const allDone = votedCount >= totalCategories;
    const nextCategory = progress.find(p => !p.hasVoted) ?? null;

    return NextResponse.json({
      progress,
      totalCategories,
      votedCount,
      allDone,
      nextCategory,
      month,
      year,
    });
  } catch (error) {
    console.error("[GET /api/votes/progress]", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
