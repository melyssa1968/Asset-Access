import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><SignIn routing="path" path="/asset-access/sign-in" forceRedirectUrl="/asset-access" signUpUrl="/asset-access/sign-up" /></main>;
}
