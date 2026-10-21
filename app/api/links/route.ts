import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { assets, shareLinks, visitorSessions } from "../../../db/schema";
import { requireTenant } from "../../../lib/auth";

export async function GET() {
  try {
    const { tenantId } = await requireTenant();
    const links = await (await getDb()).select({
      id: shareLinks.id,
      assetId: shareLinks.assetId,
      assetName: assets.name,
      label: shareLinks.label,
      requireEmail: shareLinks.requireEmail,
      allowDownload: shareLinks.allowDownload,
      expiresAt: shareLinks.expiresAt,
      revokedAt: shareLinks.revokedAt,
      createdAt: shareLinks.createdAt,
      views: sql<number>`count(distinct ${visitorSessions.id})`,
      visitors: sql<number>`count(distinct coalesce(${visitorSessions.visitorEmail}, ${visitorSessions.id}))`,
      lastActiveAt: sql<string | null>`max(${visitorSessions.lastSeenAt})`,
    }).from(shareLinks)
      .innerJoin(assets, eq(assets.id, shareLinks.assetId))
      .leftJoin(visitorSessions, eq(visitorSessions.linkId, shareLinks.id))
      .where(and(eq(assets.tenantId, tenantId), isNull(assets.archivedAt)))
      .groupBy(shareLinks.id, assets.id)
      .orderBy(desc(shareLinks.createdAt));
    return Response.json({
      links: links.map(link => ({
        ...link,
        views: Number(link.views),
        visitors: Number(link.visitors),
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not load links" }, { status: 500 });
  }
}
export async function POST(request:Request){try{const {tenantId}=await requireTenant(),body=await request.json() as {assetId?:string;label?:string;requireEmail?:boolean;allowDownload?:boolean;expiresAt?:string|null};if(!body.assetId)return Response.json({error:"Choose an asset"},{status:400});const owned=await (await getDb()).select({id:assets.id}).from(assets).where(and(eq(assets.id,body.assetId),eq(assets.tenantId,tenantId),isNull(assets.archivedAt))).limit(1);if(!owned[0])return new Response("Not found",{status:404});const id=crypto.randomUUID().replaceAll("-","").slice(0,20),record={id,assetId:body.assetId,label:body.label?.trim()||null,requireEmail:body.requireEmail??true,allowDownload:body.allowDownload??false,expiresAt:body.expiresAt?new Date(body.expiresAt):null,createdAt:new Date()};await (await getDb()).insert(shareLinks).values(record);return Response.json({link:record,url:`/asset-access/share/${id}`},{status:201})}catch(e){if(e instanceof Response)return e;return Response.json({error:"Could not create link"},{status:500})}}

