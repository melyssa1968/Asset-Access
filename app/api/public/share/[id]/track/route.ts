import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { visitorSessions, visits } from "../../../../../../db/schema";
import { cookieName, getActiveShare, readCookie } from "../../../../../../lib/share";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getActiveShare(id);
  if (!row) return new Response(null, { status: 404 });
  const sessionId = readCookie(request, cookieName(id));
  if (!sessionId) return new Response(null, { status: 401 });
  const db = await getDb();
  const sessions = await db.select().from(visitorSessions)
    .where(and(eq(visitorSessions.id, sessionId), eq(visitorSessions.linkId, id))).limit(1);
  if (!sessions[0]) return new Response(null, { status: 401 });
  const body = await request.json() as { event?: string; durationMs?: number; progress?: number };
  const allowed = ["heartbeat", "watch", "complete", "download"];
  if (!body.event || !allowed.includes(body.event)) return Response.json({ error: "Invalid event" }, { status: 400 });
  const now = new Date();
  const durationMs = Math.max(0, Math.min(Math.round(body.durationMs || 0), 86400000));
  const progress = Math.max(0, Math.min(Math.round(body.progress || 0), 100));
  if (body.event === "download") {
    await db.insert(visits).values({
      id: crypto.randomUUID(), linkId: id, sessionId,
      visitorEmail: sessions[0].visitorEmail, event: body.event, durationMs, progress, createdAt: now,
    });
  } else {
    const existing = await db.select({ id: visits.id, event: visits.event, durationMs: visits.durationMs, progress: visits.progress })
      .from(visits).where(and(
        eq(visits.linkId, id), eq(visits.sessionId, sessionId),
        inArray(visits.event, ["heartbeat", "watch", "complete"]),
      )).orderBy(desc(visits.createdAt)).limit(1);
    const nextEvent = body.event === "complete" || existing[0]?.event === "complete"
      ? "complete" : body.event === "watch" || existing[0]?.event === "watch" ? "watch" : "heartbeat";
    if (existing[0]) {
      await db.update(visits).set({
        event: nextEvent,
        durationMs: Math.max(durationMs, existing[0].durationMs || 0),
        progress: Math.max(progress, existing[0].progress || 0),
        createdAt: now,
      }).where(eq(visits.id, existing[0].id));
    } else {
      await db.insert(visits).values({
        id: crypto.randomUUID(), linkId: id, sessionId,
        visitorEmail: sessions[0].visitorEmail, event: nextEvent, durationMs, progress, createdAt: now,
      });
    }
  }
  await db.update(visitorSessions).set({ lastSeenAt: now }).where(eq(visitorSessions.id, sessionId));
  return new Response(null, { status: 204 });
}
