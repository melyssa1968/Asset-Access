import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { assets, shareLinks, visitorSessions, visits } from "../../../db/schema";
import { requireTenant } from "../../../lib/auth";

export async function GET() {
  try {
    const { tenantId } = await requireTenant();
    const db = await getDb();
    const counts = await db.select({
      views: sql<number>`count(distinct ${visitorSessions.id})`,
      visitors: sql<number>`count(distinct coalesce(${visitorSessions.visitorEmail}, ${visitorSessions.id}))`,
    }).from(assets)
      .leftJoin(shareLinks, eq(shareLinks.assetId, assets.id))
      .leftJoin(visitorSessions, eq(visitorSessions.linkId, shareLinks.id))
      .where(and(eq(assets.tenantId, tenantId), isNull(assets.archivedAt)));

    const engagement = await db.select({
      sessionId: visits.sessionId,
      durationMs: sql<number>`coalesce(max(case when ${visits.event} in ('heartbeat','watch','complete') then ${visits.durationMs} end), 0)`,
      progress: sql<number>`coalesce(max(case when ${visits.event} in ('heartbeat','watch','complete') then ${visits.progress} end), 0)`,
      complete: sql<number>`max(case when ${visits.event} = 'complete' then 1 else 0 end)`,
      downloaded: sql<number>`max(case when ${visits.event} = 'download' then 1 else 0 end)`,
    }).from(visits)
      .innerJoin(shareLinks, eq(shareLinks.id, visits.linkId))
      .innerJoin(assets, eq(assets.id, shareLinks.assetId))
      .where(and(eq(assets.tenantId, tenantId), isNull(assets.archivedAt)))
      .groupBy(visits.sessionId);

    const measurable = engagement.filter(row => Number(row.durationMs) > 0);
    const avgDuration = measurable.length
      ? measurable.reduce((sum, row) => sum + Number(row.durationMs), 0) / measurable.length : 0;
    const avgProgress = measurable.length
      ? measurable.reduce((sum, row) => sum + Number(row.progress), 0) / measurable.length : 0;

    const sessions = await db.select({
      id: visitorSessions.id,
      email: visitorSessions.visitorEmail,
      createdAt: visitorSessions.lastSeenAt,
      assetName: assets.name,
      linkLabel: shareLinks.label,
      country: visitorSessions.country,
      contentType: assets.contentType,
    }).from(visitorSessions)
      .innerJoin(shareLinks, eq(shareLinks.id, visitorSessions.linkId))
      .innerJoin(assets, eq(assets.id, shareLinks.assetId))
      .where(and(eq(assets.tenantId, tenantId), isNull(assets.archivedAt)))
      .orderBy(desc(visitorSessions.lastSeenAt)).limit(50);

    const engagementBySession = new Map(engagement.filter(row => row.sessionId).map(row => [row.sessionId!, row]));
    const recent = sessions.map(session => {
      const detail = engagementBySession.get(session.id);
      const isVideo = session.contentType?.startsWith("video/");
      const event = Number(detail?.downloaded || 0) > 0 ? "download"
        : Number(detail?.complete || 0) > 0 ? "complete"
        : Number(detail?.durationMs || 0) > 0 ? (isVideo ? "watch" : "view") : "open";
      return {
        ...session, event,
        durationMs: Number(detail?.durationMs || 0),
        progress: Number(detail?.progress || 0),
      };
    });

    return Response.json({
      summary: {
        views: Number(counts[0]?.views || 0),
        visitors: Number(counts[0]?.visitors || 0),
        avgDuration,
        avgProgress,
      },
      recent,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Could not load analytics" }, { status: 500 });
  }
}
