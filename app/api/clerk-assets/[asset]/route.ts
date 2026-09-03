const CLERK_FRONTEND_API = "https://clerk.racepoint.ai";
const PUBLIC_PROXY_URL = "https://racepoint.ai/asset-access/api/__clerk/";

const CLERK_ASSETS: Record<string, string> = {
  runtime: "/npm/@clerk/clerk-js@6.30.1/dist/clerk.browser.js",
  ui: "/npm/@clerk/ui@1.30.8/dist/framework_ui_4ade33_1.30.8.js",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string }> },
) {
  const { asset } = await params;
  const path = CLERK_ASSETS[asset];

  if (!path) {
    return Response.json({ error: "Unknown Clerk asset" }, { status: 404 });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Clerk is not configured" }, { status: 503 });
  }

  const upstream = await fetch(new URL(path, CLERK_FRONTEND_API), {
    headers: {
      "Clerk-Proxy-Url": PUBLIC_PROXY_URL,
      "Clerk-Secret-Key": secretKey,
    },
  });

  if (!upstream.ok) {
    return Response.json(
      { error: "Unable to load Clerk asset" },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    upstream.headers.get("content-type") ?? "application/javascript; charset=utf-8",
  );
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
