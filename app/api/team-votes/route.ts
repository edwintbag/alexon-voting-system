export const dynamic = "force-dynamic";
// app/api/team-votes/route.ts — Submit a vote for a vehicle/plant team
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTotalScore, isVotingWindowOpenAsync, getCurrentVotePeriod } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  // Check if voter has already voted this month
  const voterEmployeeId = req.nextUrl.searchParams.get("voterEmployeeId");
  if (!voterEmployeeId) return NextResponse.json({ error: "Missing voterEmployeeId" }, { status: 400 });

  const { month, year } = getCurrentVotePeriod();
  const existing = await prisma.teamVote.findFirst({
    where: { voterEmployeeId, voteMonth: month, voteYear: year }
  });

  return NextResponse.json({ hasVoted: !!existing });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voterEmployeeId, teamId, ratings, comment } = body;

    if (!voterEmployeeId || !teamId || !ratings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Voting window check
    const windowOpen = await isVotingWindowOpenAsync();
    if (!windowOpen) {
      return NextResponse.json({ error: "Voting is not currently open." }, { status: 403 });
    }

    // Validate voter
    const voter = await prisma.employee.findUnique({
      where: { id: voterEmployeeId, isActive: true }
    });
    if (!voter) return NextResponse.json({ error: "Voter not found in system." }, { status: 404 });

    // Validate team exists
    const team = await prisma.vehicleTeam.findUnique({ where: { id: teamId, isActive: true } });
    if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    // Check voter is not a member of this team (no self-voting)
    const isMember = await prisma.vehicleTeamMember.findFirst({
      where: { teamId, employeeId: voterEmployeeId }
    });
    if (isMember) {
      return NextResponse.json({ error: "You cannot vote for your own team." }, { status: 400 });
    }

    // Duplicate vote check — one vote per month in this category
    const { month, year } = getCurrentVotePeriod();
    const existing = await prisma.teamVote.findFirst({
      where: { voterEmployeeId, voteMonth: month, voteYear: year }
    });
    if (existing) {
      return NextResponse.json({ error: "You have already voted in the Drivers & Operators category this month." }, { status: 409 });
    }

    // Compute total score
    const totalScore = computeTotalScore(ratings);

    // Create vote + ratings
    const vote = await prisma.$transaction(async (tx) => {
      const newVote = await tx.teamVote.create({
        data: {
          voterEmployeeId,
          teamId,
          voteMonth: month,
          voteYear: year,
          totalScore,
          comment: comment || null,
        }
      });
      await tx.teamRating.createMany({
        data: Object.entries(ratings).map(([criterion, score]) => ({
          voteId: newVote.id,
          criterion,
          score: score as number,
        }))
      });
      return newVote;
    });

    return NextResponse.json({ success: true, voteId: vote.id, totalScore }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/team-votes]", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You have already voted in this category this month." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
