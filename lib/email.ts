import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

type AccessNotice = {
  ownerId: string;
  assetName: string;
  linkLabel: string | null;
  visitorEmail: string | null;
  country: string | null;
  accessedAt: Date;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
}

export async function sendAssetAccessEmail(notice: AccessNotice) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[asset-access-email] RESEND_API_KEY is not configured");
    return;
  }

  try {
    const clerk = await clerkClient();
    const owner = await clerk.users.getUser(notice.ownerId);
    const recipient = owner.primaryEmailAddress?.emailAddress;
    if (!recipient) {
      console.warn("[asset-access-email] Owner has no primary email", { ownerId: notice.ownerId });
      return;
    }

    const visitor = notice.visitorEmail || "An anonymous visitor";
    const label = notice.linkLabel ? ` via “${notice.linkLabel}”` : "";
    const time = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York",
    }).format(notice.accessedAt);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Assetly <onboarding@resend.dev>",
      to: recipient,
      subject: `${visitor} viewed ${notice.assetName}`,
      html: `<div style="font-family:Arial,sans-serif;color:#151827;max-width:560px;margin:auto">
        <p style="font-size:12px;color:#6556e8;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Asset accessed</p>
        <h1 style="font-size:24px;line-height:1.25">${escapeHtml(notice.assetName)}</h1>
        <p style="font-size:16px"><strong>${escapeHtml(visitor)}</strong> opened your asset${escapeHtml(label)}.</p>
        <table style="font-size:14px;color:#555;border-collapse:collapse">
          <tr><td style="padding:5px 18px 5px 0"><strong>When</strong></td><td>${escapeHtml(time)} ET</td></tr>
          ${notice.country ? `<tr><td style="padding:5px 18px 5px 0"><strong>Country</strong></td><td>${escapeHtml(notice.country)}</td></tr>` : ""}
        </table>
        <p style="margin-top:28px"><a href="https://asset-access-kappa.vercel.app" style="background:#6556e8;color:white;text-decoration:none;padding:11px 16px;border-radius:7px;display:inline-block">View analytics</a></p>
      </div>`,
    });
    if (error) console.error("[asset-access-email] Resend rejected notification", error);
  } catch (error) {
    console.error("[asset-access-email] Notification failed", error);
  }
}
