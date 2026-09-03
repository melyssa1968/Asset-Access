import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "1fr auto", background: "#f6f7fb" }}>
      <div style={{ display: "grid", placeItems: "center", padding: "32px 16px" }}>
        <SignIn routing="path" path="/asset-access/sign-in" forceRedirectUrl="/asset-access" signUpUrl="/asset-access/sign-up" />
      </div>
      <footer style={{ display: "flex", justifyContent: "center", gap: 20, padding: "18px", fontSize: 13, color: "#6f7487" }}>
        <Link href="/asset-access/privacy" style={{ color: "#6556e8" }}>Privacy Policy</Link>
        <Link href="/asset-access/terms" style={{ color: "#6556e8" }}>Terms of Service</Link>
      </footer>
    </main>
  );
}
