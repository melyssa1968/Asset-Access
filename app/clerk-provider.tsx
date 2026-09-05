"use client";

import { Clerk } from "@clerk/clerk-js";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";

export default function AssetClerkProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      Clerk={Clerk}
      ui={ui}
      proxyUrl="https://racepoint.ai/asset-access/api/__clerk"
      signInUrl="/asset-access/sign-in"
      signUpUrl="/asset-access/sign-up"
      taskUrls={{
        "choose-organization":
          "/asset-access/session-tasks/choose-organization",
      }}
    >
      {children}
    </ClerkProvider>
  );
}
