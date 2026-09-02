import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BASE_PATH = "/asset-access";

const isPublicRoute = createRouteMatcher([
  "/share(.*)",
  "/api/public(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isPublicRoute(request)) return;
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL(`${BASE_PATH}/sign-in`, request.url));
  },
  {
    authorizedParties: ["https://racepoint.ai"],
    frontendApiProxy: { enabled: true, path: "/asset-access/__clerk" },
  },
);

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)", "/asset-access/__clerk/(.*)"],
};
