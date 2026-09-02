import { and,eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assets,shareLinks } from "../../../../db/schema";
import { requireTenant } from "../../../../lib/auth";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const {tenantId}=await requireTenant(),{id}=await params,body=await request.json() as {revoke?:boolean};const owned=await (await getDb()).select({id:shareLinks.id}).from(shareLinks).innerJoin(assets,eq(assets.id,shareLinks.assetId)).where(and(eq(shareLinks.id,id),eq(assets.tenantId,tenantId))).limit(1);if(!owned[0])return new Response("Not found",{status:404});await (await getDb()).update(shareLinks).set({revokedAt:body.revoke?new Date():null}).where(eq(shareLinks.id,id));return Response.json({ok:true})}catch(e){if(e instanceof Response)return e;return Response.json({error:"Update failed"},{status:500})}}
