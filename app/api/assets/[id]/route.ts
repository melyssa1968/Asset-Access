import { del } from "@vercel/blob";
import { getVercelOidcToken } from "@vercel/oidc";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assets } from "../../../../db/schema";
import { requireTenant } from "../../../../lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId } = await requireTenant();
    const { id } = await params;
    const body = await request.json() as { name?: string; archive?: boolean };
    const db = await getDb();
    const rows = await db.update(assets).set({
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.archive ? { archivedAt: new Date() } : {}),
    }).where(and(eq(assets.id, id), eq(assets.tenantId, tenantId))).returning({ id: assets.id });
    return rows.length ? Response.json({ ok: true }) : new Response("Not found", { status: 404 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId } = await requireTenant();
    const { id } = await params;
    const db = await getDb();
    const rows = await db.select().from(assets).where(and(eq(assets.id, id), eq(assets.tenantId, tenantId))).limit(1);
    if (!rows[0]) return new Response("Not found", { status: 404 });
    const oidcToken = await getVercelOidcToken();
    const storeId = process.env.BLOB_STORE_ID;
    if (!oidcToken || !storeId) return Response.json({ error: "File service unavailable" }, { status: 503 });
    await del(rows[0].objectKey, { oidcToken, storeId });
    await db.update(assets).set({ archivedAt: new Date() }).where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
