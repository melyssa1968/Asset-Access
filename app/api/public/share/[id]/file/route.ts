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
  const upstream = await fetch(row.asset.objectKey, {
    headers: {
      Authorization: `Bearer ${oidcToken}`,
      ...(range ? { Range: range } : {}),
    },
  });
  if (!upstream.ok || !upstream.body) return new Response("File unavailable", { status: upstream.status === 404 ? 404 : 502 });
  const headers: Record<string,string> = {
    "content-type": upstream.headers.get("content-type") || row.asset.contentType || "application/octet-stream",
    "content-disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${row.asset.fileName.replaceAll('"', "")}"`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "accept-ranges": upstream.headers.get("accept-ranges") || "bytes",
  };
  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange) headers["content-range"] = contentRange;
  if (contentLength) headers["content-length"] = contentLength;
  return new Response(upstream.body, { status: upstream.status, headers });
}
