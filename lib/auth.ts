import { headers } from "next/headers";
export async function requireOwner(){
 const h=await headers(),email=h.get("oai-authenticated-user-email");
 if(email)return email.toLowerCase();
 if(process.env.NODE_ENV!=="production")return "workspace-owner";
 throw new Response("Unauthorized",{status:401});
}
