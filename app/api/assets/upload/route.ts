import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireOwner } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const ownerId = await requireOwner();
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "video/mp4", "video/quicktime", "video/webm",
        ],
        maximumSizeInBytes: 524288000,
        tokenPayload: JSON.stringify({ ownerId }),
      }),
      onUploadCompleted: async () => {},
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ error: "Could not authorize upload" }, { status: 400 });
  }
}
