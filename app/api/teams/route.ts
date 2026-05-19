export const dynamic = "force-dynamic";
// app/api/teams/route.ts — Get all vehicle/plant teams
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const teams = await prisma.vehicleTeam.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        members: {
          include: {
            employee: {
              select: { id: true, name: true, staffNumber: true }
            }
          },
          orderBy: { role: "asc" }
        },
        _count: { select: { votes: true } }
      }
    });
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("[GET /api/teams]", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
