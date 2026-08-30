import { getDb } from "../../../../../../db";
import { visitorSessions, visits } from "../../../../../../db/schema";
import { cookieName, getActiveShare } from "../../../../../../lib/share";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getActiveShare(id);
  if (!row) return Response.json({ error: "This link is unavailable" }, { status: 404 });
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase() || null;
  if (row.link.requireEmail && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return Response.json({ error: "Enter a valid work email" }, { status: 400 });
  }
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const country = request.headers.get("x-vercel-ip-country");
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);
  const db = await getDb();
  await db.insert(visitorSessions).values({ id: sessionId, linkId: id, visitorEmail: email, country, userAgent, createdAt: now, lastSeenAt: now });
  await db.insert(visits).values({ id: crypto.randomUUID(), linkId: id, sessionId, visitorEmail: email, event: "open", createdAt: now });
  return Response.json({ ok: true, fileUrl: `/api/public/share/${id}/file`, downloadAllowed: row.link.allowDownload }, {
    headers: { "set-cookie": `${cookieName(id)}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure` },
  });
}
