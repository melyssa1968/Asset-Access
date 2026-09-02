import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asset Access",
  description: "Share sales assets and see exactly how prospects engage.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider proxyUrl="https://racepoint.ai/asset-access/__clerk" signInUrl="/asset-access/sign-in" signUpUrl="/asset-access/sign-up"><html lang="en"><body>{children}</body></html></ClerkProvider>;
}
