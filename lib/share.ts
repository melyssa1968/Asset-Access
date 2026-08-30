import { and,eq,isNull } from "drizzle-orm";
import { getDb } from "../db";
import { assets,shareLinks } from "../db/schema";
export async function getActiveShare(id:string){
 const rows=await getDb().select({link:shareLinks,asset:assets}).from(shareLinks).innerJoin(assets,eq(assets.id,shareLinks.assetId)).where(and(eq(shareLinks.id,id),isNull(shareLinks.revokedAt),isNull(assets.archivedAt))).limit(1);
 const row=rows[0]; if(!row)return null;
 if(row.link.expiresAt&&row.link.expiresAt.getTime()<Date.now())return null;
 return row;
}
export function cookieName(id:string){return `asset_session_${id}`}
export function readCookie(request:Request,name:string){const cookie=request.headers.get("cookie")||"";return cookie.split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="))?.slice(name.length+1)||null}
