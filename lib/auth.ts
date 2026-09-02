import { auth } from "@clerk/nextjs/server";

export type TenantContext = {
  userId: string;
  tenantId: string;
  organizationId: string | null;
};

export async function requireTenant(): Promise<TenantContext> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Response("Unauthorized", { status: 401 });
  return { userId, tenantId: orgId || userId, organizationId: orgId };
}
