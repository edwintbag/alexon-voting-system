export const dynamic = "force-dynamic";
// app/api/admin/categories/route.ts — fixed edit handler
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

// GET — list all categories with members
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      members: {
        include: { employee: { select: { id: true, name: true, staffNumber: true, department: true, role: true } } },
        orderBy: { employee: { name: "asc" } },
      },
      _count: { select: { members: true, votes: true } },
    },
  });
  return NextResponse.json({ categories });
}

// POST — create new category
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name = body.name?.trim();
  const description = body.description?.trim() || null;

  if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });

  const last = await prisma.category.findFirst({ orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;

  const category = await prisma.category.create({ data: { name, description, order } });
  await logAudit(admin.id, "CREATE_CATEGORY", { name });
  return NextResponse.json({ success: true, category }, { status: 201 });
}

// PATCH — edit name/description OR add/remove members OR toggle active
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, name, description, isActive, addMemberId, removeMemberId, isLeader } = body;

  if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

  // ── Add member ────────────────────────────────────
  if (addMemberId) {
    const existing = await prisma.categoryMember.findUnique({
      where: { categoryId_employeeId: { categoryId: id, employeeId: addMemberId } },
    });
    if (existing) return NextResponse.json({ error: "Employee is already in this category" }, { status: 409 });
    await prisma.categoryMember.create({
      data: { categoryId: id, employeeId: addMemberId, isLeader: isLeader ?? false },
    });
    await logAudit(admin.id, "ADD_CATEGORY_MEMBER", { categoryId: id, employeeId: addMemberId });
    return NextResponse.json({ success: true });
  }

  // ── Remove member ─────────────────────────────────
  if (removeMemberId) {
    await prisma.categoryMember.deleteMany({ where: { categoryId: id, employeeId: removeMemberId } });
    await logAudit(admin.id, "REMOVE_CATEGORY_MEMBER", { categoryId: id, employeeId: removeMemberId });
    return NextResponse.json({ success: true });
  }

  // ── Update name/description/active ────────────────
  const trimmedName = name?.trim();

  // Check name uniqueness only if name is being changed
  if (trimmedName) {
    const conflict = await prisma.category.findFirst({
      where: { name: trimmedName, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(trimmedName && { name: trimmedName }),
      ...(description !== undefined && { description: description || null }),
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });

  await logAudit(admin.id, "EDIT_CATEGORY", { id, name: trimmedName });
  return NextResponse.json({ success: true, category });
}

// DELETE — delete category
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { votes: true } } },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (category._count.votes > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    await logAudit(admin.id, "DEACTIVATE_CATEGORY", { id, name: category.name });
    return NextResponse.json({ success: true, message: "Category deactivated (has existing votes)" });
  }

  await prisma.categoryMember.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  await logAudit(admin.id, "DELETE_CATEGORY", { id, name: category.name });
  return NextResponse.json({ success: true });
}
