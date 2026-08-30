import { put } from "@vercel/blob";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { assets, shareLinks, visitorSessions, visits } from "../../../db/schema";
import { requireOwner } from "../../../lib/auth";

export async function GET() {
  try {
    const ownerEmail = await requireOwner();
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
      .where(and(eq(assets.ownerEmail, ownerEmail), isNull(assets.archivedAt)))
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
    const ownerEmail = await requireOwner();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a file" }, { status: 400 });
    if (file.size > 104857600) return Response.json({ error: "Files must be under 100 MB" }, { status: 413 });
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "video/mp4"];
    if (file.type && !allowed.includes(file.type)) return Response.json({ error: "Upload a PDF, PowerPoint, Word document, or MP4" }, { status: 415 });

    const id = crypto.randomUUID();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const pathname = `assets/${ownerEmail}/${id}/${safe}`;
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: false });
    const record = {
      id, ownerEmail,
      name: String(form.get("name") || file.name.replace(/\.[^/.]+$/, "")).trim(),
      fileName: file.name, objectKey: blob.url,
      contentType: file.type || "application/octet-stream",
      size: file.size, createdAt: new Date(),
    };
    const db = await getDb();
    await db.insert(assets).values(record);
    return Response.json({ asset: { ...record, views: 0, visitors: 0, links: 0 } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
