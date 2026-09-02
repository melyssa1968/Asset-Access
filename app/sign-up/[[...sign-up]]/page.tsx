import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><SignUp routing="path" path="/asset-access/sign-up" forceRedirectUrl="/asset-access" signInUrl="/asset-access/sign-in" /></main>;
}
