import { clerkFrontendApiProxy } from "@clerk/nextjs/server";

async function proxyToClerk(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api\/__clerk/, "/__clerk");

  const methodHasBody = request.method !== "GET" && request.method !== "HEAD";
  const rewritten = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: methodHasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  return clerkFrontendApiProxy(rewritten);
}

export const GET = proxyToClerk;
export const POST = proxyToClerk;
export const PUT = proxyToClerk;
export const DELETE = proxyToClerk;
export const PATCH = proxyToClerk;
