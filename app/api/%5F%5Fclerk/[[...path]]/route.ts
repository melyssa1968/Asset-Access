import { clerkFrontendApiProxy } from "@clerk/nextjs/server";

const PUBLIC_PROXY_URL = new URL(
  "https://racepoint.ai/asset-access/api/__clerk",
);
const INTERNAL_PROXY_PATH = "/api/__clerk";
const CLERK_FRONTEND_API = "https://clerk.racepoint.ai";

async function proxyToClerk(request: Request) {
  const source = new URL(request.url);
  const upstreamPath = source.pathname.slice(INTERNAL_PROXY_PATH.length);
  const publicRequestUrl = new URL(
    `${PUBLIC_PROXY_URL.pathname}${upstreamPath}${source.search}`,
    PUBLIC_PROXY_URL.origin,
  );

  const headers = new Headers(request.headers);
  const clientIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-forwarded-host", PUBLIC_PROXY_URL.host);
  headers.set("x-forwarded-proto", PUBLIC_PROXY_URL.protocol.slice(0, -1));
  if (clientIp) {
    const originalClientIp = clientIp.split(",")[0].trim();
    headers.set("x-real-ip", originalClientIp);
    headers.set("x-forwarded-for", originalClientIp);
  }

  const methodHasBody = request.method !== "GET" && request.method !== "HEAD";
  const publicRequest = new Request(publicRequestUrl, {
    method: request.method,
    headers,
    body: methodHasBody ? await request.arrayBuffer() : undefined,
  });

  return clerkFrontendApiProxy(publicRequest, {
    proxyPath: PUBLIC_PROXY_URL.pathname,
    fapiUrl: CLERK_FRONTEND_API,
  });
}

export const GET = proxyToClerk;
export const POST = proxyToClerk;
export const PUT = proxyToClerk;
export const DELETE = proxyToClerk;
export const PATCH = proxyToClerk;
