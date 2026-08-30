import { get } from "@vercel/blob";
import { getVercelOidcToken } from "@vercel/oidc";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { visitorSessions } from "../../../../../../db/schema";
import { cookieName, getActiveShare, readCookie } from "../../../../../../lib/share";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getActiveShare(id);
  if (!row) return new Response("This link is unavailable", { status: 404 });
  const sessionId = readCookie(request, cookieName(id));
  if (!sessionId) return new Response("Access required", { status: 401 });
  const db = await getDb();
  const session = await db.select({ id: visitorSessions.id }).from(visitorSessions)
    .where(and(eq(visitorSessions.id, sessionId), eq(visitorSessions.linkId, id))).limit(1);
  if (!session[0]) return new Response("Access required", { status: 401 });

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  if (wantsDownload && !row.link.allowDownload) return new Response("Downloads are disabled", { status: 403 });
  const oidcToken = await getVercelOidcToken();
  const storeId = process.env.BLOB_STORE_ID;
  if (!oidcToken || !storeId) return new Response("File service unavailable", { status: 503 });
  const range = request.headers.get("range");
  const object = await get(row.asset.objectKey, {
    access: "private", oidcToken, storeId,
    headers: range ? { Range: range } : undefined,
  });
  if (!object || (object.statusCode !== 200 && object.statusCode !== 206)) return new Response("File unavailable", { status: 404 });
  const headers: Record<string,string> = {
    "content-type": row.asset.contentType || "application/octet-stream",
    "content-disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${row.asset.fileName.replaceAll('"', "")}"`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
  };
  let status = 200;
  if (range && object.statusCode === 206) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), row.asset.size - 1) : row.asset.size - 1;
      headers["content-range"] = `bytes ${start}-${end}/${row.asset.size}`;
      headers["content-length"] = String(end - start + 1);
      status = 206;
    }
  }
  return new Response(object.stream, { status, headers });
}
