import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type"),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const shareLinks = pgTable("share_links", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull().references(() => assets.id),
  label: text("label"),
  requireEmail: boolean("require_email").notNull().default(true),
  allowDownload: boolean("allow_download").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const visitorSessions = pgTable("visitor_sessions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => shareLinks.id),
  visitorEmail: text("visitor_email"),
  country: text("country"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
});

export const visits = pgTable("visits", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => shareLinks.id),
  sessionId: text("session_id").references(() => visitorSessions.id),
  visitorEmail: text("visitor_email"),
  event: text("event").notNull(),
  durationMs: integer("duration_ms"),
  progress: integer("progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
