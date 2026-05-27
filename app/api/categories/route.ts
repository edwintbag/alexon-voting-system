export const dynamic = "force-dynamic";
// app/api/categories/route.ts — only return active categories WITH members
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
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
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
