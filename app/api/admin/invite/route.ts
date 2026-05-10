// app/api/admin/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, generateInviteCode, logAudit } from "@/lib/auth";

// GET — list all invite codes
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ codes });
}

// POST — generate a new invite code
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Max 3 admins check
  const adminCount = await prisma.adminUser.count({
    where: { role: "ADMIN", isActive: true },
  });
  if (adminCount >= 3) {
    return NextResponse.json(
      { error: "Maximum of 3 admin accounts already exist. Deactivate one before creating another." },
      { status: 400 }
    );
  }

  const { email, role = "ADMIN" } = await req.json();

  // Expires in 48 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const code = generateInviteCode();
  const invite = await prisma.inviteCode.create({
    data: {
      code,
      email: email?.toLowerCase() || null,
      role,
      expiresAt,
      createdById: admin.id,
    },
  });

  await logAudit(admin.id, "GENERATE_INVITE", { code, email, role });

  return NextResponse.json({ success: true, invite });
}
