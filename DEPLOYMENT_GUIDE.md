# Digital Family Tree — Production Deployment Guide

**Version:** 6.0  
**Last Updated:** 2026-07-26  
**Monorepo:** `pnpm workspaces` | **Frontend:** Next.js 15 (Vercel) | **Backend:** NestJS 10 (Render)  
**Database:** PostgreSQL (Neon) | **Graph:** Neo4j AuraDB | **Cache:** Redis | **Queue:** BullMQ  
**Storage:** Cloudinary | **Email:** Resend | **Maps:** Mapbox | **Monitor:** Sentry | **Analytics:** PostHog

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Local Development](#2-local-development)
3. [Environment Variables](#3-environment-variables)
4. [Neon Migration](#4-neon-migration)
5. [Neo4j Production](#5-neo4j-production)
6. [Redis](#6-redis)
7. [Cloudinary](#7-cloudinary)
8. [Resend](#8-resend)
9. [Mapbox](#9-mapbox)
10. [Docker](#10-docker)
11. [Vercel Deployment](#11-vercel-deployment)
12. [Render Deployment](#12-render-deployment)
13. [GitHub Workflow](#13-github-workflow)
14. [Production Checklist](#14-production-checklist)
15. [Troubleshooting](#15-troubleshooting)
16. [Maintenance](#16-maintenance)
17. [Scaling Plan](#17-scaling-plan)
18. [Security Checklist](#18-security-checklist)
19. [Final Verification](#19-final-verification)

---

## 1. Project Architecture

### High-Level System Diagram

```
                         ┌──────────────────────────────────────────────────┐
                         │                   Vercel (CDN)                    │
                         │         https://app.yourdomain.com               │
                         └──────────────┬───────────────────────┬───────────┘
                                        │                       │
                         ┌──────────────▼───────────┐  ┌────────▼──────────┐
                         │     Web (Next.js 15)    │  │  Admin (Next.js)  │
                         │   Port 4001 (dev/build) │  │  Port 4002        │
                         │  @digital-family-tree/web│  │ @digital-fam-tree │
                         └──────────────┬───────────┘  └────────┬──────────┘
                                        │                       │
                          /api/nest/*   │            X-Admin-Key │
                          rewrite       │                       │
                                        └───────┬───────────────┘
                                                │
                         ┌──────────────────────▼──────────────────────────┐
                         │              Render (Node 22)                   │
                         │         NestJS API Server - Port 4000            │
                         │       @digital-family-tree/api                  │
                         │  Health: /api/health | Swagger: /api/docs       │
                         │   Rate Limit: 100 req/min | Helmet | CORS       │
                         └──────┬──────────────┬──────────────┬────────────┘
                                │              │              │
                   ┌────────────▼───┐  ┌───────▼──────┐  ┌───▼────────────┐
                   │  Neon (PG 16)  │  │ Neo4j AuraDB │  │  Redis Cloud   │
                   │   PostgreSQL   │  │  Graph DB    │  │  Cache / Queue │
                   │   Prisma ORM   │  │  7687 Bolt   │  │  BullMQ        │
                   └────────────────┘  └──────────────┘  └────────────────┘
                                                │
                   ┌────────────────────────────┼────────────────────────────┐
                   │              ┌─────────────▼──────────────┐            │
                   │              │    Cloudinary (Storage)    │            │
                   │              │  Images | Videos | Docs    │            │
                   │              └────────────────────────────┘            │
                   │                                                        │
                   │  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐ │
                   │  │  Resend  │  │  Mapbox  │  │ Sentry │  │ PostHog  │ │
                   │  │  Email   │  │   Maps   │  │Monitor │  │Analytics │ │
                   │  └──────────┘  └──────────┘  └────────┘  └──────────┘ │
                   └────────────────────────────────────────────────────────┘
```

### Service Communication Flow

| From            | To                | Protocol          | Purpose                                      |
| --------------- | ----------------- | ----------------- | -------------------------------------------- |
| Web (Next.js)   | NestJS API        | HTTP/HTTPS (REST) | All data operations via `api/nest/*` rewrite |
| Admin (Next.js) | NestJS API        | HTTP/HTTPS (REST) | Admin operations with `X-Admin-Key` header   |
| NestJS API      | PostgreSQL (Neon) | TCP (5432)        | Primary data store via Prisma ORM            |
| NestJS API      | Neo4j (AuraDB)    | Bolt (7687)       | Graph traversal, kinship, common ancestor    |
| NestJS API      | Redis             | TCP (6379)        | Session cache, BullMQ queue, rate limiting   |
| NestJS API      | Cloudinary        | HTTPS (REST)      | Media upload, storage, optimization          |
| NestJS API      | Resend            | HTTPS (REST)      | Transactional emails (OTP, invitations)      |
| NestJS API      | Mapbox            | HTTPS (REST)      | Geocoding, map tiles, location data          |
| NestJS API      | Sentry            | HTTPS             | Error tracking and performance monitoring    |
| Web (Next.js)   | PostHog           | HTTPS             | Product analytics and feature tracking       |

### Monorepo Package Dependency Graph

```
                    ┌──────────────────────┐
                    │   pnpm-workspace.yaml │
                    │   turbo.json          │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌───────▼───────┐    ┌───────▼──────┐
   │ apps/api    │    │ apps/web      │    │ apps/admin   │
   │ NestJS 10   │    │ Next.js 15    │    │ Next.js 15   │
   │ Port 4000   │    │ Port 4001     │    │ Port 4002    │
   └──────┬──────┘    └───────┬───────┘    └─────────────┘
          │                   │
          │    ┌──────────────┴──────────────┐
          │    │  packages/*                 │
          │    │  ┌──────────────────────┐  │
          │    │  │ @dft/ui  @dft/config │  │
          │    │  │ @dft/types @dft/utils│  │
          │    │  │ @dft/hooks           │  │
          │    │  └──────────────────────┘  │
          │    └────────────────────────────┘
          │
   ┌──────┴──────────────────────────────────────────┐
   │  External Services                               │
   │  PostgreSQL ─── Neo4j ─── Redis ─── Cloudinary   │
   │  Resend ─── Mapbox ─── Sentry ─── PostHog        │
   └─────────────────────────────────────────────────┘
```

### Database Architecture

```
PostgreSQL (Prisma ORM — 93+ Models)
├── Core: User, Family, FamilyMember, Relationship
├── Auth: LoginSession, Invitation
├── Hierarchy: Community, Clan, SubClan, ClanRequest, ClanAdmin
├── Timeline: TimelineEvent, EventParticipant, EventReminder
├── Event Info: BirthInformation, MarriageInformation, DeathInformation ...
├── Social: EventComment, EventReaction, Memory, MemoryComment
├── Notifications: Notification, NotificationPreference, NotificationDelivery
├── Document Vault: DocumentVault, DocumentVersion, DocumentFolder, DocumentShare
├── Merge: DuplicatePair, MergeSnapshot, MergeAuditLog
├── Tree: TreeView, TreeLayoutCache, TreeBranch, TreeBookmark
└── System: AuditLog, Activity, Bookmark

Neo4j (Graph — Sync from PostgreSQL)
├── Person (node)
├── Family (node)
├── PARENT_OF (relationship)
├── MARRIED_TO (relationship)
├── BELONGS_TO (relationship)
└── Generational labels for traversal
```

---

## 2. Local Development

### Prerequisites

| Software           | Version | Required | Purpose                                 |
| ------------------ | ------- | -------- | --------------------------------------- |
| **Node.js**        | 22.x    | ✅       | Runtime for all apps                    |
| **pnpm**           | 9.15.0  | ✅       | Package manager (`corepack enable`)     |
| **Docker Desktop** | Latest  | ✅       | PostgreSQL, Neo4j, Redis containers     |
| **Git**            | Latest  | ✅       | Version control                         |
| **Prisma**         | 5.22.0  | ✅       | ORM (bundled, no global install needed) |

### Initial Setup

```bash
# 1. Enable pnpm via corepack
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 2. Clone the repository
git clone https://github.com/your-org/digital-family-tree.git
cd digital-family-tree

# 3. Install dependencies
pnpm install

# 4. Start infrastructure containers (PostgreSQL, Neo4j, Redis)
docker compose -f docker/docker-compose.dev.yml up -d

# 5. Copy environment files
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your local values (defaults work for local dev)

# 6. Push Prisma schema to local database
cd apps/api
npx prisma db push
npx prisma generate
cd ../..

# 7. Start all apps in development mode
pnpm dev
```

### Available Local Endpoints

| App           | URL                            | Description                    |
| ------------- | ------------------------------ | ------------------------------ |
| Web           | http://localhost:4001          | Next.js frontend               |
| API           | http://localhost:4000/api      | NestJS backend                 |
| Swagger       | http://localhost:4000/api/docs | API documentation              |
| Admin         | http://localhost:4002          | Admin panel                    |
| PostgreSQL    | localhost:5432                 | Database                       |
| Neo4j Browser | http://localhost:7474          | Graph browser (neo4j/changeme) |
| Neo4j Bolt    | localhost:7687                 | Graph connection               |
| Redis         | localhost:6379                 | Cache                          |

### Common Commands

```bash
# Start all apps
pnpm dev

# Start individual apps
pnpm --filter @digital-family-tree/api dev     # API only
pnpm --filter @digital-family-tree/web dev     # Web only
pnpm --filter @digital-family-tree/admin dev   # Admin only

# Build all apps
pnpm build

# TypeScript checks
pnpm --filter @digital-family-tree/api exec tsc --noEmit
pnpm --filter @digital-family-tree/web exec tsc --noEmit
pnpm --filter @digital-family-tree/admin exec tsc --noEmit

# Lint
pnpm lint

# Run tests
pnpm --filter @digital-family-tree/api test

# Prisma commands
cd apps/api
npx prisma db push          # Push schema to database
npx prisma generate          # Generate Prisma client
npx prisma studio            # Open Prisma Studio GUI
npx prisma db pull           # Pull schema from database
cd ../..
```

### Stop, Reset, Rebuild

```bash
# Stop all apps (Ctrl+C in each terminal, or stop Docker containers)
docker compose -f docker/docker-compose.dev.yml down

# Full reset (destroy containers + data)
docker compose -f docker/docker-compose.dev.yml down -v

# Rebuild from scratch
rm -rf node_modules apps/*/node_modules apps/*/.next apps/*/dist
pnpm install
pnpm build
docker compose -f docker/docker-compose.dev.yml up -d
cd apps/api && npx prisma db push && npx prisma generate && cd ../..
pnpm dev
```

---

## 3. Environment Variables

### Root `.env` (Shared)

Located at project root. Used by the monorepo tooling and shared packages.

| Variable                      | Required | Service | Example Value                                                       | Production Value                                      |
| ----------------------------- | -------- | ------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`         | ✅       | Web     | `http://localhost:4001`                                             | `https://app.yourdomain.com`                          |
| `NEXT_PUBLIC_APP_NAME`        | ✅       | Web     | `"Digital Family Tree"`                                             | `"Digital Family Tree"`                               |
| `NEXT_PUBLIC_APP_DESCRIPTION` | ✅       | Web     | `"A modern platform..."`                                            | `"Discover your family heritage"`                     |
| `API_URL`                     | ✅       | Shared  | `http://localhost:4000`                                             | `https://api.yourdomain.com`                          |
| `API_PORT`                    | ✅       | Shared  | `4000`                                                              | `4000`                                                |
| `DATABASE_URL`                | ✅       | API     | `postgresql://postgres:postgres@localhost:5432/digital_family_tree` | `postgresql://user:pass@ep-xxx.neon.tech/neondb`      |
| `NEO4J_URI`                   | ⚠️       | API     | `neo4j+s://d483f783.databases.neo4j.io`                             | `neo4j+s://your-instance.databases.neo4j.io`          |
| `NEO4J_USERNAME`              | ⚠️       | API     | `d483f783`                                                          | Your Neo4j username                                   |
| `NEO4J_PASSWORD`              | ⚠️       | API     | `your-password`                                                     | Your Neo4j password                                   |
| `REDIS_URL`                   | ⚠️       | API     | `redis://localhost:6379`                                            | `redis://default:pass@your-redis.upstash.io:6379`     |
| `JWT_SECRET`                  | ✅       | API     | `change-this-to-a-random-secret`                                    | Generate via `crypto.randomBytes(64).toString('hex')` |
| `JWT_EXPIRATION`              | ✅       | API     | `7d`                                                                | `1h`                                                  |
| `NODE_ENV`                    | ✅       | All     | `development`                                                       | `production`                                          |

> **Note:** The admin key is **server-side only** (`ADMIN_API_KEY` — see Backend table below). It is forwarded to the API by the admin app's server-side proxy (`apps/admin/app/api/nest/[...path]/route.ts`) and is never shipped to the browser; `NEXT_PUBLIC_ADMIN_API_KEY` was removed for security.

### Backend `apps/api/.env`

Located at `apps/api/.env`. **SECRETS — never commit to git.**

| Variable                 | Required | Service    | Example Value                                                       | Production Value                   |
| ------------------------ | -------- | ---------- | ------------------------------------------------------------------- | ---------------------------------- |
| `NODE_ENV`               | ✅       | API        | `development`                                                       | `production`                       |
| `PORT`                   | ✅       | API        | `4000`                                                              | `4000`                             |
| `API_PREFIX`             | ✅       | API        | `api`                                                               | `api`                              |
| `DATABASE_URL`           | ✅       | Prisma     | `postgresql://postgres:postgres@localhost:5432/digital_family_tree` | Neon connection string             |
| `NEO4J_URI`              | ⚠️       | Neo4j      | `bolt://localhost:7687`                                             | `neo4j+s://xxx.databases.neo4j.io` |
| `NEO4J_USERNAME`         | ⚠️       | Neo4j      | `neo4j`                                                             | Your Neo4j username                |
| `NEO4J_PASSWORD`         | ⚠️       | Neo4j      | `changeme`                                                          | Your Neo4j password                |
| `NEO4J_DATABASE`         | ⚠️       | Neo4j      | `neo4j`                                                             | `neo4j`                            |
| `REDIS_URL`              | ⚠️       | Redis      | `redis://localhost:6379`                                            | `redis://default:pass@host:6379`   |
| `JWT_SECRET`             | ✅       | Auth       | `change-this-to-a-random-secret-in-production`                      | 64-byte random hex                 |
| `JWT_REFRESH_SECRET`     | ✅       | Auth       | `change-this-to-a-different-random-secret-in-production`            | Different 64-byte random hex       |
| `JWT_EXPIRATION`         | ✅       | Auth       | `1h`                                                                | `1h`                               |
| `JWT_REFRESH_EXPIRATION` | ✅       | Auth       | `30d`                                                               | `30d`                              |
| `CORS_ORIGIN`            | ✅       | API        | `http://localhost:4001`                                             | `https://app.yourdomain.com`       |
| `ADMIN_API_KEY`          | ✅       | Admin Auth | `dft-admin-secret-key-2024`                                         | Generate 64-char random hex        |
| `CLOUDINARY_CLOUD_NAME`  | ⚠️       | Cloudinary | `your-cloud-name`                                                   | From Cloudinary dashboard          |
| `CLOUDINARY_API_KEY`     | ⚠️       | Cloudinary | `your-api-key`                                                      | From Cloudinary dashboard          |
| `CLOUDINARY_API_SECRET`  | ⚠️       | Cloudinary | `your-api-secret`                                                   | From Cloudinary dashboard          |

### Frontend `apps/web/.env.local`

Located at `apps/web/.env.local`. **Never commit.**

This app currently inherits environment from root `.env`. The Next.js config reads `NEXT_PUBLIC_API_URL` from `process.env` and defaults to `http://localhost:4000`.

Add a `.env.local` in production:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_NAME="Digital Family Tree"
NEXT_PUBLIC_APP_DESCRIPTION="Discover your family heritage"
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### Admin `apps/admin/.env.local`

Located at `apps/admin/.env.local`.

```env
NEXT_PUBLIC_ADMIN_API_KEY=dft-admin-secret-key-2024
```

In production, use the same `ADMIN_API_KEY` value from the API's environment.

### Secret Generation

```bash
# Generate secure secrets for production
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ADMIN_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Neon Migration

### Step 1: Create Neon Account

1. Go to https://console.neon.tech
2. Sign up with GitHub or email
3. Free tier: 0.5 GB storage, 100 compute hours/month

### Step 2: Create Project

1. Click **Create Project**
2. Region: Choose closest to your Render deployment (e.g., `US East (N. Virginia)`)
3. PostgreSQL version: **16**
4. Click **Create Project**

### Step 3: Obtain Connection String

After creation, Neon displays your connection string:

```
postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> **⚠️ IMPORTANT:** The connection string contains your database password. Store it securely. Never commit it.

### Step 4: Configure Application

Set the `DATABASE_URL` environment variable in:

**Root `.env` (for local/tooling):**

```env
DATABASE_URL="postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Render dashboard → Environment Variables:**

```
Key:   DATABASE_URL
Value: postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 5: Run Migration

```bash
# Generate Prisma client (run during build)
cd apps/api
npx prisma generate

# Deploy schema to Neon
npx prisma db push
# OR use migrations if initialized:
# npx prisma migrate deploy
cd ../..
```

> **Note:** This project currently uses `prisma db push` (schema sync) rather than `prisma migrate` (migration files). The `migrations/` directory does not exist yet. For production, you should initialize migrations:
>
> ```bash
> cd apps/api
> npx prisma migrate dev --name init  # Creates initial migration
> npx prisma migrate deploy           # Apply to production
> ```

### Step 6: Verify Migration

```bash
# Check Prisma client generation
npx prisma generate

# Verify connection via API health endpoint
curl https://api.yourdomain.com/api/health
# Expected: {"status":"ok","neo4j":{"connected":false},...}
```

### Rollback Process

```bash
# If using migrations:
npx prisma migrate reset        # WARNING: drops all data
npx prisma migrate deploy       # Re-apply migrations

# To rollback a specific migration:
npx prisma migrate resolve --rolled-back "migration_name"
```

---

## 5. Neo4j Production

### Options

| Option                        | Cost             | Use Case                          |
| ----------------------------- | ---------------- | --------------------------------- |
| **Neo4j AuraDB Free**         | Free (50k nodes) | Development / Staging             |
| **Neo4j AuraDB Professional** | ~$65/month       | Production (small-medium)         |
| **Docker self-hosted**        | Server cost      | Full control, lower cost at scale |
| **Neo4j AuraDB Enterprise**   | Custom           | High-scale production             |

### Local Docker (Development)

```bash
docker run -d \
  --name neo4j \
  -p 7687:7687 \
  -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/changeme \
  -e NEO4J_dbms_memory_pagecache_size=512M \
  -e NEO4J_dbms_memory_heap_initial__size=512M \
  -e NEO4J_dbms_memory_heap_max__size=1G \
  -v neo4j_data:/data \
  neo4j:5-community
```

Access browser at http://localhost:7474 (username: `neo4j`, password: `changeme`).

### Neo4j AuraDB (Production)

1. Go to https://console.neo4j.io/
2. Click **Create Instance**
3. Select **AuraDB Free** or **Professional**
4. Choose region (same as your Render deployment)
5. Click **Create**
6. Download auto-generated credentials (shown once only)
7. Set environment variables:

```env
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-instance-password
NEO4J_DATABASE=neo4j
```

### Sync Data from PostgreSQL to Neo4j

The `SyncService` in `apps/api/src/neo4j/services/sync.service.ts` handles synchronization. Sync writes are **idempotent** (MERGE on `id`), so re-running is safe.

Wired endpoint (admin API key required):

```bash
curl -X POST https://api.yourdomain.com/api/admin/neo4j/sync \
  -H "X-Admin-Key: $ADMIN_API_KEY"
# { "success": true, "nodesCreated": 42, "nodesUpdated": 0, "relationshipsCreated": 87, ... }
```

When Neo4j is not configured/reachable the call returns `200` (sync) with `{ "success": false, "errors": ["Neo4j not connected"] }`, and graph read endpoints (`/api/genealogy/*`) either fall back to empty results or return `503` — never silent partial data.

Programmatic trigger (NestJS console/script):

```typescript
const syncService = app.get(SyncService);
const result = await syncService.syncAll();
// { success: true, nodesCreated: 42, relationshipsCreated: 87, ... }
```

### Neo4j Constraints & Indexes

Applied automatically by `GraphRepository` during sync:

```cypher
// Person node constraints
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);

// Family node constraints
CREATE CONSTRAINT family_id IF NOT EXISTS FOR (f:Family) REQUIRE f.id IS UNIQUE;

// Relationship indices
CREATE INDEX relationship_from IF NOT EXISTS FOR ()-[r:PARENT_OF]->() ON (r.fromNodeId);
CREATE INDEX relationship_to IF NOT EXISTS FOR ()-[r:MARRIED_TO]->() ON (r.toNodeId);
```

### Verification

```bash
# Check Neo4j health via API
curl https://api.yourdomain.com/api/health
# Neo4j connected: true

# Check via Cypher
:GET /db/neo4j/tx/commit
# Body: {"statements":[{"statement":"MATCH (n) RETURN count(n) AS count"}]}
```

---

## 6. Redis

### Purpose in the Stack

| Feature                | Implementation              | Status  |
| ---------------------- | --------------------------- | ------- |
| **BullMQ Queue**       | Background job processing   | Planned |
| **Session Cache**      | JWT refresh token cache     | Planned |
| **Rate Limiting**      | Distributed rate limiting   | Planned |
| **View Cache**         | Tree layout caching         | Planned |
| **Notification Queue** | Async notification delivery | Planned |

### Local Redis (Development)

```bash
# Via Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Test connection
redis-cli ping
# PONG
```

### Production Redis

**Option A: Redis Cloud (Upstash)** — Free tier available

1. Go to https://console.upstash.com
2. Create a Redis database
3. Copy the `REDIS_URL` (e.g., `redis://default:password@xxxx.upstash.io:6379`)

**Option B: Render Managed Redis**

1. In Render dashboard, go to **Marketplace → Redis**
2. Create a new Redis instance
3. Copy the connection string

**Option C: Self-hosted on VPS**

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --requirepass your-password --appendonly yes
```

### Environment Configuration

```env
REDIS_URL=redis://default:your-password@your-instance.upstash.io:6379
```

### BullMQ Queue Configuration

For the planned job queue system, configure in `apps/api/src/main.ts`:

```typescript
import { BullModule } from '@nestjs/bullmq';

BullModule.forRoot({
  connection: {
    url: process.env.REDIS_URL,
  },
});
```

Job types planned: notification delivery, email sending, Neo4j sync, AI summary generation, media optimization.

---

## 7. Cloudinary

### Account Setup

1. Go to https://cloudinary.com
2. Sign up (free tier: 25GB storage, 25GB bandwidth)
3. Navigate to **Dashboard**
4. Copy your credentials:
   - `CLOUDINARY_CLOUD_NAME` (e.g., `dgp6abcde`)
   - `CLOUDINARY_API_KEY` (e.g., `123456789012345`)
   - `CLOUDINARY_API_SECRET` (e.g., `abc123def456`)

### Environment Variables

```env
CLOUDINARY_CLOUD_NAME=dgp6abcde
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456
```

> **⚠️ WARNING:** Previous credentials were hardcoded and committed. They have been rotated. Obtain fresh values from your Cloudinary dashboard.

### Folder Structure

```
digital-family-tree/
├── avatars/              # User profile avatars
├── covers/               # User profile cover photos
├── events/               # Timeline event media
│   ├── images/           # Event photos
│   ├── videos/           # Event videos
│   └── thumbnails/       # Auto-generated thumbnails
├── documents/            # Event documents (PDF, DOCX, etc.)
├── memories/             # Family memory media
├── galleries/            # Community/clan galleries
└── temp/                 # Temporary uploads (auto-cleanup)
```

### Upload Flow

```
Client (Browser)
  │
  │ POST /upload/event-media/:eventId (multipart/form-data)
  │ File(s) attached
  ▼
NestJS API (UploadController)
  │
  │ cloudinary.uploader.upload(file, options)
  │ Options: folder, transformation, resource_type
  ▼
Cloudinary API
  │
  │ Returns: { public_id, secure_url, format, width, height, bytes }
  ▼
PostgreSQL (EventMedia model)
  │ Stores: URL, public_id, format, metadata
  ▼
Response to client: { url, publicId, thumbnail, ... }
```

### Image Optimization

Cloudinary transformations are applied automatically:

```typescript
// Default upload options
{
  folder: `events/${eventId}`,
  transformation: [
    { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
    { format: 'auto' },
  ],
}

// Thumbnail generation (automatic)
// Access via: https://res.cloudinary.com/cloud_name/image/upload/w_200,h_200,c_fill/...
```

### Delete Flow

```typescript
// Server-side deletion
await cloudinary.uploader.destroy(publicId);

// Client requests deletion
DELETE / upload / delete { url: 'https://res.cloudinary.com/...' };
```

### Document Uploads

Documents (PDF, DOCX, etc.) use `resource_type: 'raw'`:

```typescript
cloudinary.uploader.upload(file, {
  folder: 'documents',
  resource_type: 'raw',
  access_mode: 'authenticated', // For sensitive documents
});
```

---

## 8. Resend

### Account Setup

1. Go to https://resend.com
2. Sign up with GitHub or email
3. Free tier: 100 emails/day, 3,000 emails/month

### Domain Verification

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records (TXT, MX, CNAME) to your DNS provider
5. Wait for verification (can take minutes to hours)

### API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Select permission level (recommended: `Sending access`)
4. Copy the key: `re_xxxxxxxxxxxxx`

### Environment Variable

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Add this to `apps/api/.env` (currently not present — add it).

### Email Templates

| Email Type             | Trigger                   | Recipients          |
| ---------------------- | ------------------------- | ------------------- |
| **Email Verification** | User registration         | New user            |
| **OTP Code**           | Two-factor authentication | Authenticating user |
| **Invitation**         | Family/clan invitation    | Invited user        |
| **Password Reset**     | Forgot password flow      | Requesting user     |
| **Notification**       | Event notifications       | Affected users      |
| **Welcome**            | Account activation        | New user            |

### Integration Code

```typescript
// Add to apps/api/src/
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Digital Family Tree <noreply@yourdomain.com>',
  to: user.email,
  subject: 'Verify your email',
  html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
});
```

---

## 9. Mapbox

### Account Setup

1. Go to https://account.mapbox.com
2. Sign up (free tier: 50,000 map loads/month)
3. Navigate to **Tokens** in your account dashboard

### Access Token

1. Click **Create a token**
2. Name: `Digital Family Tree Production`
3. Scopes:
   - ✅ `mapbox.places` (geocoding)
   - ✅ `mapbox.places-permanent` (reverse geocoding)
   - ✅ `mapbox.raster` (map tiles)
   - ✅ `mapbox.styles` (map styles)
4. Click **Create**
5. Copy the token: `pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjb...`

### Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjb...
```

Add to `apps/web/.env.local`.

### Features Using Mapbox

| Feature                   | Mapbox Service | Location                       |
| ------------------------- | -------------- | ------------------------------ |
| **Event Location Picker** | Geocoding API  | `/dashboard/timeline/new`      |
| **Timeline Maps**         | Map display    | `/dashboard/timeline/[id]`     |
| **Community Locations**   | Map display    | `/dashboard/communities`       |
| **Clan Locations**        | Map display    | `/dashboard/clans`             |
| **Reverse Geocoding**     | Places API     | Location coordinates → address |
| **Event Venue Maps**      | Static maps    | Print/export views             |

### Usage

```typescript
// Geocoding (forward)
const response = await fetch(
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}`,
);

// Reverse geocoding
const response = await fetch(
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`,
);

// Map component (React)
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
```

---

## 10. Docker

### What Docker Is Used For

The project uses Docker for **infrastructure services only** — NOT for running the application code in production.

| File                            | Purpose                                   | Used In                 |
| ------------------------------- | ----------------------------------------- | ----------------------- |
| `docker/docker-compose.dev.yml` | Local dev: PostgreSQL + Neo4j + Redis     | Development             |
| `docker/docker-compose.yml`     | Full local stack: builds API + Web images | Testing, demo           |
| `docker/Dockerfile.api`         | NestJS multi-stage Docker build           | CI/CD, container deploy |
| `docker/Dockerfile.web`         | Next.js multi-stage Docker build          | CI/CD, container deploy |

### Local Development (docker-compose.dev.yml)

```yaml
# docker/docker-compose.dev.yml
services:
  postgres: # PostgreSQL 16 on port 5432
  neo4j: # Neo4j 5 on ports 7474 (browser) + 7687 (bolt)
  redis: # Redis 7 on port 6379
```

Used only for infrastructure. Application code runs via `pnpm dev` on the host machine with hot-reload.

### Production Docker (docker-compose.yml)

The production `docker-compose.yml` builds full application images:

```yaml
services:
  web: # Builds from Dockerfile.web, runs Next.js standalone
  api: # Builds from Dockerfile.api, runs NestJS dist
  postgres: # PostgreSQL 16-alpine with health check
  neo4j: # Neo4j 5-community with data volume
  redis: # Redis 7-alpine with health check
```

**This is NOT used for the primary production deployment** (which uses Vercel + Render + Neon). It is available for:

- Full local replication of production stack
- CI/CD integration testing
- Self-hosted deployment alternative

### How Production Differs

| Component      | docker-compose.yml             | Production (Vercel + Render)          |
| -------------- | ------------------------------ | ------------------------------------- |
| **PostgreSQL** | Container (postgres:16-alpine) | **Neon** (managed serverless PG)      |
| **API**        | Container (NestJS)             | **Render** (managed Node service)     |
| **Web**        | Container (Next.js)            | **Vercel** (managed Next.js platform) |
| **Admin**      | Not included                   | Render or Vercel                      |
| **Neo4j**      | Container (neo4j:5-community)  | **Neo4j AuraDB** (managed graph DB)   |
| **Redis**      | Container (redis:7-alpine)     | **Upstash** (managed Redis)           |

### What Stays

Docker is **NOT removed** in production. It remains for:

- **Local development** — all infrastructure runs in Docker
- **CI/CD pipelines** — integration tests use Docker services
- **Staging environment** — full Docker stack for pre-production testing
- **Self-hosted alternative** — complete Docker stack if not using managed services

---

## 11. Vercel Deployment

### Step-by-Step

#### 1. Connect GitHub Repository

1. Go to https://vercel.com
2. Click **Add New → Project**
3. Import your GitHub repository (`digital-family-tree`)
4. Select the organization

#### 2. Configure Project

| Setting              | Value                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Framework Preset** | Next.js                                                                            |
| **Root Directory**   | `apps/web`                                                                         |
| **Build Command**    | `cd ../.. && npx pnpm install && npx pnpm --filter @digital-family-tree/web build` |
| **Output Directory** | `.next` (default)                                                                  |
| **Node.js Version**  | 22.x                                                                               |

#### 3. Environment Variables

Add these in Vercel dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_NAME=Digital Family Tree
NEXT_PUBLIC_APP_DESCRIPTION="Discover your family heritage"
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

#### 4. Build Configuration

In `vercel.json` at project root (create if not exists):

```json
{
  "buildCommand": "cd apps/web && npx next build",
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next"
}
```

Or configure in Vercel dashboard directly.

#### 5. Deploy

1. Click **Deploy**
2. Vercel will detect the monorepo structure
3. First build may take 2-3 minutes
4. Subsequent builds are faster due to Turborepo caching

#### 6. Custom Domain

1. In Vercel dashboard, go to **Project → Settings → Domains**
2. Add your domain: `app.yourdomain.com`
3. Follow Vercel's DNS instructions to add CNAME record
4. Wait for SSL certificate provisioning (automatic)

#### 7. Verification

```bash
# Health check
curl https://app.yourdomain.com
# Should return HTML with title: "Digital Family Tree - Discover Your Family Heritage"

# API proxy check
curl https://app.yourdomain.com/api/nest/health
# Should proxy to backend
```

---

## 12. Render Deployment

### Step-by-Step

#### 1. Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Connect your repository

#### 2. Create Web Service

1. Click **New → Web Service**
2. Select your repository
3. Configure:

| Setting            | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Name**           | `digital-family-tree-api`                                                          |
| **Root Directory** | `apps/api`                                                                         |
| **Runtime**        | Node                                                                               |
| **Build Command**  | `cd ../.. && pnpm install && cd apps/api && npx prisma generate && npx nest build` |
| **Start Command**  | `node dist/main`                                                                   |
| **Plan**           | Starter ($7/month) or above                                                        |

#### 3. Node Version

In Render dashboard, set:

```
NODE_VERSION=22
```

Or add `.node-version` file at project root:

```
22
```

#### 4. Health Check

Render uses the health check endpoint to verify the service is running:

```
Health Check Path: /api/health
```

Configured in `apps/api/src/health/health.controller.ts`:

```typescript
@Get()
@ApiOperation({ summary: 'Health check' })
check() {
  return this.healthService.check();
}
```

#### 5. Environment Variables

Add these in Render dashboard → Environment Variables:

```env
NODE_ENV=production
PORT=4000
API_PREFIX=api

DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

JWT_SECRET=<generate 64-byte random hex>
JWT_REFRESH_SECRET=<generate different 64-byte random hex>
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=30d

CORS_ORIGIN=https://app.yourdomain.com
ADMIN_API_KEY=<generate 32-byte random hex>

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password
NEO4J_DATABASE=neo4j

REDIS_URL=redis://default:pass@xxx.upstash.io:6379

RESEND_API_KEY=re_xxxxx
```

#### 6. Auto-Deploy

1. In Render dashboard, go to **Settings → Deploy**
2. Enable **Auto-Deploy** for the main branch
3. Optionally enable **Auto-Deploy** for staging/preview branches

#### 7. Post-Deploy Prisma

After first deploy, run Prisma db push via Render Shell:

```bash
# Open Render Shell
npx prisma db push
npx prisma generate
```

Or add a startup script in `package.json`:

```json
"start:prod": "npx prisma db push && npx prisma generate && node dist/main"
```

#### 8. Verification

```bash
# Check health
curl https://api.yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"...","service":"digital-family-tree-api","version":"0.1.0","neo4j":{"connected":true}}

# Check Swagger docs
curl https://api.yourdomain.com/api/docs
# Should return Swagger HTML
```

---

## 13. GitHub Workflow

### Repository Structure

```
digital-family-tree/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── admin/        # Administration panel
├── packages/
│   ├── config/       # Shared configuration
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utilities
│   └── hooks/        # Shared React hooks
├── docker/           # Docker configuration
├── .github/          # GitHub Actions (to be added)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Branch Strategy

```
main                    # Production branch — deploys to Vercel + Render
├── develop             # Integration branch — feature branches merge here
│   ├── feature/*       # New features (feature/timeline-export)
│   ├── fix/*           # Bug fixes (fix/login-redirect)
│   ├── refactor/*      # Code refactoring (refactor/prisma-queries)
│   └── chore/*         # Maintenance (chore/update-deps)
├── release/*           # Release candidates (release/v6.1.0)
└── hotfix/*            # Emergency production fixes (hotfix/auth-issue)
```

### Commit Strategy

Using conventional commits with commitlint:

```
<type>(<scope>): <description>

Types: feat, fix, chore, docs, style, refactor, perf, test, ci, build
Scopes: api, web, admin, config, ui, types, utils, hooks, docker, root

Examples:
feat(api): add bulk delete endpoint for timeline events
fix(web): correct skip link skipping wrong section
chore(deps): upgrade next to 15.1.0
docs: add deployment guide
```

### CI/CD Pipeline (Planned — GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: digital_family_tree_test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: npx prisma db push && npx prisma generate
        working-directory: apps/api
      - run: npx jest
        working-directory: apps/api

  build:
    runs-on: ubuntu-latest
    needs: [typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      # Vercel deploy
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web
      # Render deploy triggers automatically via webhook
```

---

## 14. Production Checklist

### Database (Neon)

- [ ] PostgreSQL 16 instance created
- [ ] `sslmode=require` in connection string
- [ ] Connection pooled? (PgBouncer via Neon)
- [ ] Automated backups enabled (Neon: point-in-time recovery)
- [ ] `DATABASE_URL` set in Render environment variables
- [ ] Prisma schema deployed (`npx prisma db push` or `migrate deploy`)
- [ ] Prisma client generated

### Graph Database (Neo4j AuraDB)

- [ ] AuraDB instance created with proper sizing
- [ ] Credentials stored securely (not in code)
- [ ] `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` set in Render
- [ ] Access from Render IP whitelisted in AuraDB console
- [ ] Full sync completed (`syncAll()`)
- [ ] Constraints and indexes created
- [ ] Health check confirms `neo4j.connected: true`

### Redis

- [ ] Redis instance created (Upstash / Render Managed)
- [ ] `REDIS_URL` set in Render environment variables
- [ ] Password configured
- [ ] TLS enabled if required
- [ ] Connection test passes

### Cloudinary

- [ ] Cloudinary account created
- [ ] API keys generated (not the committed ones — rotate if needed)
- [ ] Environment variables set in Render
- [ ] Upload folders created (avatars, covers, events, memories, documents)
- [ ] Upload presets configured (optional)
- [ ] Image transformation defaults set

### Resend

- [ ] Resend account created
- [ ] Domain verified (DKIM, SPF, MX records added)
- [ ] API key generated
- [ ] `RESEND_API_KEY` set in Render environment variables
- [ ] Sender email configured (`noreply@yourdomain.com`)
- [ ] Test email sent successfully
- [ ] OTP templates created

### Mapbox

- [ ] Mapbox account created
- [ ] Access token generated with correct scopes
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` set in Vercel environment variables
- [ ] URL restrictions configured in Mapbox dashboard (optional)

### Environment Variables

- [ ] All variables set in Vercel (Web)
- [ ] All variables set in Render (API)
- [ ] All variables set for Admin (if deployed separately)
- [ ] Secrets generated securely (not defaults)
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET` are 64-byte random hex
- [ ] `ADMIN_API_KEY` is 32-byte random hex
- [ ] `CORS_ORIGIN` set to actual frontend URL
- [ ] `NODE_ENV=production`

### Security

- [ ] Helmet headers configured (CSP, X-Frame-Options, etc.) — already in `next.config.ts`
- [ ] Rate limiting enabled (100 req/min per IP) — configured in `app.module.ts`
- [ ] CORS restricted to frontend origin only
- [ ] JWT secrets are production-strength
- [ ] Admin API key is strong
- [ ] All passwords hashed with bcryptjs
- [ ] Input validation enabled (class-validator whitelist)
- [ ] Account lockout configured (5 attempts → 15 min)
- [ ] SQL injection protection (Prisma parameterized queries)
- [ ] XSS protection (React's built-in escaping + CSP headers)

### Backups

- [ ] Neon point-in-time recovery enabled (7-day retention on free tier)
- [ ] Neo4j AuraDB automated backups (daily)
- [ ] Cloudinary backup strategy defined
- [ ] Database backup testing schedule
- [ ] Disaster recovery plan documented

### Monitoring

- [ ] Sentry DSN configured for error tracking
- [ ] PostHog configured for product analytics
- [ ] Render metrics dashboard reviewed
- [ ] API health checks configured
- [ ] Uptime monitoring set up (e.g., UptimeRobot, Better Uptime)
- [ ] Alerting thresholds configured
- [ ] Log retention policy defined

### HTTPS

- [ ] Vercel: automatic SSL certificate provisioned
- [ ] Render: automatic SSL certificate provisioned
- [ ] Custom domain SSL verified
- [ ] HSTS headers configured (Render does this automatically)
- [ ] Certificate auto-renewal confirmed

### Rate Limiting

- [ ] Global: 100 requests/minute per IP (configured via `@nestjs/throttler`)
- [ ] Auth endpoints: stricter limits (e.g., 10/minute for login)
- [ ] Upload endpoints: size and rate limits
- [ ] API key endpoints: admin rate limits

---

## 15. Troubleshooting

### Neon Connection Issues

```
Error: Can't reach database server
Error: Connection terminated unexpectedly
Error: SSL required
```

| Cause                   | Solution                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Wrong connection string | Verify `DATABASE_URL` in Render dashboard. Check username, password, hostname.                                |
| SSL not enabled         | Append `?sslmode=require` to connection string                                                                |
| IP not whitelisted      | Neon allows all connections by default. Check if you enabled IP restrictions.                                 |
| Compute suspended       | Free tier suspends after 5 minutes of inactivity. First request after inactivity takes 2-3 seconds to resume. |

### Prisma Issues

```
Error: Invalid `prisma.timelineEvent.findMany()` invocation
Error: Requested resource is not found
```

| Cause              | Solution                                              |
| ------------------ | ----------------------------------------------------- |
| Schema not pushed  | Run `npx prisma db push`                              |
| Client out of date | Run `npx prisma generate`                             |
| Model mismatch     | Ensure `schema.prisma` is synced with database        |
| Migration pending  | Run `npx prisma migrate deploy` (if using migrations) |

### Redis Issues

```
Error: connect ECONNREFUSED 127.0.0.1:6379
Error: NOAUTH Authentication required
```

| Cause                   | Solution                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| Redis not running       | Start with `docker compose -f docker/docker-compose.dev.yml up -d` |
| Wrong URL               | Check `REDIS_URL` format: `redis://[[user]:[password]]@host:port`  |
| Authentication required | Add password to URL: `redis://default:password@host:6379`          |
| TLS required            | Use `rediss://` (with SSL) for managed services                    |

### Neo4j Issues

```
Error: Failed to connect to server
Error: Neo4jError: The credentials you provided were invalid
```

| Cause                       | Solution                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Neo4j container not running | Start with `docker compose up -d` or check AuraDB status                      |
| Wrong credentials           | Verify username/password. AuraDB credentials are shown only once at creation. |
| Bolt port wrong             | Default is 7687. AuraDB uses `neo4j+s://` URI scheme.                         |
| Connection timeout          | Check firewall rules. AuraDB requires outbound HTTPS access.                  |

### Cloudinary Issues

```
Error: Upload failed with status 400
Error: API key not found
```

| Cause               | Solution                                                |
| ------------------- | ------------------------------------------------------- |
| Invalid credentials | Check `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET`  |
| File too large      | Cloudinary free tier: 10MB for images, 100MB for videos |
| Invalid format      | Supported: jpg, png, webp, gif, mp4, mov, pdf, docx     |
| Rate limited        | Free tier: 500 uploads/day. Upgrade plan or wait.       |

### Resend Issues

```
Error: 422 - Invalid email address
Error: 401 - API key not valid
```

| Cause                 | Solution                                                       |
| --------------------- | -------------------------------------------------------------- |
| API key invalid       | Regenerate in Resend dashboard. Key starts with `re_`          |
| Domain not verified   | Check DNS records are correctly added and verified             |
| Sending limit reached | Free: 100 emails/day. Upgrade plan or wait.                    |
| Invalid sender        | Use `noreply@verified-domain.com` (must match verified domain) |

### Mapbox Issues

```
Error: Mapbox API returned 401 Unauthorized
Error: No access token provided
```

| Cause                    | Solution                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| Missing token            | Set `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel environment variables   |
| Invalid token            | Verify token in Mapbox dashboard                                 |
| Token scope insufficient | Ensure token includes `mapbox.places` scope                      |
| Rate limited             | Free: 50,000 map loads/month. 600 requests/minute for geocoding. |

### Docker Issues

```
Error: Port 5432 is already allocated
Error: Container exited with code 1
```

| Cause             | Solution                                                         |
| ----------------- | ---------------------------------------------------------------- |
| Port conflict     | Stop the service using the port: `netstat -ano \| findstr :5432` |
| Volume permission | `docker compose down -v` and restart                             |
| Container exit    | Check logs: `docker compose logs <service>`                      |
| Build cache stale | `docker compose build --no-cache`                                |

### Render Issues

```
Error: Build failed
Error: Health check failed
```

| Cause               | Solution                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Build command wrong | Verify build command in Render dashboard. Should install dependencies in monorepo context. |
| Node version        | Set `NODE_VERSION=22` in Render environment variables                                      |
| Memory limit        | Starter plan: 512MB. Upgrade if build runs out of memory.                                  |
| Health check path   | Set to `/api/health` in Render dashboard → Settings                                        |
| Start command       | Ensure `node dist/main` points to compiled NestJS output                                   |

### Vercel Issues

```
Error: Build failed because of ESLint errors
Error: Command "pnpm install" exited with 1
```

| Cause                      | Solution                                                                         |
| -------------------------- | -------------------------------------------------------------------------------- |
| ESLint errors during build | `next.config.ts` has `eslint: { ignoreDuringBuilds: true }`. Ensure this is set. |
| pnpm install fails         | Set install command to `cd ../.. && pnpm install` in Vercel dashboard            |
| Monorepo detection         | Ensure root directory is set to `apps/web`                                       |
| Environment variables      | Add all `NEXT_PUBLIC_*` vars in Vercel dashboard                                 |

---

## 16. Maintenance

### Database Backups (Neon)

Neon provides automated backups (point-in-time recovery):

| Plan       | Retention |
| ---------- | --------- |
| Free       | 7 days    |
| Pro        | 30 days   |
| Team       | 30 days   |
| Enterprise | Custom    |

To manually trigger a backup:

```bash
# Via Neon API
curl -X POST https://console.neon.tech/api/v2/projects/{project_id}/backups \
  -H "Authorization: Bearer $NEON_API_KEY"
```

### Neo4j Backups (AuraDB)

AuraDB provides automated daily backups with 7-day retention. Manual export:

```bash
# Export via Cypher shell
bin/cypher-shell -a neo4j+s://xxx.databases.neo4j.io -u neo4j
CALL apoc.export.cypher.all('backup-2026-07-26.cypher', {})
```

### Redis Cleanup

```bash
# Via CLI (Upstash dashboard or redis-cli)
KEYS *                     # List all keys (DANGER: don't run in production)
INFO memory                # Memory usage
MEMORY USAGE <key>         # Memory per key
FLUSHDB                    # Clear current database (WARNING: destructive)
```

**Automated cleanup:** Configure maxmemory-policy in Redis:

```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Logs

| Service | Log Location     | Retention                     |
| ------- | ---------------- | ----------------------------- |
| Render  | Dashboard → Logs | 7 days (free), 30 days (paid) |
| Vercel  | Dashboard → Logs | 7 days (free), 30 days (pro)  |
| Neon    | Dashboard → Logs | 24 hours                      |
| Neo4j   | AuraDB → Logs    | 7 days                        |
| Sentry  | Dashboard        | 90 days (free)                |

**Log best practices:**

- Set `LOG_LEVEL=info` in production (not `debug`)
- Never log sensitive data (passwords, tokens, PII)
- Use structured logging (JSON format) for log aggregation
- Consider shipping logs to a centralized service (e.g., Logtail, Datadog)

### Monitoring

| Tool                 | What It Monitors                         | Frequency       |
| -------------------- | ---------------------------------------- | --------------- |
| **Render Dashboard** | CPU, memory, response time, errors       | Real-time       |
| **Vercel Dashboard** | Page loads, serverless function duration | Real-time       |
| **Sentry**           | Error tracking, performance traces       | Per error       |
| **PostHog**          | User behavior, feature usage             | Per event       |
| **UptimeRobot**      | Site uptime                              | Every 5 minutes |

### Scaling

| Issue                   | Symptom                  | Solution                                               |
| ----------------------- | ------------------------ | ------------------------------------------------------ |
| High CPU on Render      | Slow API responses       | Upgrade Render plan (Starter → Standard → Pro)         |
| Database slow queries   | Page load times increase | Add Prisma indexes, optimize queries, enable PgBouncer |
| Memory high on Redis    | Cache evictions          | Increase Redis maxmemory, reduce TTL                   |
| Neo4j queries slow      | Tree traversal lag       | Add indexes, upgrade AuraDB plan                       |
| Cloudinary uploads slow | Image loading delays     | Enable Cloudinary CDN, optimize image sizes            |

---

## 17. Scaling Plan

### 500 Users

| Resource          | Configuration     | Estimated Monthly Cost |
| ----------------- | ----------------- | ---------------------- |
| **Vercel**        | Free/Hobby tier   | $0                     |
| **Render**        | Starter ($7)      | $7                     |
| **Neon**          | Free tier (0.5GB) | $0                     |
| **Neo4j AuraDB**  | Free (50k nodes)  | $0                     |
| **Redis Upstash** | Free (256MB)      | $0                     |
| **Cloudinary**    | Free (25GB)       | $0                     |
| **Resend**        | Free (100/day)    | $0                     |
| **Mapbox**        | Free (50k/month)  | $0                     |
| **Sentry**        | Free (5k events)  | $0                     |
| **PostHog**       | Free (1M events)  | $0                     |
| **Total**         |                   | **~$7/month**          |

**Changes needed:** None. All services fit in free/entry tiers.

### 5,000 Users

| Resource          | Configuration             | Estimated Monthly Cost |
| ----------------- | ------------------------- | ---------------------- |
| **Vercel**        | Pro ($20)                 | $20                    |
| **Render**        | Standard ($19)            | $19                    |
| **Neon**          | Pro ($19, 10GB)           | $19                    |
| **Neo4j AuraDB**  | Professional ($65)        | $65                    |
| **Redis Upstash** | Pay-as-you-go (~$5)       | $5                     |
| **Cloudinary**    | Free (25GB) — may upgrade | $0                     |
| **Resend**        | Growth ($40, 50k/month)   | $40                    |
| **Mapbox**        | Pay-as-you-go (~$50)      | $50                    |
| **Sentry**        | Team ($29)                | $29                    |
| **PostHog**       | Growth (~$40)             | $40                    |
| **Total**         |                           | **~$287/month**        |

**Changes needed:**

- Enable PgBouncer connection pooling in Neon
- Add database indexing for frequent queries
- Implement Redis caching layer for API responses
- Set up BullMQ for async job processing
- Enable CDN caching for static assets

### 50,000 Users

| Resource          | Configuration              | Estimated Monthly Cost |
| ----------------- | -------------------------- | ---------------------- |
| **Vercel**        | Pro ($20) + overages       | ~$100                  |
| **Render**        | Professional ($79) + scale | ~$150                  |
| **Neon**          | Team ($99, 50GB)           | $99                    |
| **Neo4j AuraDB**  | Enterprise (~$500)         | $500                   |
| **Redis Upstash** | Pay-as-you-go (~$50)       | $50                    |
| **Cloudinary**    | Advanced (~$100)           | $100                   |
| **Resend**        | Pro ($200, 500k/month)     | $200                   |
| **Mapbox**        | Standard (~$500)           | $500                   |
| **Sentry**        | Business ($89)             | $89                    |
| **PostHog**       | Business (~$200)           | $200                   |
| **Total**         |                            | **~$1,988/month**      |

**Changes needed:**

- Database read replicas for heavy queries
- Horizontal scaling: multiple Render instances
- Redis cluster for distributed caching
- Neo4j read replicas for graph queries
- Content Delivery Network (Cloudflare) for media
- Database partitioning for large tables (TimelineEvent, EventActivity)
- Full-text search engine (MeiliSearch / Typesense) for search
- Automated load testing and performance monitoring

### 500,000 Users

| Resource         | Configuration       | Estimated Monthly Cost |
| ---------------- | ------------------- | ---------------------- |
| **Vercel**       | Enterprise (custom) | ~$500+                 |
| **Render**       | Enterprise (custom) | ~$1,000+               |
| **Neon**         | Enterprise (custom) | ~$2,000+               |
| **Neo4j AuraDB** | Enterprise (custom) | ~$5,000+               |
| **Redis**        | Enterprise cluster  | ~$500+                 |
| **Cloudinary**   | Enterprise (custom) | ~$500+                 |
| **Resend**       | Enterprise (custom) | ~$1,000+               |
| **Mapbox**       | Enterprise (custom) | ~$1,000+               |
| **Sentry**       | Enterprise (custom) | ~$500+                 |
| **PostHog**      | Self-hosted         | ~$500+                 |
| **Total**        |                     | **~$12,500+/month**    |

**Changes needed:**

- Full microservices architecture (separate auth, timeline, search, notification services)
- Database sharding across multiple Neon instances
- Neo4j database federation
- Event-driven architecture with Apache Kafka
- Kubernetes orchestration (Render → self-managed K8s)
- Dedicated DevOps team
- Multi-region deployment for global performance
- 24/7 incident response protocol
- SOC 2 / HIPAA compliance (if handling sensitive data)

---

## 18. Security Checklist

### Secrets Management

- [ ] All secrets stored in environment variables, never in code
- [ ] Previously committed credentials rotated
- [ ] `.env*` files in `.gitignore`
- [ ] No hardcoded API keys, passwords, or tokens in source code
- [ ] Secrets use least-privilege principle (per-service, per-scope)
- [ ] Production secrets different from development secrets
- [ ] Secret rotation schedule established

### JWT Authentication

- [ ] `JWT_SECRET` is 64-byte cryptographically random hex
- [ ] `JWT_REFRESH_SECRET` is a different 64-byte random hex
- [ ] Access token expiry: 1 hour (configured in `apps/api/.env`)
- [ ] Refresh token expiry: 30 days
- [ ] Refresh token rotation: new refresh token issued on each refresh
- [ ] Token storage: `localStorage` (current) — consider httpOnly cookies
- [ ] Logout invalidates refresh token in database (`LoginSession` model)

### HTTPS & TLS

- [ ] Vercel: automatic SSL (verified)
- [ ] Render: automatic SSL (verified)
- [ ] Database connections: `sslmode=require` for Neon
- [ ] Neo4j: `neo4j+s://` (secure+trusted) URI scheme
- [ ] Redis: TLS enabled (Upstash provides this)
- [ ] HSTS headers enabled
- [ ] Certificate auto-renewal confirmed

### CORS

- [ ] `CORS_ORIGIN` restricted to `https://app.yourdomain.com`
- [ ] Not using `*` wildcard in production
- [ ] Credentials (cookies) only sent to allowed origins
- [ ] Admin endpoints protected by `X-Admin-Key` header (not exposed to browser)

### Upload Security

- [ ] File type validation (images: jpg/png/webp, docs: pdf, video: mp4)
- [ ] File size limits (10MB images, 100MB videos, 25MB docs)
- [ ] Virus scanning enabled (via Cloudinary or external service)
- [ ] Uploaded files stored in Cloudinary (not local filesystem)
- [ ] Direct file access URLs not exposed — always serve through API
- [ ] Upload rate limiting enforced

### Input Validation

- [ ] class-validator with `whitelist: true` — strips unknown properties
- [ ] `forbidNonWhitelisted: true` in validation pipe — rejects unknown fields
- [ ] `transform: true` — auto-type conversion
- [ ] Zod schemas on frontend for client-side validation
- [ ] SQL injection prevented by Prisma parameterized queries

### Rate Limiting

- [ ] Global: 100 requests/minute per IP (ThrottlerModule)
- [ ] Auth endpoints should have stricter limits (TODO: configure)
- [ ] Upload endpoints: rate limited by file count and size
- [ ] API key endpoints: admin audit logging

### Additional Protections

- [ ] **Helmet middleware** configured (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] **Account lockout**: 5 failed attempts → 15-minute lockout
- [ ] **Password hashing**: bcryptjs with salt rounds
- [ ] **Soft deletes** on all entities (`deletedAt` timestamp)
- [ ] **6-level visibility enforcement** server-side (not client-side)
- [ ] **Ownership checks** on all mutation endpoints via `PermissionsService`
- [ ] **Audit logging** for destructive operations (merge, delete, admin actions)
- [ ] **XSS protection**: React's automatic escaping + CSP headers
- [ ] **CSRF protection**: SameSite cookie policy (Lax)
- [ ] **SQL injection**: Prisma parameterized queries (immune)
- [ ] **Sensitive data**: PII excluded from certain API responses

---

## 19. Final Verification

### Deployment Verification Checklist

Run through this checklist after completing the entire deployment process.

#### Frontend (Vercel)

- [ ] ✅ Vercel project connected to GitHub repository
- [ ] ✅ Root directory set to `apps/web`
- [ ] ✅ Build command configured correctly for monorepo
- [ ] ✅ All `NEXT_PUBLIC_*` environment variables set
- [ ] ✅ Custom domain configured (`app.yourdomain.com`)
- [ ] ✅ SSL certificate provisioned and valid
- [ ] ✅ Build succeeds (`pnpm build`)
- [ ] ✅ `https://app.yourdomain.com` loads with correct title
- [ ] ✅ `https://app.yourdomain.com/dashboard/timeline` loads (may redirect to login)
- [ ] ✅ `https://app.yourdomain.com/api/nest/health` proxies to backend
- [ ] ✅ Image loading from Cloudinary works (no broken images)
- [ ] ✅ Mapbox maps render correctly

#### Backend (Render)

- [ ] ✅ Render web service created from GitHub repository
- [ ] ✅ Root directory set to `apps/api`
- [ ] ✅ Build command includes Prisma generate
- [ ] ✅ Start command: `node dist/main`
- [ ] ✅ Health check path: `/api/health`
- [ ] ✅ Node version: 22
- [ ] ✅ All environment variables set
- [ ] ✅ `NODE_ENV=production`
- [ ] ✅ `https://api.yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] ✅ `https://api.yourdomain.com/api/docs` returns Swagger UI
- [ ] ✅ Prisma schema deployed (tables created in Neon)
- [ ] ✅ Admin endpoint accessible: `curl -H "X-Admin-Key: xxx" https://api.yourdomain.com/api/users`

#### Database (Neon)

- [ ] ✅ Neon project created
- [ ] ✅ Connection string configured with `sslmode=require`
- [ ] ✅ `DATABASE_URL` set in Render environment variables
- [ ] ✅ Prisma schema pushed (`npx prisma db push`)
- [ ] ✅ Prisma client generated (`npx prisma generate`)
- [ ] ✅ All 93+ models created in database
- [ ] ✅ Database connection from Render is stable
- [ ] ✅ Point-in-time recovery enabled

#### Graph Database (Neo4j AuraDB)

- [ ] ✅ AuraDB instance created and running
- [ ] ✅ URI, username, password set in Render environment variables
- [ ] ✅ Connection from API to AuraDB works (health check `neo4j.connected: true`)
- [ ] ✅ Schema applied (constraints and indexes)
- [ ] ✅ PostgreSQL → Neo4j sync completed (`syncAll()`)
- [ ] ✅ Graph queries working (kinship, ancestor, descendant)

#### Cache (Redis)

- [ ] ✅ Redis instance created (Upstash / Render)
- [ ] ✅ `REDIS_URL` set in Render environment variables
- [ ] ✅ Connection test passes
- [ ] ✅ BullMQ queue configuration ready (when implemented)

#### Storage (Cloudinary)

- [ ] ✅ Cloudinary account active
- [ ] ✅ API credentials configured (rotated from committed values)
- [ ] ✅ Upload folders pre-created
- [ ] ✅ Image upload works end-to-end
- [ ] ✅ Document upload works
- [ ] ✅ Thumbnail generation works

#### Email (Resend)

- [ ] ✅ Resend account active
- [ ] ✅ Domain verified (DKIM, SPF records added)
- [ ] ✅ `RESEND_API_KEY` set in Render environment variables
- [ ] ✅ Test email sent successfully
- [ ] ✅ OTP delivery working
- [ ] ✅ Invitation emails working

#### Maps (Mapbox)

- [ ] ✅ Mapbox account active
- [ ] ✅ Access token generated with geocoding + map scopes
- [ ] ✅ `NEXT_PUBLIC_MAPBOX_TOKEN` set in Vercel environment variables
- [ ] ✅ Geocoding works (address → coordinates)
- [ ] ✅ Maps render in the frontend

#### Monitoring & Analytics

- [ ] ✅ Sentry DSN configured, errors captured
- [ ] ✅ PostHog configured, events tracked
- [ ] ✅ Render dashboard shows healthy metrics
- [ ] ✅ Vercel dashboard shows successful deployments
- [ ] ✅ Uptime monitoring configured (e.g., UptimeRobot)
- [ ] ✅ Alert notifications configured (email/Slack)

#### Security

- [ ] ✅ JWT secrets are strong (64-byte random hex)
- [ ] ✅ `ADMIN_API_KEY` is strong (32-byte random hex)
- [ ] ✅ CORS restricted to frontend origin
- [ ] ✅ HTTPS enforced everywhere
- [ ] ✅ Rate limiting active
- [ ] ✅ All previously committed credentials rotated
- [ ] ✅ `.env` files in `.gitignore`
- [ ] ✅ No secrets exposed in source code

#### Deploy

- [ ] ✅ Auto-deploy from `main` branch configured
- [ ] ✅ Production: `main` branch
- [ ] ✅ Staging: `develop` branch (optional)
- [ ] ✅ Deploy triggers working (push to main → auto-deploy)
- [ ] ✅ Rollback procedure documented
- [ ] ✅ Deployment verified end-to-end

---

### Service Status Summary

| Service       | Product         | Status            | Last Verified |
| ------------- | --------------- | ----------------- | ------------- |
| **Frontend**  | Vercel          | ⬜ Not Deployed   | —             |
| **Backend**   | Render          | ⬜ Not Deployed   | —             |
| **Database**  | Neon            | ⬜ Not Deployed   | —             |
| **Graph DB**  | Neo4j AuraDB    | ⬜ Not Deployed   | —             |
| **Cache**     | Redis (Upstash) | ⬜ Not Deployed   | —             |
| **Queue**     | BullMQ          | ⬜ Planned        | —             |
| **Storage**   | Cloudinary      | ⬜ Not Configured | —             |
| **Email**     | Resend          | ⬜ Not Configured | —             |
| **Maps**      | Mapbox          | ⬜ Not Configured | —             |
| **Errors**    | Sentry          | ⬜ Not Configured | —             |
| **Analytics** | PostHog         | ⬜ Not Configured | —             |

> Use this table to track deployment progress. Replace ⬜ with ✅ as each service is deployed and verified.

### NEON_DATABASE_URL=postgresql://neondb_owner:[REDACTED_PASSWORD]@ep-ancient-moon-axifntr4-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require

## CLOUDINARY_CLOUD_NAME=tlzf3clg

## CLOUDINARY_API_KEY=713882242824216

## CLOUDINARY_API_SECRET=[REDACTED_CLOUDINARY_SECRET]

## NEO4J_URI=neo4j+s://d483f783.databases.neo4j.io

## NEO4J_USERNAME=d483f783

## NEO4J_PASSWORD=[REDACTED_NEO4J_PASSWORD]

## RESEND_API_KEY=[REDACTED_RESEND_KEY]

## SENTRY_DSN=https://[REDACTED_SENTRY_KEY]@o4511803012939776.ingest.de.sentry.io/4511803106590800

## POSTHOG_KEY=[REDACTED_POSTHOG_KEY]
