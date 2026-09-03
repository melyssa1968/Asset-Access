import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Asset Access",
  description: "How Asset Access collects, uses, and protects information.",
};

const section = { marginTop: 28 };
const heading = { fontSize: 20, margin: "0 0 10px" };
const copy = { color: "#555b6d", lineHeight: 1.7, margin: "8px 0" };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: "48px 20px" }}>
      <article style={{ width: "min(760px, 100%)", margin: "0 auto", background: "#fff", border: "1px solid #e8e9ef", borderRadius: 18, padding: "clamp(28px, 5vw, 56px)", boxShadow: "0 18px 48px rgba(31,31,60,.08)" }}>
        <Link href="/asset-access/sign-in" style={{ color: "#6556e8", textDecoration: "none", fontWeight: 700 }}>← Asset Access</Link>
        <h1 style={{ fontSize: 38, letterSpacing: "-.04em", margin: "26px 0 8px" }}>Privacy Policy</h1>
        <p style={{ ...copy, fontSize: 14 }}>Last updated: September 3, 2026</p>
        <p style={copy}>Asset Access is operated by Racepoint (“Racepoint,” “we,” “us,” or “our”). This policy explains how we handle information when people use Asset Access.</p>

        <section style={section}>
          <h2 style={heading}>Information we collect</h2>
          <p style={copy}>We collect account information such as your name, email address, profile image, user identifier, and organization membership. We also process assets you upload, sharing settings, recipient-provided information, and access events such as opens, views, and downloads. Our service providers may record standard device, browser, IP address, and diagnostic information for security and reliability.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Google account information</h2>
          <p style={copy}>If you choose “Continue with Google,” Asset Access receives only the basic identity information Google makes available for authentication: your name, email address, profile image, and Google account identifier. Asset Access does not request access to your Gmail, Google Drive files, contacts, calendars, or other Google services.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>How we use information</h2>
          <p style={copy}>We use information to authenticate users, keep each organization’s data separated, provide asset sharing and engagement analytics, send requested security and access notifications, maintain and improve the service, prevent abuse, and respond to support requests.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>How we share information</h2>
          <p style={copy}>We share information only as needed with service providers that help operate Asset Access, including authentication, hosting, database, file storage, and email-delivery providers. We may also disclose information when required by law, to protect rights and safety, or as part of a business transaction. We do not sell personal information.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Data retention and choices</h2>
          <p style={copy}>We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements. Organization administrators may manage members and shared assets. You may request access, correction, or deletion of your personal information by contacting us.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Security and tenant separation</h2>
          <p style={copy}>We use reasonable administrative, technical, and organizational safeguards. Asset Access associates application records with a user or organization identifier to separate customer workspaces. No method of transmission or storage is completely secure.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Children</h2>
          <p style={copy}>Asset Access is a business service and is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>Changes and contact</h2>
          <p style={copy}>We may update this policy and will revise the date above when we do. Questions or privacy requests may be sent to <a href="mailto:melyssa.plunkett@racepoint.ai" style={{ color: "#6556e8" }}>melyssa.plunkett@racepoint.ai</a>.</p>
        </section>

        <footer style={{ marginTop: 38, paddingTop: 22, borderTop: "1px solid #e8e9ef", display: "flex", gap: 18, fontSize: 14 }}>
          <Link href="/asset-access/terms" style={{ color: "#6556e8" }}>Terms of Service</Link>
          <Link href="/asset-access/sign-in" style={{ color: "#6556e8" }}>Sign in</Link>
        </footer>
      </article>
    </main>
  );
}
