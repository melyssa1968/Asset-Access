const CLERK_FRONTEND_API = "https://clerk.racepoint.ai";
const PUBLIC_PROXY_URL = "https://racepoint.ai/asset-access/api/__clerk";

async function proxyToClerk(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return Response.json({ error: "Clerk is not configured" }, { status: 503 });

  const source = new URL(request.url);
  const target = new URL(
    source.pathname.replace(/^\/api\/__clerk/, "") || "/",
    CLERK_FRONTEND_API,
  );
  target.search = source.search;

  const headers = new Headers(request.headers);
  const clientIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  headers.delete("host");
  headers.delete("content-length");
  headers.set("Clerk-Proxy-Url", PUBLIC_PROXY_URL);
  headers.set("Clerk-Secret-Key", secretKey);
  if (clientIp) headers.set("X-Forwarded-For", clientIp.split(",")[0].trim());

  const methodHasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: methodHasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  const location = responseHeaders.get("location");
  if (location) {
    const redirect = new URL(location, target);
    if (redirect.origin === CLERK_FRONTEND_API) {
      responseHeaders.set(
        "location",
        `${PUBLIC_PROXY_URL}${redirect.pathname}${redirect.search}`,
      );
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyToClerk;
export const POST = proxyToClerk;
export const PUT = proxyToClerk;
export const DELETE = proxyToClerk;
export const PATCH = proxyToClerk;
