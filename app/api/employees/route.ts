// app/api/employees/route.ts
// GET /api/employees?search=name — verify voter by name match
// GET /api/employees?categoryId=xxx — get candidates for a category

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  try {
    // ── Voter name search (partial match) ─────────────
    if (search) {
      const searchTerms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (searchTerms.length < 2) {
        return NextResponse.json({ error: "Please enter at least 2 names" }, { status: 400 });
      }

      const allEmployees = await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, name: true, staffNumber: true, department: true, role: true },
      });

      // Partial match — all search terms must appear somewhere in the name
      const matches = allEmployees.filter((emp) => {
        const nameLower = emp.name.toLowerCase();
        return searchTerms.every((term) => nameLower.includes(term));
      });

      return NextResponse.json({ employees: matches });
    }

    // ── Candidates for a category ─────────────────────
    if (categoryId) {
      const members = await prisma.categoryMember.findMany({
        where: { categoryId, employee: { isActive: true, isExcluded: false } },
        include: {
          employee: { select: { id: true, name: true, staffNumber: true, department: true, role: true } },
        },
        orderBy: { employee: { name: "asc" } },
      });

      const candidates = members.map((m) => ({ ...m.employee, isLeader: m.isLeader }));
      return NextResponse.json({ employees: candidates });
    }

    return NextResponse.json({ error: "Provide search or categoryId param" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/employees]", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
