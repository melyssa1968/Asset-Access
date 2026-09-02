import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { assets, shareLinks, visitorSessions, visits } from "../../../db/schema";
import { requireTenant } from "../../../lib/auth";

const allowed = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4", "video/quicktime", "video/webm",
];

export async function GET() {
  try {
    const { tenantId } = await requireTenant();
    const db = await getDb();
    const rows = await db.select({
      id: assets.id, name: assets.name, fileName: assets.fileName, size: assets.size,
      contentType: assets.contentType, createdAt: assets.createdAt,
      views: sql<number>`count(distinct ${visits.id})`,
      visitors: sql<number>`count(distinct ${visitorSessions.id})`,
      links: sql<number>`count(distinct ${shareLinks.id})`,
    }).from(assets)
      .leftJoin(shareLinks, eq(shareLinks.assetId, assets.id))
      .leftJoin(visits, eq(visits.linkId, shareLinks.id))
      .leftJoin(visitorSessions, eq(visitorSessions.linkId, shareLinks.id))
      .where(and(eq(assets.tenantId, tenantId), isNull(assets.archivedAt)))
      .groupBy(assets.id).orderBy(desc(assets.createdAt));
    return Response.json({ assets: rows });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Could not load assets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, tenantId } = await requireTenant();
    const body = await request.json() as {
      name?: string; fileName?: string; objectKey?: string;
      contentType?: string; size?: number;
    };
    if (!body.fileName || !body.objectKey || !body.size) return Response.json({ error: "Missing upload details" }, { status: 400 });
    if (body.size > 524288000) return Response.json({ error: "Files must be under 500 MB" }, { status: 413 });
    const contentType = body.contentType || "application/octet-stream";
    if (!allowed.includes(contentType)) return Response.json({ error: "Upload a PDF, PowerPoint, Word document, MP4, MOV, or WebM video" }, { status: 415 });
    const blobUrl = new URL(body.objectKey);
    if (!blobUrl.hostname.endsWith(".private.blob.vercel-storage.com")) return Response.json({ error: "Invalid private upload" }, { status: 400 });
    if (!blobUrl.pathname.startsWith(`/tenants/${tenantId}/assets/`)) return Response.json({ error: "Upload does not belong to the active workspace" }, { status: 403 });

    const record = {
      id: crypto.randomUUID(), ownerEmail: userId, tenantId,
      name: String(body.name || body.fileName.replace(/\.[^/.]+$/, "")).trim(),
      fileName: body.fileName, objectKey: blobUrl.toString(),
      contentType, size: body.size, createdAt: new Date(),
    };
    const db = await getDb();
    await db.insert(assets).values(record);
    return Response.json({ asset: { ...record, views: 0, visitors: 0, links: 0 } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Upload registration failed" }, { status: 500 });
  }
}
