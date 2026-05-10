// lib/auth.ts
// Authentication utilities for Alexon Admin System

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "alexon-jwt-secret-change-in-production";
const SESSION_DURATION_DAYS = 7;
const COOKIE_NAME = "alexon_admin_token";

// ── Password utilities ────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Token utilities ───────────────────────────────────

export function generateToken(adminId: string): string {
  return jwt.sign({ adminId }, JWT_SECRET, {
    expiresIn: `${SESSION_DURATION_DAYS}d`,
  });
}

export function verifyToken(token: string): { adminId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string };
  } catch {
    return null;
  }
}

// ── Session management ────────────────────────────────

export async function createSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken(adminId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.adminSession.create({
    data: { adminId, token, expiresAt, ipAddress, userAgent },
  });

  return token;
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<{ adminId: string; token: string } | null> {
  // Check cookie first, then Authorization header
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = cookieToken || headerToken;

  if (!token) return null;

  // Verify JWT
  const payload = verifyToken(token);
  if (!payload) return null;

  // Check DB session is still valid
  const session = await prisma.adminSession.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) await prisma.adminSession.delete({ where: { token } });
    return null;
  }

  return { adminId: payload.adminId, token };
}

export async function getAdminFromRequest(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId, isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return admin;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.adminSession
    .delete({ where: { token } })
    .catch(() => {}); // Ignore if already deleted
}

// ── Invite codes ──────────────────────────────────────

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Audit logging ─────────────────────────────────────

export async function logAudit(
  adminId: string,
  action: string,
  details?: object,
  ipAddress?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
    },
  });
}

// ── Cookie helpers ────────────────────────────────────

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
  path: "/",
};
