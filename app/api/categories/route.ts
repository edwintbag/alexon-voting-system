// app/api/categories/route.ts — GET all active categories
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { _count: { select: { members: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
