# Asset Access multi-tenant audit

Date: 2026-09-02
Status: tenant isolation and required service configuration implemented

## Service audit

| Service | Multi-tenant capability | Asset Access configuration |
| --- | --- | --- |
| Clerk | Organizations, memberships, roles, and an active organization on each request | Production instance created for `racepoint.ai`; Organizations enabled; production keys connected to Vercel Production and Preview |
| Neon Postgres | Shared-schema tenancy with indexed tenant keys | `assets.tenant_id` added and indexed; legacy records backfill to their creator's personal tenant; every authenticated asset, link, and analytics query filters by the active tenant |
| Vercel Blob | Private storage with namespaced object paths | Store remains private; new uploads use `tenants/{tenantId}/assets/...`; upload authorization and asset registration validate the active-tenant prefix |
| Resend | Transactional email from a verified domain | Resend Messaging connected to the Vercel project; `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN` are available in Production and Preview |
| Vercel | Git-based production deployment and custom-domain routing | GitHub `main` is the source of truth; `racepoint.ai/asset-access` is routed to this deployment |

## Application controls

- A signed-in user works in their active Clerk organization, or in their personal workspace when no organization is active.
- Organization members share data only within their active tenant.
- The asset creator's Clerk user ID remains in the legacy `owner_email` column and is used as the recipient for access notifications.
- Public share access records visitor sessions and open events, then queues a non-blocking email notification to the asset creator.
- The UI includes organization switching and a Clerk account menu with logout.
- Public links remain intentionally unauthenticated. Access is controlled by a high-entropy link ID, revocation, expiration, and an optional visitor-email gate.

## Remaining hardening options

These are not blockers for tenant isolation, but are appropriate before larger enterprise onboarding:

1. Add Clerk role checks for owner/admin-only actions such as deleting assets or managing organization settings.
2. Add database row-level security as a defense-in-depth layer.
3. Add an email delivery event/log table and a retry workflow for provider failures.
4. Add automated cross-tenant authorization tests to CI.
5. Configure a custom `EMAIL_FROM` only if a sender different from the Resend-managed verified domain is desired.

## Deployment rule

Every application code or configuration change must be committed to GitHub first. Vercel production must be deployed from, and verified against, that GitHub commit. Dashboard-only secrets, domains, and integrations must be documented here or in repository operations documentation.
