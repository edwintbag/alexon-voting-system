// app/api/admin/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { getCurrentVotePeriod } from "@/lib/scoring";

// GET — list all comments with moderation status
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(getCurrentVotePeriod().month));
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(getCurrentVotePeriod().year));

  const votes = await prisma.vote.findMany({
    where: { voteMonth: month, voteYear: year, comment: { not: null } },
    include: {
      candidate: { select: { name: true, department: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get moderation records
  const voteIds = votes.map(v => v.id);
  const moderations = await prisma.commentModeration.findMany({
    where: { voteId: { in: voteIds } },
  });
  const modMap = new Map(moderations.map(m => [m.voteId, m]));

  const comments = votes.map(v => ({
    voteId: v.id,
    comment: v.comment,
    candidateName: v.candidate.name,
    categoryName: v.category.name,
    createdAt: v.createdAt,
    moderation: modMap.get(v.id) ?? null,
  }));

  return NextResponse.json({ comments, month, year });
}

// PATCH — hide/flag/unhide a comment
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { voteId, isHidden, isFlagged, reason } = await req.json();
  if (!voteId) return NextResponse.json({ error: "voteId required" }, { status: 400 });

  const moderation = await prisma.commentModeration.upsert({
    where: { voteId },
    create: { voteId, isHidden: isHidden ?? false, isFlagged: isFlagged ?? false, reason: reason ?? null, reviewedById: admin.id, reviewedAt: new Date() },
    update: {
      ...(typeof isHidden === "boolean" && { isHidden }),
      ...(typeof isFlagged === "boolean" && { isFlagged }),
      ...(reason !== undefined && { reason }),
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await logAudit(admin.id, isHidden ? "HIDE_COMMENT" : "UNHIDE_COMMENT", { voteId, reason });
  return NextResponse.json({ success: true, moderation });
}
