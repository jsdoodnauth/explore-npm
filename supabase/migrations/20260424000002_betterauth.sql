-- ============================================================================
-- BetterAuth core tables — generated via `npx @better-auth/cli@latest generate`
-- against better-auth@^1.6.9 with emailAndPassword + Google OAuth.
--
-- Idempotent (CREATE TABLE IF NOT EXISTS): the dev DB may already have these
-- from an earlier hand-written template migration; this lets `supabase db push`
-- track this file as applied without erroring on existing tables.
--
-- If you regenerate this file with the CLI, re-add the `IF NOT EXISTS` guards.
-- ============================================================================

create table if not exists "user" (
  "id"            text        not null primary key,
  "name"          text        not null,
  "email"         text        not null unique,
  "emailVerified" boolean     not null,
  "image"         text,
  "createdAt"     timestamptz not null default current_timestamp,
  "updatedAt"     timestamptz not null default current_timestamp
);

create table if not exists "session" (
  "id"        text        not null primary key,
  "expiresAt" timestamptz not null,
  "token"     text        not null unique,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId"    text        not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id"                    text        not null primary key,
  "accountId"             text        not null,
  "providerId"            text        not null,
  "userId"                text        not null references "user" ("id") on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamptz not null default current_timestamp,
  "updatedAt"             timestamptz not null
);

create table if not exists "verification" (
  "id"          text        not null primary key,
  "identifier"  text        not null,
  "value"       text        not null,
  "expiresAt"   timestamptz not null,
  "createdAt"   timestamptz not null default current_timestamp,
  "updatedAt"   timestamptz not null default current_timestamp
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");
