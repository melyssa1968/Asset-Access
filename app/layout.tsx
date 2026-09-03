import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

const clerkAssetOverrides = {
  __internal_clerkJSUrl: "https://racepoint.ai/asset-access/api/clerk-assets/runtime",
  __internal_clerkJSVersion: "6.30.1",
  __internal_clerkUIUrl: "https://racepoint.ai/asset-access/api/clerk-assets/ui",
  __internal_clerkUIVersion: "1.30.8",
};

export const metadata: Metadata = {
  title: "Asset Access",
  description: "Share sales assets and see exactly how prospects engage.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      {...clerkAssetOverrides}
      proxyUrl="https://racepoint.ai/asset-access/api/__clerk"
      signInUrl="/asset-access/sign-in"
      signUpUrl="/asset-access/sign-up"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
