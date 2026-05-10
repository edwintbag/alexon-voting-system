// app/api/admin/backup/route.ts
// POST — create backup  GET — list/download backups
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET — list all backups or download one
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const downloadId = req.nextUrl.searchParams.get("download");

  // Download specific backup
  if (downloadId) {
    const backup = await prisma.backup.findUnique({ where: { id: downloadId } });
    if (!backup) return NextResponse.json({ error: "Backup not found" }, { status: 404 });

    if (!fs.existsSync(backup.filePath)) {
      return NextResponse.json({ error: "Backup file not found on server" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(backup.filePath);
    await logAudit(admin.id, "DOWNLOAD_BACKUP", { filename: backup.filename });

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${backup.filename}"`,
      },
    });
  }

  // List all backups
  const backups = await prisma.backup.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ backups });
}

// POST — create a new backup
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { trigger = "MANUAL" } = await req.json().catch(() => ({}));

  try {
    ensureBackupDir();

    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL ?? "";
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
    if (!match) return NextResponse.json({ error: "Could not parse DATABASE_URL" }, { status: 500 });

    const [, user, password, host, port, dbName] = match;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `alexon-backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Run pg_dump
    const env = { ...process.env, PGPASSWORD: password };
    await execAsync(
      `pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -f "${filePath}" --no-password`,
      { env }
    );

    const stats = fs.statSync(filePath);

    // Keep only last 5 backups — delete oldest
    const allBackups = await prisma.backup.findMany({ orderBy: { createdAt: "asc" } });
    if (allBackups.length >= 5) {
      const toDelete = allBackups.slice(0, allBackups.length - 4);
      for (const b of toDelete) {
        if (fs.existsSync(b.filePath)) fs.unlinkSync(b.filePath);
        await prisma.backup.delete({ where: { id: b.id } });
      }
    }

    // Save backup record
    const backup = await prisma.backup.create({
      data: {
        filename,
        filePath,
        sizeBytes: stats.size,
        trigger,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_BACKUP", { filename, trigger, sizeBytes: stats.size });
    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    console.error("[POST /api/admin/backup]", error);
    return NextResponse.json({
      error: "Backup failed. Make sure pg_dump is installed and accessible.",
      details: error.message,
    }, { status: 500 });
  }
}

// DELETE — delete a backup
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const backup = await prisma.backup.findUnique({ where: { id } });
  if (!backup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (fs.existsSync(backup.filePath)) fs.unlinkSync(backup.filePath);
  await prisma.backup.delete({ where: { id } });
  await logAudit(admin.id, "DELETE_BACKUP", { filename: backup.filename });

  return NextResponse.json({ success: true });
}
