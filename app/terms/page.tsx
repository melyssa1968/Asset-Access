import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Asset Access",
  description: "Terms governing use of the Asset Access service.",
};

const section = { marginTop: 28 };
const heading = { fontSize: 20, margin: "0 0 10px" };
const copy = { color: "#555b6d", lineHeight: 1.7, margin: "8px 0" };

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: "48px 20px" }}>
      <article style={{ width: "min(760px, 100%)", margin: "0 auto", background: "#fff", border: "1px solid #e8e9ef", borderRadius: 18, padding: "clamp(28px, 5vw, 56px)", boxShadow: "0 18px 48px rgba(31,31,60,.08)" }}>
        <Link href="/sign-in" style={{ color: "#6556e8", textDecoration: "none", fontWeight: 700 }}>← Asset Access</Link>
        <h1 style={{ fontSize: 38, letterSpacing: "-.04em", margin: "26px 0 8px" }}>Terms of Service</h1>
        <p style={{ ...copy, fontSize: 14 }}>Last updated: September 3, 2026</p>
        <p style={copy}>These Terms of Service govern your access to and use of Asset Access, a business service operated by Racepoint (“Racepoint,” “we,” “us,” or “our”). By using Asset Access, you agree to these terms.</p>

        <section style={section}>
          <h2 style={heading}>Accounts and organizations</h2>
          <p style={copy}>You must provide accurate account information, protect your sign-in methods, and promptly notify us of suspected unauthorized access. Organization administrators are responsible for their members, permissions, assets, recipients, and use of the service.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Acceptable use</h2>
          <p style={copy}>You may use Asset Access only for lawful business purposes. You may not upload or share content you do not have the right to use; violate privacy, intellectual-property, or other rights; distribute malware; attempt unauthorized access; interfere with the service; or use the service to harass, deceive, or harm others.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Your content</h2>
          <p style={copy}>You retain ownership of content you upload. You grant Racepoint a limited right to host, process, display, and transmit that content solely to operate and support Asset Access. You are responsible for your content and for configuring sharing links appropriately.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Third-party services</h2>
          <p style={copy}>Asset Access relies on third-party services for authentication, hosting, storage, databases, and email delivery. Their availability and terms may affect parts of the service.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Service availability and changes</h2>
          <p style={copy}>We may improve, change, suspend, or discontinue features. We work to provide a reliable service, but Asset Access is provided “as is” and “as available” to the extent permitted by law.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Termination</h2>
          <p style={copy}>You may stop using Asset Access at any time. We may restrict or terminate access for violations of these terms, security risks, unlawful conduct, or nonpayment under an applicable commercial agreement.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Liability</h2>
          <p style={copy}>To the maximum extent permitted by law, Racepoint will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenues, data, or business opportunities arising from use of Asset Access.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Changes and contact</h2>
          <p style={copy}>We may update these terms and will revise the date above when we do. Questions may be sent to <a href="mailto:melyssa.plunkett@racepoint.ai" style={{ color: "#6556e8" }}>melyssa.plunkett@racepoint.ai</a>.</p>
        </section>

        <footer style={{ marginTop: 38, paddingTop: 22, borderTop: "1px solid #e8e9ef", display: "flex", gap: 18, fontSize: 14 }}>
          <Link href="/privacy" style={{ color: "#6556e8" }}>Privacy Policy</Link>
          <Link href="/sign-in" style={{ color: "#6556e8" }}>Sign in</Link>
        </footer>
      </article>
    </main>
  );
}
