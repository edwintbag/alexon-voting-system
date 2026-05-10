// app/api/admin/employees/route.ts — Full CRUD for employees
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { Department } from "@prisma/client";

// GET — list all employees
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    orderBy: { staffNumber: "asc" },
    include: { _count: { select: { categoryMembers: true } } },
  });
  return NextResponse.json({ employees });
}

// POST — add new employee
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, department, role, isExcluded } = await req.json();
  if (!name || !department) return NextResponse.json({ error: "Name and department are required" }, { status: 400 });

  // Auto-generate staff number AX001 format
  const last = await prisma.employee.findFirst({ orderBy: { staffNumber: "desc" } });
  let nextNum = 1;
  if (last?.staffNumber) {
    const num = parseInt(last.staffNumber.replace("AX", ""), 10);
    nextNum = isNaN(num) ? 1 : num + 1;
  }
  const staffNumber = `AX${String(nextNum).padStart(3, "0")}`;

  const employee = await prisma.employee.create({
    data: { name, staffNumber, department: department as Department, role: role || null, isExcluded: isExcluded ?? false },
  });

  await logAudit(admin.id, "ADD_EMPLOYEE", { name, staffNumber, department });
  return NextResponse.json({ success: true, employee }, { status: 201 });
}

// PATCH — edit employee
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, department, role, isActive, isExcluded } = await req.json();
  if (!id) return NextResponse.json({ error: "Employee ID required" }, { status: 400 });

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(department && { department: department as Department }),
      ...(role !== undefined && { role }),
      ...(typeof isActive === "boolean" && { isActive }),
      ...(typeof isExcluded === "boolean" && { isExcluded }),
    },
  });

  await logAudit(admin.id, "EDIT_EMPLOYEE", { id, name });
  return NextResponse.json({ success: true, employee });
}

// DELETE — soft delete (Super Admin only)
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Employee ID required" }, { status: 400 });

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Soft delete to preserve vote history
  await prisma.employee.update({ where: { id }, data: { isActive: false } });
  await logAudit(admin.id, "DELETE_EMPLOYEE", { id, name: employee.name });
  return NextResponse.json({ success: true });
}
