// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, logAudit, COOKIE_OPTIONS } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, name, email, password } = parsed.data;

    // Validate invite code
    const invite = await prisma.inviteCode.findUnique({ where: { code } });
    if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 }
      );
    }

    // Check email matches invite (if pre-assigned)
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite code was assigned to a different email address" },
        { status: 400 }
      );
    }

    // Check email not already taken
    const existing = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create admin account
    const passwordHash = await hashPassword(password);
    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: invite.role,
        isActive: true,
        createdById: invite.createdById,
      },
    });

    // Mark invite as used
    await prisma.inviteCode.update({
      where: { code },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Audit log on creator's behalf
    await logAudit(invite.createdById, "ADMIN_REGISTERED", {
      newAdminEmail: email,
      role: invite.role,
    });

    // Create session & log in
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const token = await createSession(admin.id, ipAddress ?? undefined);

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });

    response.cookies.set({ ...COOKIE_OPTIONS, value: token });
    return response;
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
