// app/api/admin/categories/route.ts — Full CRUD for categories
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

// POST — create new category (Super Admin only)
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  // Check unique
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });

  // Get next order
  const last = await prisma.category.findFirst({ orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;

  const category = await prisma.category.create({ data: { name, description: description || null, order } });
  await logAudit(admin.id, "CREATE_CATEGORY", { name });
  return NextResponse.json({ success: true, category }, { status: 201 });
}

// PATCH — edit category or add/remove members
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, description, isActive, addMemberId, removeMemberId, isLeader } = await req.json();
  if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

  // Add member
  if (addMemberId) {
    const existing = await prisma.categoryMember.findUnique({ where: { categoryId_employeeId: { categoryId: id, employeeId: addMemberId } } });
    if (existing) return NextResponse.json({ error: "Employee is already in this category" }, { status: 409 });
    await prisma.categoryMember.create({ data: { categoryId: id, employeeId: addMemberId, isLeader: isLeader ?? false } });
    await logAudit(admin.id, "ADD_CATEGORY_MEMBER", { categoryId: id, employeeId: addMemberId });
    return NextResponse.json({ success: true });
  }

  // Remove member
  if (removeMemberId) {
    await prisma.categoryMember.deleteMany({ where: { categoryId: id, employeeId: removeMemberId } });
    await logAudit(admin.id, "REMOVE_CATEGORY_MEMBER", { categoryId: id, employeeId: removeMemberId });
    return NextResponse.json({ success: true });
  }

  // Update category details
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });

  await logAudit(admin.id, "EDIT_CATEGORY", { id, name });
  return NextResponse.json({ success: true, category });
}

// DELETE — delete category (Super Admin only)
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { votes: true } } } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (category._count.votes > 0) {
    // Has votes — just deactivate
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    await logAudit(admin.id, "DEACTIVATE_CATEGORY", { id, name: category.name });
    return NextResponse.json({ success: true, message: "Category deactivated (has existing votes)" });
  }

  // No votes — hard delete
  await prisma.categoryMember.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  await logAudit(admin.id, "DELETE_CATEGORY", { id, name: category.name });
  return NextResponse.json({ success: true });
}
