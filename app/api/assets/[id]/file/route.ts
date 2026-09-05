import { getVercelOidcToken } from "@vercel/oidc";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { assets } from "../../../../../db/schema";
import { requireTenant } from "../../../../../lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId } = await requireTenant();
    const { id } = await params;
    const db = await getDb();
    const rows = await db.select().from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId), isNull(assets.archivedAt))).limit(1);
    const asset = rows[0];
    if (!asset) return new Response("Asset not found", { status: 404 });

    const oidcToken = await getVercelOidcToken();
    const storeId = process.env.BLOB_STORE_ID;
    if (!oidcToken || !storeId) return new Response("File service unavailable", { status: 503 });
    const range = request.headers.get("range");
    const upstream = await fetch(asset.objectKey, {
      headers: { Authorization: `Bearer ${oidcToken}`, ...(range ? { Range: range } : {}) },
    });
    if (!upstream.ok || !upstream.body) return new Response("File unavailable", { status: upstream.status === 404 ? 404 : 502 });

    const safeFileName = asset.fileName.replace(/["\r\n]/g, "");
    const headers: Record<string, string> = {
      "content-type": upstream.headers.get("content-type") || asset.contentType || "application/octet-stream",
      "content-disposition": `inline; filename="${safeFileName}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "accept-ranges": upstream.headers.get("accept-ranges") || "bytes",
    };
    const contentRange = upstream.headers.get("content-range");
    const contentLength = upstream.headers.get("content-length");
    if (contentRange) headers["content-range"] = contentRange;
    if (contentLength) headers["content-length"] = contentLength;
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return new Response("Could not preview asset", { status: 500 });
  }
}
