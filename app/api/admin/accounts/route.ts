// app/api/admin/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

// GET — list all admin accounts (Super Admin only)
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accounts = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ accounts });
}

// PATCH — toggle active/inactive or update role (Super Admin only)
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, isActive, role } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });

  // Cannot deactivate yourself
  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot modify your own account" }, { status: 400 });
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  await logAudit(admin.id, "UPDATE_ADMIN", { targetId: id, isActive, role });

  // If deactivating, delete their sessions
  if (isActive === false) {
    await prisma.adminSession.deleteMany({ where: { adminId: id } });
  }

  return NextResponse.json({ success: true, admin: updated });
}
