// app/api/admin/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { getCurrentVotePeriod } from "@/lib/scoring";
import { CATEGORY_LABELS, DEPARTMENT_LABELS } from "@/types";

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = getCurrentVotePeriod();
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(current.month), 10);
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(current.year), 10);

  const votes = await prisma.vote.findMany({
    where: { voteMonth: month, voteYear: year },
    include: { candidate: true, ratings: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  const headers = ["Vote ID","Month","Year","Category","Voter Department","Candidate Name","Candidate Department","Average Rating","Comment","Submitted At"];
  const rows = [headers.map(escapeCsv).join(",")];

  for (const vote of votes) {
    rows.push([
      vote.id, MONTH_NAMES[vote.voteMonth], vote.voteYear,
      CATEGORY_LABELS[vote.category as keyof typeof CATEGORY_LABELS] ?? vote.category,
      DEPARTMENT_LABELS[vote.voterDepartment as keyof typeof DEPARTMENT_LABELS] ?? vote.voterDepartment,
      vote.candidate.name,
      DEPARTMENT_LABELS[vote.candidate.department as keyof typeof DEPARTMENT_LABELS] ?? vote.candidate.department,
      vote.averageRating.toFixed(2), vote.comment ?? "", vote.createdAt.toISOString(),
    ].map(escapeCsv).join(","));
  }

  await logAudit(admin.id, "EXPORT_CSV", { month, year });

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alexon-votes-${MONTH_NAMES[month]}-${year}.csv"`,
    },
  });
}
