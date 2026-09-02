import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

function createDb() {
  return drizzle(neon(databaseUrl()), { schema });
}

let instance: ReturnType<typeof createDb> | null = null;
let initialized: Promise<void> | null = null;

async function ensureSchema() {
  if (!initialized) {
    initialized = (async () => {
      const sql = neon(databaseUrl());
      await sql`CREATE TABLE IF NOT EXISTS assets (id text PRIMARY KEY, owner_email text NOT NULL, tenant_id text NOT NULL, name text NOT NULL, file_name text NOT NULL, object_key text NOT NULL, content_type text, size integer NOT NULL, created_at timestamptz NOT NULL, archived_at timestamptz)`;
      await sql`CREATE TABLE IF NOT EXISTS share_links (id text PRIMARY KEY, asset_id text NOT NULL REFERENCES assets(id), label text, require_email boolean NOT NULL DEFAULT true, allow_download boolean NOT NULL DEFAULT false, expires_at timestamptz, revoked_at timestamptz, created_at timestamptz NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS visitor_sessions (id text PRIMARY KEY, link_id text NOT NULL REFERENCES share_links(id), visitor_email text, country text, user_agent text, created_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS visits (id text PRIMARY KEY, link_id text NOT NULL REFERENCES share_links(id), session_id text REFERENCES visitor_sessions(id), visitor_email text, event text NOT NULL, duration_ms integer, progress integer, created_at timestamptz NOT NULL)`;
      await sql`ALTER TABLE assets ADD COLUMN IF NOT EXISTS tenant_id text`;
      await sql`UPDATE assets SET tenant_id = owner_email WHERE tenant_id IS NULL`;
      await sql`ALTER TABLE assets ALTER COLUMN tenant_id SET NOT NULL`;
      await sql`CREATE INDEX IF NOT EXISTS assets_owner_idx ON assets(owner_email)`;
      await sql`CREATE INDEX IF NOT EXISTS assets_tenant_idx ON assets(tenant_id)`;
      await sql`CREATE INDEX IF NOT EXISTS links_asset_idx ON share_links(asset_id)`;
      await sql`CREATE INDEX IF NOT EXISTS visits_link_idx ON visits(link_id)`;
    })();
  }
  await initialized;
}

export async function getDb() {
  await ensureSchema();
  if (!instance) instance = createDb();
  return instance;
}
