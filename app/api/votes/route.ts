export const dynamic = "force-dynamic";
// app/api/votes/route.ts — v8 uses total score
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTotalScore, computeAvgRating, isVotingWindowOpenAsync, getCurrentVotePeriod } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voterEmployeeId, candidateId, categoryId, ratings, comment } = body;

    if (!voterEmployeeId || !candidateId || !categoryId || !ratings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Voting window check
    const windowOpen = await isVotingWindowOpenAsync();
    if (!windowOpen) {
      const { getVotingWindowStatus } = await import("@/lib/scoring");
      const status = await getVotingWindowStatus();
      return NextResponse.json({ error: status.message }, { status: 403 });
    }

    // Validate voter
    const voter = await prisma.employee.findUnique({ where: { id: voterEmployeeId, isActive: true } });
    if (!voter) return NextResponse.json({ error: "Voter not found in system." }, { status: 404 });

    // Validate candidate is in category
    const candidateMember = await prisma.categoryMember.findFirst({
      where: { categoryId, employeeId: candidateId, employee: { isActive: true, isExcluded: false } },
    });
    if (!candidateMember) return NextResponse.json({ error: "Candidate is not a member of this category." }, { status: 400 });

    // Self-vote prevention
    if (voterEmployeeId === candidateId) return NextResponse.json({ error: "You cannot vote for yourself." }, { status: 400 });

    // Duplicate vote check
    const { month, year } = getCurrentVotePeriod();
    const existing = await prisma.vote.findFirst({ where: { voterEmployeeId, categoryId, voteMonth: month, voteYear: year } });
    if (existing) return NextResponse.json({ error: "You have already voted in this category this month." }, { status: 409 });

    // Compute scores — store BOTH total and average
    const totalScore = computeTotalScore(ratings);
    const averageRating = computeAvgRating(ratings);

    // Create vote + ratings
    const vote = await prisma.$transaction(async (tx) => {
      const newVote = await tx.vote.create({
        data: {
          voterEmployeeId,
          candidateId,
          categoryId,
          voteMonth: month,
          voteYear: year,
          averageRating: totalScore, // Store total in averageRating field
          comment: comment || null,
        },
      });
      await tx.rating.createMany({
        data: Object.entries(ratings).map(([criterion, score]) => ({
          voteId: newVote.id,
          criterion,
          score: score as number,
        })),
      });
      return newVote;
    });

    return NextResponse.json({ success: true, voteId: vote.id, totalScore, averageRating }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/votes]", error);
    if (error.code === "P2002") return NextResponse.json({ error: "You have already voted in this category this month." }, { status: 409 });
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}
