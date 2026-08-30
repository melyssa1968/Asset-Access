import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { requireOwner } from "../../../../lib/auth";

function blobIdentity() {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (!oidcToken || !storeId) throw new Error("Vercel Blob OIDC credentials are unavailable");
  return { oidcToken, storeId };
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireOwner();
    const body = await request.json() as HandleUploadPresignedBody;
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 60 * 60 * 1000,
          oidcToken: blobIdentity().oidcToken,
          storeId: blobIdentity().storeId,
        }),
        urlOptions: {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "video/mp4", "video/quicktime", "video/webm",
          ],
          maximumSizeInBytes: 524288000,
          addRandomSuffix: true,
          allowOverwrite: false,
        },
        tokenPayload: JSON.stringify({ ownerId }),
      }),
      onUploadCompleted: async () => {},
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[blob-upload]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not authorize upload" }, { status: 400 });
  }
}
