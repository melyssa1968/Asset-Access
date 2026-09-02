"use client";

import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import Workspace from "./workspace";

export default function Home() {
  return (
    <>
      <SignedIn><Workspace /></SignedIn>
      <SignedOut><RedirectToSignIn redirectUrl="/asset-access" /></SignedOut>
    </>
  );
}
