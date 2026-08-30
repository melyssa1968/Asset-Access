import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { getVercelOidcToken } from "@vercel/oidc";
import { requireOwner } from "../../../../lib/auth";

async function blobIdentity() {
  const oidcToken = await getVercelOidcToken();
  const storeId = process.env.BLOB_STORE_ID;
  if (!oidcToken || !storeId) throw new Error("Vercel Blob credentials are unavailable");
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
        token: await (async () => {
          const identity = await blobIdentity();
          return issueSignedToken({
            pathname,
            operations: ["put"],
            validUntil: Date.now() + 60 * 60 * 1000,
            oidcToken: identity.oidcToken,
            storeId: identity.storeId,
          });
        })(),
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
