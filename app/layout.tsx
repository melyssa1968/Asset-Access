import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Asset Access", description: "Share sales assets and see exactly how prospects engage." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
