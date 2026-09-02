# Asset Access multi-tenant audit

Date: 2026-09-02

## Current status

Asset Access currently isolates authenticated records by Clerk user ID. That supports separate personal workspaces, but it is not yet a complete organization-level multi-tenant model.

## Service audit

| Service | Multi-tenant support | Current Asset Access status | Required action |
| --- | --- | --- | --- |
| Clerk | Supports organizations, memberships, roles, and per-request organization IDs | Development instance is active; Organizations is disabled | Enable Organizations, create a production instance, and deploy production keys |
| Neon Postgres | Supports shared-schema tenancy using a tenant ID and indexes; database-level RLS can be added later | Assets are filtered by a Clerk user ID stored in the legacy `owner_email` column | Add `tenant_id`, backfill existing records, and filter every authenticated query by the active tenant |
| Vercel Blob | Supports private shared storage and tenant-prefixed object paths | Store is private, but new object paths are not tenant-prefixed | Prefix uploads with the active tenant and validate that prefix server-side |
| Resend | Supports transactional email to different tenant users from one verified sending domain | Access notification code exists, but `RESEND_API_KEY` and `EMAIL_FROM` are not configured for this project | Install the Resend project resource and verify a sending domain |
| Vercel | Supports a shared multi-tenant application deployment and Git-based production deploys | GitHub deployment is connected and production is healthy | Keep GitHub as source of truth and deploy only GitHub commits |

## Application findings

- Public share access already records visitor sessions and open events.
- A background email is already queued after a successful access, addressed to the Clerk user who owns the asset.
- Email failures are deliberately non-blocking, but the production environment currently lacks the API key required to send.
- Authenticated asset, link, and analytics queries are filtered by the current Clerk user ID.
- The interface has no logout control and contains hard-coded owner identity text.
- Organization workspaces, organization switching, tenant-aware upload prefixes, and tenant role enforcement are not yet implemented.
- Public links are intentionally accessible without Clerk authentication; access is controlled by the unguessable link ID, revocation, expiration, and optional visitor-email gate.

## Implementation target

1. Resolve each authenticated request to `tenantId = active Clerk organization ID or Clerk user ID`.
2. Add and backfill `assets.tenant_id`; retain the existing owner field as the notification recipient/creator ID.
3. Filter all authenticated reads and mutations by `tenant_id`.
4. Prefix and validate new private Blob paths by tenant.
5. Add Clerk organization switching and an account menu with logout.
6. Keep access-email delivery tenant-safe by resolving the asset creator in Clerk.
7. Use a verified sender domain and production Clerk credentials before onboarding customers.

## Deployment rule

Every application code or configuration change must be committed to GitHub first. Vercel production must be deployed from, and verified against, that GitHub commit. Dashboard-only secrets, domains, and integrations must be documented here or in the repository operations documentation.
