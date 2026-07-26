# Digital Family Tree Platform

**Version:** 6.0  
**Status:** Development / Pre-Production  
**Last Updated:** 2026-07-24

A full-stack TypeScript monorepo platform for discovering, building, and preserving family heritage across generations. Features a unique **Community → Clan → SubClan → Family → Member** hierarchy, 33 event types with 22 dedicated forms, a media/document vault with Cloudinary integration, AI-powered summarization, interactive SVG-based tree visualization, and comprehensive security.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Vision & Core Principles](#2-vision--core-principles)
3. [Current Development Status](#3-current-development-status)
4. [Tech Stack](#4-tech-stack)
5. [Architecture](#5-architecture)
6. [Folder Structure](#6-folder-structure)
7. [Database Architecture](#7-database-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Platform Hierarchy](#9-platform-hierarchy)
10. [Identity & Display ID System](#10-identity--display-id-system)
11. [Timeline System](#11-timeline-system)
12. [Form System](#12-form-system)
13. [Media & Upload System](#13-media--upload-system)
14. [Document Vault](#14-document-vault)
15. [Family Tree Engine](#15-family-tree-engine)
16. [Neo4j Graph Database](#16-neo4j-graph-database)
17. [Merge Engine & Duplicate Detection](#17-merge-engine--duplicate-detection)
18. [Discovery Engine](#18-discovery-engine)
19. [Search System](#19-search-system)
20. [Notifications](#20-notifications)
21. [Activity System](#21-activity-system)
22. [Visibility & Privacy System](#22-visibility--privacy-system)
23. [Security Architecture](#23-security-architecture)
24. [API Resilience Layer](#24-api-resilience-layer)
25. [API Endpoints Reference](#25-api-endpoints-reference)
26. [Backend Modules](#26-backend-modules)
27. [Frontend Pages & Components](#27-frontend-pages--components)
28. [Admin Panel](#28-admin-panel)
29. [Docker & Local Development](#29-docker--local-development)
30. [Environment Variables](#30-environment-variables)
31. [Development Commands](#31-development-commands)
32. [Build & Production Commands](#32-build--production-commands)
33. [Testing](#33-testing)
34. [CI/CD Pipeline](#34-cicd-pipeline)
35. [Deployment Guide](#35-deployment-guide)
36. [Performance Considerations](#36-performance-considerations)
37. [Accessibility & UX Design](#37-accessibility--ux-design)
38. [Completed Features](#38-completed-features)
39. [Known Limitations](#39-known-limitations)
40. [Future Roadmap](#40-future-roadmap)
41. [Technical Decisions](#41-technical-decisions)
42. [Development Rules](#42-development-rules)

---

## 1. Project Overview

Digital Family Tree is a production-scale enterprise monorepo application for families, clans, and communities to build, preserve, and explore genealogical heritage. It targets collectivist cultures (Pashtun, South Asian, Middle Eastern, Indigenous) whose family structures — clans, sub-clans, communities — are not served by traditional Western-centric genealogy platforms.

### Key Capabilities

| Capability              | Details                                                    |
| ----------------------- | ---------------------------------------------------------- |
| **Database Models**     | 93+ Prisma models across PostgreSQL                        |
| **API Endpoints**       | 70+ REST endpoints across 48 NestJS modules                |
| **Event Types**         | 33 event types for comprehensive life documentation        |
| **Dedicated Forms**     | 22 event-specific forms with field-level validation        |
| **Visibility Levels**   | 6-level granular permission system                         |
| **Frontend Pages**      | 30+ pages across web and admin apps                        |
| **Frontend Components** | 45+ shared components                                      |
| **Media Storage**       | Cloudinary integration (images, videos, documents)         |
| **Tree Visualization**  | SVG-based interactive family tree with 4 layout algorithms |
| **Graph Database**      | Neo4j for advanced relationship queries (in progress)      |

### Platform Hierarchy

```
Platform
├── Community (Tribe / Ethnicity)
│   ├── Clan
│   │   ├── Sub Clan
│   │   │   ├── Family
│   │   │   │   ├── Member
│   │   │   │   ├── Timeline
│   │   │   │   ├── Memories
│   │   │   │   └── Documents
│   │   │   └── Events
│   │   ├── Join Requests
│   │   └── Clan Admins
│   └── Community Admins
├── Invitations (Token-Based)
├── Notifications (9 Event Lifecycle Types)
├── Discovery Engine
└── AI Engine (Summaries)
```

---

## 2. Vision & Core Principles

### Vision

> Every family's story, preserved forever — from the living to the ancestors, from the clan to the community.

### Core Principles

| Principle                | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Privacy First**        | Family data is sacred. Security and privacy are non-negotiable.                  |
| **Preservation**         | Digital artifacts must outlast any single platform.                              |
| **Accessibility**        | Every family member, regardless of technical skill, must be able to participate. |
| **Collaboration**        | Family trees grow best when many hands contribute.                               |
| **Performance**          | The platform must feel instant, even with large family trees.                    |
| **Cultural Inclusivity** | Support collectivist family structures that Western platforms ignore.            |

### Target Users

- Families wanting to preserve their heritage
- Genealogy enthusiasts
- Adoptees seeking biological family connections
- Cultural heritage organizations
- Educators teaching family history
- Clan/community leaders managing genealogical records

---

## 3. Current Development Status

### Overall Assessment

The platform is **feature-rich but pre-production**. Core infrastructure (monorepo, database, auth, API, frontend framework, CI/CD) is solid. Many features are implemented at an impressive depth (33 event types, document vault, tree engine, API resilience). However, critical gaps remain in testing, security hardening, Neo4j integration, and the foundational genealogy data model.

| Domain                     | Status         | Confidence |
| -------------------------- | -------------- | ---------- |
| Monorepo Architecture      | ✅ Complete    | High       |
| PostgreSQL / Prisma Schema | ✅ Complete    | Medium     |
| Authentication (JWT)       | ✅ Complete    | High       |
| User & Profile Management  | ✅ Complete    | High       |
| Family / Member CRUD       | ✅ Complete    | High       |
| Relationships (Basic)      | ✅ Complete    | Medium     |
| Timeline / 33 Event Types  | ✅ Complete    | High       |
| 22 Dedicated Event Forms   | ✅ Complete    | High       |
| Cloudinary Upload          | ✅ Complete    | High       |
| Document Vault             | ✅ Complete    | Medium     |
| Search System              | ✅ Complete    | High       |
| Notifications              | ✅ Complete    | Medium     |
| Activity Feed              | ✅ Complete    | Medium     |
| Merge Engine               | ✅ Complete    | Medium     |
| Duplicate Detection        | ✅ Complete    | Low        |
| Discovery Engine           | ✅ Complete    | Low        |
| Clan / Community System    | ✅ Complete    | Medium     |
| Tree Engine (SVG)          | ✅ Complete    | High       |
| Admin Panel                | ✅ Complete    | Medium     |
| API Resilience Layer       | ✅ Complete    | High       |
| Neo4j Integration          | 🔄 In Progress | Low        |
| Redis Caching              | 🔄 Planned     | —          |
| GEDCOM Import/Export       | 🔄 Planned     | —          |
| Comprehensive Testing      | 🔄 Planned     | —          |
| Security Hardening         | 🔄 Planned     | —          |
| Mobile App                 | 🔄 Future      | —          |
| DNA Integration            | 🔄 Future      | —          |

### Sprint History

| Sprint     | Focus                                                   | Status      |
| ---------- | ------------------------------------------------------- | ----------- |
| Sprint 1   | Project foundation, monorepo setup, design system       | ✅ Complete |
| Sprint 2-5 | Core features: auth, families, members, timeline        | ✅ Complete |
| Sprint 6   | API resilience, premium UI, upload, calendar, settings  | ✅ Complete |
| Sprint 7-9 | Event forms, comments, reactions, notifications         | ✅ Complete |
| Sprint 10  | Document vault, verification, galleries, knowledge base | ✅ Complete |
| Sprint 11  | Tree engine (SVG visualization, layout algorithms)      | ✅ Complete |
| Sprint 12  | Clan/Community system, discovery, merge engine          | ✅ Complete |
| Sprint 13  | Community features, history, gallery, events            | ✅ Complete |

---

## 4. Tech Stack

| Layer                 | Technology                                    | Version                   |
| --------------------- | --------------------------------------------- | ------------------------- |
| **Frontend**          | Next.js (App Router), React, TypeScript       | Next.js 15.5.20, React 19 |
| **Styling**           | Tailwind CSS                                  | v3.4                      |
| **Animations**        | Framer Motion                                 | v11                       |
| **Icons**             | Lucide React                                  | Latest                    |
| **Backend**           | NestJS, TypeScript                            | NestJS 10                 |
| **ORM**               | Prisma                                        | v5.22.0                   |
| **Primary Database**  | PostgreSQL                                    | v16                       |
| **Graph Database**    | Neo4j                                         | v5 (Docker)               |
| **Cache (Planned)**   | Redis                                         | Latest                    |
| **Auth**              | Passport.js (JWT + Local), bcryptjs           | —                         |
| **File Uploads**      | Multer (@nestjs/platform-express), Cloudinary | —                         |
| **API Documentation** | Swagger (@nestjs/swagger)                     | —                         |
| **Security**          | Helmet, @nestjs/throttler                     | —                         |
| **Monorepo**          | pnpm Workspaces + Turborepo                   | pnpm 9.15                 |
| **Form Handling**     | react-hook-form, zod, @hookform/resolvers     | —                         |
| **Validation**        | class-validator, class-transformer            | —                         |
| **Testing**           | Jest (API), Playwright (E2E)                  | —                         |

### Ports

| Service       | Port | URL                            |
| ------------- | ---- | ------------------------------ |
| Web (Next.js) | 4001 | http://localhost:4001          |
| API (NestJS)  | 4000 | http://localhost:4000/api      |
| Swagger Docs  | 4000 | http://localhost:4000/api/docs |
| Admin Panel   | 4002 | http://localhost:4002          |
| PostgreSQL    | 5432 | localhost:5432                 |
| Neo4j Browser | 7474 | http://localhost:7474          |
| Neo4j Bolt    | 7687 | localhost:7687                 |

---

## 5. Architecture

### High-Level System Diagram

```
                    +-----------+       +-----------+
                    |   Web     |       |  Admin    |
                    | (Next.js) |       | (Next.js) |
                    | Port 4001 |       | Port 4002 |
                    +-----+-----+       +-----+-----+
                          |                   |
              /api/nest/* |         X-Admin-Key|
                          |                   |
                    +-----v-------------------v-----+
                    |       NestJS API Server        |
                    |          Port 4000              |
                    |   /api/* (Swagger: /api/docs)  |
                    +----------------+---------------+
                                     |
                    +----------------+---------------+
                    |                |               |
              +-----v------+  +------v------+  +----v------+
              |  PostgreSQL |  |   Neo4j    |  | Cloudinary |
              |    5432     |  |  7687/7474 |  | (Storage)  |
              +-------------+  +-------------+  +------------+
```

### Monorepo Structure

```
digital-family-tree/
├── apps/
│   ├── api/                  # NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── auth/         # JWT + Local authentication
│   │   │   ├── users/        # User management
│   │   │   ├── profile/      # User profiles
│   │   │   ├── families/     # Family CRUD
│   │   │   ├── members/      # Family member management
│   │   │   ├── relationships/# 15 relationship types
│   │   │   ├── invitations/  # Token-based invitations
│   │   │   ├── timeline/     # Core timeline (33 event types)
│   │   │   ├── memories/     # Family memories
│   │   │   ├── notifications/# Notification engine (9 types)
│   │   │   ├── search/       # Global search
│   │   │   ├── upload/       # File upload (Cloudinary)
│   │   │   ├── merge/        # Duplicate merge with undo
│   │   │   ├── duplicates/   # Duplicate detection
│   │   │   ├── discovery/    # Recommendations
│   │   │   ├── clans/        # Clan management
│   │   │   ├── communities/  # Community management
│   │   │   ├── subclans/     # Sub-clan management
│   │   │   ├── document-vault/ # Document vault
│   │   │   ├── knowledge-base/ # Knowledge base
│   │   │   ├── tree/         # Tree visualization engine
│   │   │   ├── common/       # Shared services (permissions, identity)
│   │   │   ├── neo4j/        # Graph database integration
│   │   │   ├── ai-insights/  # AI-powered insights
│   │   │   ├── prisma/       # Prisma service
│   │   │   └── health/       # Health check endpoint
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   ├── test/             # Test suite
│   │   └── ...
│   ├── web/                  # Next.js frontend (port 4001)
│   │   └── app/
│   │       ├── (auth)/       # Login, register, forgot password
│   │       ├── (dashboard)/  # Dashboard pages
│   │       └── api/          # Next.js API routes
│   └── admin/                # Admin panel (port 4002)
├── packages/
│   └── shared/               # Shared types and utilities
├── pnpm-workspace.yaml
├── turbo.json
└── docker-compose.yml
```

### Service Diagram

```
                    +-----------+       +-----------+
                    |   Web     |       |  Admin    |
                    | (Next.js) |       | (Next.js) |
                    | Port 4001 |       | Port 4002 |
                    +-----+-----+       +-----+-----+
                          |                   |
              /api/nest/* |         X-Admin-Key|
                          |                   |
                    +-----v-------------------v-----+
                    |       NestJS API Server        |
                    |          Port 4000              |
                    +----------------+---------------+
                                     |
                              +------v------+
                              |  PostgreSQL  |
                              |    5432      |
                              +-------------+

                     Neo4j (Graph)  ────   Cloudinary (Storage)
                     Redis (Cache)  ────   (Planned)
```

---

## 6. Folder Structure

### Monorepo Root

```
digital-family-tree/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   ├── web/          # Next.js frontend (port 4001)
│   └── admin/        # Admin panel (port 4002)
├── packages/
│   └── shared/       # Shared types and utilities
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
├── package.json
├── .env.example
└── README.md
```

### Backend Module Structure (`apps/api/src/`)

```
apps/api/src/
├── auth/                 # JWT + Local authentication
├── users/                # User management
├── profile/              # User profiles
├── families/             # Family CRUD
├── members/              # Family member management
├── relationships/        # 15 relationship types
├── invitations/          # Token-based invitations
├── timeline/             # Core timeline (33 event types)
├── notifications/        # Notification engine (9 types)
├── search/               # Global search
├── upload/               # File upload (Cloudinary)
├── merge/                # Duplicate merge with undo
├── duplicates/           # Duplicate detection
├── discovery/            # Recommendations
├── clans/                # Clan management
├── communities/          # Community management
├── subclans/             # Sub-clan management
├── document-vault/       # Document vault
├── knowledge-base/       # Knowledge base
├── ai-insights/          # AI-powered insights
├── tree/                 # Tree visualization engine
├── neo4j/                # Graph database integration
│   ├── services/         # # Sync, Kinship, Relationship, Traversal services
│   ├── repositories/     # # Person, Family, Marriage, Tree, Graph repositories
│   └── index.ts          # Barrel exports
├── common/               # Shared services (permissions, identity)
├── prisma/               # Prisma service
├── health/               # Health check endpoint
└── app.module.ts         # Root module
```

### Frontend Page Structure (`apps/web/app/`)

```
apps/web/app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx            # Dashboard home
│       ├── timeline/
│       │   ├── page.tsx        # Timeline list view
│       │   ├── [id]/           # Event detail (15 tabs)
│       │   ├── new/            # Create event (25 dedicated forms)
│       │   ├── search/         # Instant search
│       │   ├── analytics/      # Analytics dashboard
│       │   ├── calendar/       # Calendar views
│       │   ├── drafts/         # Draft events
│       │   └── components/     # Timeline components
│       ├── families/           # Family management
│       │   ├── [id]/tree/      # Family tree view
│       │   └── ...
│       ├── members/            # Member management
│       ├── tree/               # Tree explorer
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── tree-canvas.tsx
│       │       ├── tree-controls.tsx
│       │       ├── tree-search.tsx
│       │       ├── tree-detail-panel.tsx
│       │       ├── tree-minimap.tsx
│       │       └── ...
│       ├── media/              # Media manager
│       ├── notifications/      # Notification center
│       ├── discover/           # Discovery engine
│       ├── clans/              # Clan management
│       ├── communities/        # Community management
│       ├── memories/           # Family memories
│       ├── documents/          # Document vault
│       ├── knowledge-base/     # Knowledge base
│       ├── profile/            # User profile
│       ├── settings/           # Settings
│       └── gallery/            # Gallery
└── api/                       # Next.js API routes
```

---

## 7. Database Architecture

### PostgreSQL (Primary — via Prisma ORM)

**Model Count: 93+**

#### Core Models

| Model          | Purpose                     | Key Fields                                  |
| -------------- | --------------------------- | ------------------------------------------- |
| `User`         | User accounts               | email, password, roles, status (75+ fields) |
| `Family`       | Family units                | name, description, metadata                 |
| `FamilyMember` | Person within a family      | 30+ profile fields                          |
| `Relationship` | Connections between members | fromMemberId, toMemberId, type (15 types)   |
| `Invitation`   | Token-based invitations     | email, token, status, familyId              |
| `LoginSession` | Session tracking            | userId, refreshToken, device, expiresAt     |

#### Hierarchy Models

| Model              | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `Community`        | Top-level tribe/ethnicity grouping            |
| `Clan`             | Mid-level organizational unit                 |
| `SubClan`          | Nested sub-group (recursive nesting)          |
| `ClanRequest`      | Join request with approval workflow           |
| `ClanAdmin`        | Clan administrator roles                      |
| `ClanHistoryEntry` | Version-controlled clan history (12 sections) |
| `CommunityAdmin`   | Community administrator roles                 |
| `CommunityRequest` | Community join requests                       |

#### Timeline Models

| Model              | Purpose                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `TimelineEvent`    | Core event (60+ fields: title, description, date, type, status, visibility, importance, location, coordinates, tags, metadata) |
| `EventParticipant` | User/guest participation                                                                                                       |
| `EventReminder`    | Event reminders                                                                                                                |
| `EventMedia`       | Media attachments (images, videos)                                                                                             |

#### Event Information Models (9)

| Model                   | Key Fields                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| `BirthInformation`      | Hospital, weight, blood group, parents, vaccination, Apgar score |
| `MarriageInformation`   | Spouse, nikah/walima/mehndi dates, mahr, dowry, witnesses        |
| `DeathInformation`      | Cause, burial, janazah, death certificate, obituary              |
| `EducationInformation`  | Institution, degree, GPA, thesis, scholarships                   |
| `EmploymentInformation` | Company, position, salary, responsibilities, skills              |
| `MigrationInformation`  | Origin/destination, visa, passport, sponsor                      |
| `MilitaryInformation`   | Branch, rank, MOS, deployments, medals                           |
| `AwardInformation`      | Name, type, nomination, prize, ceremony                          |
| `BusinessInformation`   | Name, type, investment, revenue, milestones                      |

#### Media & Document Models

| Model                    | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `EventMedia`             | Media items with Cloudinary URLs                                          |
| `EventDocument`          | Documents (13 fields: category, thumbnail, OCR, virus scan, verification) |
| `EventPrintVersion`      | PDF/JSON export versions                                                  |
| `DocumentVault`          | Central document storage (25 types, versioning, soft deletes)             |
| `DocumentVersion`        | Version history for documents                                             |
| `DocumentFolder`         | Hierarchical folder organization                                          |
| `DocumentShare`          | Link/user sharing with secure tokens, password protection                 |
| `DocumentAccessLog`      | Access audit trail                                                        |
| `DocumentTag`            | Tag system                                                                |
| `DocumentCollection`     | Themed document collections (9 types)                                     |
| `DocumentCollectionItem` | Links documents to collections                                            |
| `DocumentAttachment`     | Links documents to entities (8 entity types)                              |
| `DocumentVerification`   | Verification system (4 types, confidence scoring)                         |
| `DocumentGallery`        | Visual heritage (9 gallery types)                                         |
| `DocumentReference`      | Source citations with reliability levels                                  |
| `DocumentPublicPage`     | SEO-optimized public pages                                                |
| `DocumentKnowledgeBase`  | Wiki/articles/research (8 article types)                                  |

#### Social Models

| Model             | Purpose                        |
| ----------------- | ------------------------------ |
| `EventComment`    | Threaded comments with replies |
| `EventReaction`   | Emoji reactions                |
| `EventInvitation` | Scoped event invitations       |
| `Memory`          | Family memories/stories        |
| `MemoryComment`   | Memory comments                |
| `MemoryReaction`  | Memory reactions               |

#### System Models

| Model                    | Purpose                        |
| ------------------------ | ------------------------------ |
| `EventActivity`          | Activity feed entries          |
| `EventHistory`           | Change audit trail             |
| `EventVersion`           | Version snapshots              |
| `EventSummary`           | AI-generated summaries         |
| `EventAttendance`        | QR-based attendance tracking   |
| `Notification`           | In-app notifications           |
| `NotificationPreference` | Per-user channel preferences   |
| `NotificationDelivery`   | Delivery status tracking       |
| `NotificationTemplate`   | Message templates              |
| `AuditLog`               | System audit log               |
| `DuplicatePair`          | Detected duplicates            |
| `MergeSnapshot`          | Merge history for undo         |
| `TreeView`               | Saved tree view configurations |
| `TreeLayoutCache`        | Cached node positions          |
| `TreeBranch`             | Lazily-loaded branch data      |
| `TreeBookmark`           | Bookmarked tree nodes          |
| `TreeSearchHistory`      | Search query history           |
| `TreeViewHistory`        | Recently viewed trees          |

#### Community Feature Models (Sprint 13)

| Model                 | Purpose                              |
| --------------------- | ------------------------------------ |
| `CommunityHistory`    | Version-controlled community history |
| `CommunityGallery`    | Community photo/video gallery        |
| `CommunityDirectory`  | Community member directory           |
| `CommunityEvent`      | Community-scoped events              |
| `CommunityNews`       | Community news posts                 |
| `CommunityDocument`   | Community document library           |
| `CommunityLocation`   | Community geographic locations       |
| `ClanHistory`         | Clan history records                 |
| `ClanGallery`         | Clan photo/video gallery             |
| `ClanDirectory`       | Clan member directory                |
| `ClanEvent`           | Clan-scoped events                   |
| `ClanDocument`        | Clan document library                |
| `ClanLocation`        | Clan geographic locations            |
| `CommunityReputation` | Community reputation scores          |
| `ClanReputation`      | Clan reputation scores               |
| `CommunityAISummary`  | AI-generated community summaries     |
| `ClanAISummary`       | AI-generated clan summaries          |

#### Design Principles

- **UUID primary keys** for distributed generation
- **Soft deletes** via `deletedAt` timestamps
- **Audit timestamps** on all tables (`createdAt`, `updatedAt`)
- **Display IDs** with human-readable prefixes (USR-, FAM-, MEM-, DOC-, TVW-, etc.)
- **Comprehensive indexing** for query performance
- **6-level visibility** enforced server-side

---

## 8. Authentication & Authorization

### Authentication Flow

| Flow                | Implementation                                  |
| ------------------- | ----------------------------------------------- |
| **Registration**    | Email + password via Passport.js Local strategy |
| **Login**           | JWT access token (1h) + refresh token (30d)     |
| **Token Refresh**   | Refresh token endpoint returns new access token |
| **Logout**          | Invalidates refresh token in database           |
| **Password Reset**  | Forgot/reset flow with token                    |
| **Account Lockout** | 5 failed attempts → 15-minute lockout           |

### JWT Token Structure

```typescript
// Access Token (1h expiry)
{
  sub: string;       // userId
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Refresh Token (30d expiry)
{
  sub: string;       // userId
  jti: string;       // Unique token ID (stored in LoginSession)
  iat: number;
  exp: number;
}
```

### Authorization

- **Ownership checks** on all mutation endpoints via `PermissionsService`
- **Role-based access control** via `@Roles()` decorator and `RolesGuard`
- **Admin authentication** via `X-Admin-Key` header
- **Account status check** (`active` required for all operations)
- **JWT payload** contains `userId`, validated on every request

### Auth Endpoints

| Method | Endpoint                    | Auth | Description               |
| ------ | --------------------------- | ---- | ------------------------- |
| POST   | `/api/auth/register`        | None | Register new user         |
| POST   | `/api/auth/login`           | None | Login (returns JWT pair)  |
| POST   | `/api/auth/refresh`         | None | Refresh access token      |
| POST   | `/api/auth/logout`          | JWT  | Invalidate refresh token  |
| POST   | `/api/auth/forgot-password` | None | Send reset email          |
| POST   | `/api/auth/reset-password`  | None | Reset password with token |
| GET    | `/api/auth/me`              | JWT  | Get current user          |

---

## 9. Platform Hierarchy

### Organizational Structure

```
Platform
├── Community (Tribe / Ethnicity)
│   ├── Clan
│   │   ├── Sub Clan
│   │   │   ├── Family
│   │   │   │   ├── Member
│   │   │   │   ├── Timeline
│   │   │   │   ├── Memories
│   │   │   │   └── Documents
│   │   │   └── Events
│   │   ├── Join Requests
│   │   ├── Admins
│   │   ├── History
│   │   ├── Gallery
│   │   ├── Directory
│   │   ├── Documents
│   │   └── Locations
│   ├── Join Requests
│   ├── Admins
│   ├── History
│   ├── Gallery
│   ├── Directory
│   ├── Events
│   ├── News
│   ├── Documents
│   └── Locations
├── Invitations (Token-Based)
├── Notifications (9 Types)
├── Discovery Engine
└── AI Engine (Summaries)
```

### Community System

| Feature                   | Status | Description                         |
| ------------------------- | ------ | ----------------------------------- |
| Create/Read/Update/Delete | ✅     | Full CRUD with duplicate prevention |
| Slug Validation           | ✅     | URL-safe unique slugs               |
| Join Requests             | ✅     | Request/approve/reject workflow     |
| Admins                    | ✅     | Role-based admin management         |
| History                   | ✅     | Version-controlled history records  |
| Gallery                   | ✅     | Photo/video gallery management      |
| Directory                 | ✅     | Member directory                    |
| Events                    | ✅     | Community-scoped events             |
| News                      | ✅     | News posting                        |
| Documents                 | ✅     | Document library                    |
| Locations                 | ✅     | Geographic location tracking        |
| Reputation                | ✅     | Community reputation scores         |
| AI Summary                | ✅     | AI-generated community summaries    |

### Clan System

| Feature                   | Status | Description                  |
| ------------------------- | ------ | ---------------------------- |
| Create/Read/Update/Delete | ✅     | Full CRUD within communities |
| Discovery                 | ✅     | Clan discoverability         |
| Statistics                | ✅     | Clan member/event stats      |
| Join/Leave                | ✅     | Membership management        |
| SubClans                  | ✅     | Recursive nested sub-groups  |
| History                   | ✅     | Version-controlled history   |
| Gallery                   | ✅     | Photo/video gallery          |
| Directory                 | ✅     | Member directory             |
| Events                    | ✅     | Clan-scoped events           |
| Documents                 | ✅     | Document library             |
| Locations                 | ✅     | Geographic tracking          |
| Reputation                | ✅     | Reputation scores            |
| AI Summary                | ✅     | AI-generated summaries       |

### Family System

| Feature                   | Status | Description                   |
| ------------------------- | ------ | ----------------------------- |
| Create/Read/Update/Delete | ✅     | Full CRUD                     |
| Dashboard Stats           | ✅     | Family statistics dashboard   |
| Limits                    | ✅     | Max members/families per user |
| Admin Listing             | ✅     | Admin-level family overview   |
| Tree View                 | ✅     | SVG-based interactive tree    |
| Members                   | ✅     | CRUD with duplicate checking  |
| Merge                     | ✅     | Family merge with undo        |

### Member System

| Feature                   | Status | Description                   |
| ------------------------- | ------ | ----------------------------- |
| Create/Read/Update/Delete | ✅     | Full CRUD within a family     |
| Duplicate Check           | ✅     | Detect duplicate members      |
| Smart Invite Search       | ✅     | Search for invite targets     |
| Profile Fields            | ✅     | 30+ profile fields            |
| Tree Node                 | ✅     | Appears in tree visualization |

---

## 10. Identity & Display ID System

Every entity in the system has a human-readable **displayId** (e.g., `USR-00000001`, `FAM-MRXIF9PC00H`).

### Generation Strategy

**Current: Timestamp + Counter** (replaces sequential strategy)

```typescript
private idSeq = 0;
const num = Date.now().toString(36).slice(-8).toUpperCase();
const seq = (this.idSeq++ % 46656).toString(36).toUpperCase().padStart(3, '0');
return `${prefix}-${num}${seq}`;
```

Produces IDs like `MEM-MRXIFAGV00U` (8 chars base-36 timestamp + 3 chars counter). Provides 46,656 unique IDs per millisecond before wrapping.

### Prefix Registry

| Prefix | Entity                | Prefix | Entity             |
| ------ | --------------------- | ------ | ------------------ |
| USR    | User                  | FAM    | Family             |
| MEM    | FamilyMember          | REL    | Relationship       |
| NOT    | Notification          | ACT    | Activity           |
| MRY    | Memory                | TLV    | TimelineEvent      |
| DUP    | DuplicatePair         | MRG    | MergeSnapshot      |
| CLN    | Clan                  | CMN    | Community          |
| SCL    | SubClan               | CRQ    | ClanRequest        |
| EIN    | EventInvitation       | EVCM   | EventComment       |
| EVDC   | EventDocument         | EVA    | EventActivity      |
| EVH    | EventHistory          | BMK    | Bookmark           |
| KB     | KnowledgeBase         | DOC    | DocumentVault      |
| DFL    | DocumentFolder        | DSH    | DocumentShare      |
| DCO    | DocumentCollection    | DGA    | DocumentGallery    |
| DRE    | DocumentReference     | DPP    | DocumentPublicPage |
| DKB    | DocumentKnowledgeBase | TVW    | TreeView           |
| TLC    | TreeLayoutCache       | TBR    | TreeBranch         |
| TBK    | TreeBookmark          | TSH    | TreeSearchHistory  |
| TVH    | TreeViewHistory       | CHE    | ClanHistoryEntry   |
| CMD    | CommunityAdmin        | CHI    | CommunityHistory   |
| CGA    | CommunityGallery      | CDR    | CommunityDirectory |
| CEV    | CommunityEvent        | CNE    | CommunityNews      |
| CDO    | CommunityDocument     | CLO    | CommunityLocation  |
| CLH    | ClanHistory           | CGY    | ClanGallery        |
| CDI    | ClanDirectory         | CLE    | ClanEvent          |
| CLD    | ClanDocument          | CMR    | CommunityRequest   |

---

## 11. Timeline System

### Event Types (33)

| Type                   | Description                           |
| ---------------------- | ------------------------------------- |
| `BIRTH`                | Birth events with hospital/birth info |
| `DEATH`                | Death with burial and obituary        |
| `MARRIAGE`             | Marriage with ceremony details        |
| `ENGAGEMENT`           | Engagement events                     |
| `DIVORCE`              | Divorce proceedings                   |
| `EDUCATION`            | Educational milestones                |
| `GRADUATION`           | Graduation ceremonies                 |
| `JOB`                  | Employment starts                     |
| `PROMOTION`            | Career promotions                     |
| `CAREER`               | Career milestones                     |
| `BUSINESS`             | Business ventures                     |
| `MIGRATION`            | Relocations and migrations            |
| `HOUSE_PURCHASE`       | Property acquisitions                 |
| `AWARD`                | Awards and recognitions               |
| `MILITARY_SERVICE`     | Military service                      |
| `MILITARY_ACHIEVEMENT` | Military achievements                 |
| `RELIGIOUS_EVENT`      | Religious ceremonies                  |
| `HAJJ`                 | Hajj pilgrimage                       |
| `UMRAH`                | Umrah pilgrimage                      |
| `TRAVEL`               | Travel events                         |
| `ACCIDENT`             | Accident records                      |
| `MEDICAL`              | Medical events                        |
| `RETIREMENT`           | Retirement events                     |
| `DOCUMENT_ADDED`       | Document additions                    |
| `MEMORY_ADDED`         | Memory additions                      |
| `ANNIVERSARY`          | Anniversaries                         |
| `BIRTHDAY`             | Birthdays                             |
| `FAMILY_REUNION`       | Family reunions                       |
| `CLAN_GATHERING`       | Clan-wide gatherings                  |
| `COMMUNITY_EVENT`      | Community-level events                |
| `ACHIEVEMENT`          | Personal achievements                 |
| `CUSTOM_EVENT`         | Custom user-defined events            |

### Event Statuses

| Status      | Description                         |
| ----------- | ----------------------------------- |
| `DRAFT`     | Saved but not visible to others     |
| `PUBLISHED` | Visible based on visibility setting |
| `CANCELLED` | Cancelled but still visible         |

### Feed Types (15)

| Feed             | Description              |
| ---------------- | ------------------------ |
| Chronological    | Standard time-based feed |
| Importance       | Priority-ranked events   |
| Family           | Family-scoped events     |
| Clan             | Clan-scoped events       |
| Community        | Community-scoped events  |
| Nearby           | Location-based events    |
| Popular          | Most engaged events      |
| Upcoming         | Future events            |
| Historical       | Past events              |
| Anniversary      | Anniversary events       |
| Birthdays        | Birthday events          |
| AI Suggested     | AI-recommended events    |
| Recently Updated | Recently modified events |
| Verified         | Only verified events     |
| Bookmarked       | User-bookmarked events   |

### Filter Options (13+)

Date ranges, status, verification, documents, visibility, event type, category, importance, location, participants, tags, created by, and more.

### Sort Options (9)

Newest, Oldest, Popular, Recently Updated, Most Commented, Most Viewed, Most Shared, Alphabetical (A-Z), Alphabetical (Z-A)

### Event Detail Tabs (15)

| #   | Tab           | Description                  |
| --- | ------------- | ---------------------------- |
| 1   | Overview      | Event summary and key fields |
| 2   | People        | Participants and attendees   |
| 3   | Media         | Photo/video gallery          |
| 4   | Documents     | Attached documents           |
| 5   | History       | Change audit trail           |
| 6   | Comments      | Threaded discussion          |
| 7   | Activity      | Activity feed                |
| 8   | Versions      | Version history with diff    |
| 9   | Tags          | Event tags                   |
| 10  | Reminders     | Event reminders              |
| 11  | Notifications | Related notifications        |
| 12  | Location      | Map and venue details        |
| 13  | Share         | Share link and QR code       |
| 14  | Print         | Print/export layout          |
| 15  | Analytics     | Event-specific analytics     |

### RSVP & Invitations

| Feature             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| RSVP Statuses       | Accepted, Maybe, Declined, Pending, Checked In, Attended, Missed |
| Attendance Tracking | Manual, QR Code, GPS, Photo, Admin verification                  |
| QR Generation       | Per-guest QR codes                                               |
| CSV Export          | Guest list export                                                |
| Scoped Invitations  | Individual, Family, SubClan, Clan, Community                     |

### Premium Timeline UI (Volume 6)

- **3-Column Desktop Layout:** Stats panel (left) | Timeline feed (center) | Quick details (right)
- **Compact Event Cards:** 72px height, expand on click
- **Timeline Line:** Vertical timeline with colored nodes per event type
- **Year Dividers:** Visual year separators
- **Infinite Scroll:** 20 events per page, cursor-based pagination via IntersectionObserver
- **Filter Chips:** Horizontal scrollable row with one-click remove
- **Calendar Views:** Month, Week, Day, Agenda
- **Settings:** View density, display options, animation toggle, color theme (persisted via localStorage)
- **Skeleton Loading:** Custom shimmer animation — no spinners

---

## 12. Form System

### Dedicated Forms (22)

Each major event type has its own dedicated form with field-level validation, auto-save, and multi-section layouts:

| #   | Form                     | Sections | Key Fields                                                                              |
| --- | ------------------------ | -------- | --------------------------------------------------------------------------------------- |
| 1   | **Birth**                | 8        | Hospital, weight, blood group, parents present, vaccination schedule, Apgar score       |
| 2   | **Marriage**             | 9        | Spouse, nikah/walima/mehndi dates, mahr amount, dowry details, witnesses                |
| 3   | **Death**                | 10       | Cause, burial location, janazah details, death certificate, obituary text               |
| 4   | **Education**            | 8        | Institution, degree, field of study, GPA, thesis title, scholarships                    |
| 5   | **Employment**           | 9        | Company, position, salary range, responsibilities, skills gained                        |
| 6   | **Migration**            | 10       | Origin/destination, visa type, passport number, sponsor info                            |
| 7   | **Military Service**     | 9        | Branch, rank, MOS, deployment history, medals earned                                    |
| 8   | **Award**                | 8        | Award name, type, nomination details, prize amount, ceremony info                       |
| 9   | **Business**             | 10       | Business name, type, investment, revenue, milestones                                    |
| 10  | **Engagement**           | 9        | Bride, groom, families, ring ceremony, invitation, media, documents, review             |
| 11  | **Divorce**              | 10       | Marriage reference, reason, court, legal, children, financial, media, documents, review |
| 12  | **Graduation**           | 9        | Institution, degree, result, convocation, certificates, media, documents, review        |
| 13  | **Promotion**            | 9        | Previous, new position, details, compensation, certificate, media, documents, review    |
| 14  | **House Purchase**       | 8        | Property, location, transaction, legal, media, documents, review                        |
| 15  | **Hajj/Umrah**           | 9        | Travel, agency, documents, rituals, group, media, docs, review                          |
| 16  | **Military Achievement** | 8        | Achievement, organization, verification, significance, media, documents, review         |
| 17  | **Birthday**             | 8        | Celebration, guests, planning, gifts, media, documents, review                          |
| 18  | **Anniversary**          | 8        | Couple, celebration, planning, reflection, media, documents, review                     |
| 19  | **Family Reunion**       | 9        | Organizer, families, venue, attendance, activities, media, documents, review            |
| 20  | **Clan Gathering**       | 9        | Organizer, clan, agenda, minutes, attendance, media, documents, review                  |
| 21  | **Community Event**      | 10       | Organizer, event, venue, invitations, guests, sponsors, media, documents, review        |
| 22  | **Generic**              | —        | Custom form fallback for any event type                                                 |

**Form Coverage:** 25 event types have dedicated forms. 8 event types fall back to GenericEventForm: `TRAVEL`, `ACCIDENT`, `MEDICAL`, `RETIREMENT`, `DOCUMENT_ADDED`, `MEMORY_ADDED`, `CUSTOM_EVENT`.

### Form Layout

- **Accordion-style** with collapsible sections (one at a time)
- **Professional Wizard** (Volume 6): Step-by-step wizard with progress bar, keyboard navigation, auto-save indicator per step, step validation before advancing
- **Sticky header** with auto-save indicator
- **Progress bar** with section dots
- **Footer** with navigation and save/publish buttons
- **Glass morphism design** with soft shadows

### Validation

- **Field-level:** Zod schemas per field with real-time error display
- **Form-level:** Required fields, date ranges, format validation
- **Event-type-specific:** Different required fields per event type
- **Backend validation:** class-validator with whitelist mode, `forbidNonWhitelisted: true`, `transform: true`

### Auto-Save

- Debounced save (2s delay + 5s interval)
- Draft status preserved
- Visual indicator shows save state (saving/saved/error)

---

## 13. Media & Upload System

### Upload Methods

| Method          | Description                 |
| --------------- | --------------------------- |
| Drag & Drop     | Drop files onto upload zone |
| Click to Browse | Standard file picker dialog |
| Paste (Ctrl+V)  | Paste from clipboard        |
| Camera Capture  | Mobile device camera        |

### Supported Formats

| Category  | Extensions                 | Size Limit |
| --------- | -------------------------- | ---------- |
| Images    | jpg, jpeg, png, webp, gif  | 10MB       |
| Videos    | mp4, mov                   | 100MB      |
| Documents | pdf, docx, xlsx, pptx, zip | 25MB       |

### Cloudinary Integration

- All uploads go through Cloudinary via multipart form data
- Automatic thumbnail generation
- Image optimization (width, height, quality, format)
- Video transcoding
- PDF/document storage

### Enhanced Upload Zone (Volume 6)

- Multi-Method Upload: Drag & drop, camera, clipboard paste, bulk upload
- Per-File Progress: Individual progress bars per file
- Compression Preview: Visual preview before upload
- File Type Badges: Color-coded badges (image, video, document)

### Media Manager Features

- **Type Filtering:** Filter by image, video, or document
- **Grid / List Views:** Toggle display mode
- **Download:** One-click download
- **Playback:** Inline video playback with controls
- **Bulk Operations:** Multi-select for batch delete, download, move
- **Storage Indicator:** Visual bar showing used vs total quota
- **Drag & Drop Reorder:** Reorder media items

---

## 14. Document Vault

### Overview

The Document Vault (Sprint 10 Part 2) is a comprehensive document management system with versioning, sharing, verification, galleries, and knowledge base features.

### Core Features

| Feature               | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| **CRUD**              | Create, read, update, soft delete/restore documents                   |
| **25 Document Types** | Certificates, Government, Historical, Maps, Letters, Newspapers, etc. |
| **Versioning**        | Full version history with rollback                                    |
| **Soft Deletes**      | Trash with restore capability                                         |
| **Search**            | Full-text search across all documents                                 |
| **Favorites**         | Per-user bookmarking                                                  |
| **Statistics**        | Storage usage, document counts                                        |

### Organization

| Feature         | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| **Folders**     | Hierarchical folder organization                            |
| **Collections** | Themed groups (9 types: Research, Family, Historical, etc.) |
| **Tags**        | Auto + manual tagging                                       |
| **Attachments** | Link documents to any entity (8 entity types)               |

### Sharing

| Feature                 | Description                         |
| ----------------------- | ----------------------------------- |
| **Link Sharing**        | Secure token-based share links      |
| **User Sharing**        | Direct share with specific users    |
| **Password Protection** | Optional password on shared links   |
| **Expiry**              | Optional link expiration            |
| **Download Limits**     | Max download count                  |
| **Access Logs**         | Full audit trail of document access |

### Verification System

| Feature                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| **Reviewers**          | Community/Clan/Historical/Research reviewer roles |
| **Confidence Scoring** | Weighted confidence score per document            |
| **Statuses**           | Verified / Pending / Rejected                     |
| **OCR Tracking**       | Processed / Pending / Not Applicable              |

### Gallery

| Type             | Description                   |
| ---------------- | ----------------------------- |
| Photo            | Photo management              |
| Album            | Album grouping                |
| Video            | Video management              |
| Historical Image | Historical image curation     |
| Map              | Map document management       |
| Letter           | Letter management             |
| Book             | Book management               |
| Manuscript       | Manuscript management         |
| Newspaper        | Newspaper clipping management |

### References

| Feature             | Description                               |
| ------------------- | ----------------------------------------- |
| Source Citations    | Structured source references              |
| Reliability Scoring | UNCHECKED → VERIFIED reliability scale    |
| Citation Linking    | Link citations to specific document facts |

### Knowledge Base

| Feature       | Description                                          |
| ------------- | ---------------------------------------------------- |
| Article Types | Wiki, Article, Research, Oral History, FAQ (8 types) |
| Voting System | Upvote/downvote on articles                          |
| Categories    | Hierarchical categorization                          |
| Rich Text     | Full WYSIWYG editor                                  |

### Public Pages

- SEO-optimized public document views
- Slug-based routing for clean URLs
- Open Graph metadata for social sharing
- Structured data for search engines

### Smart Organization

- Auto-tagging (pluggable architecture)
- Relationship linking (link documents to persons/families)
- Duplicate detection hooks
- Organization suggestions

### Analytics

| Metric      | Description                 |
| ----------- | --------------------------- |
| Trending    | Most viewed documents       |
| Featured    | Curated featured documents  |
| Most Viewed | Top documents by view count |
| Verified    | Verification statistics     |
| Storage     | Storage usage analytics     |

---

## 15. Family Tree Engine

### Overview

The Tree Engine is a production-grade SVG-based family tree visualization system developed in Sprint 11.

### Components (Frontend)

| Component                   | File                              | Description                                     |
| --------------------------- | --------------------------------- | ----------------------------------------------- |
| `TreeCanvas`                | `tree-canvas.tsx`                 | SVG-based rendering engine with zoom/pan        |
| `TreeControls`              | `tree-controls.tsx`               | Toolbar with layout switching and zoom controls |
| `TreeSearch`                | `tree-search.tsx`                 | Search and highlight nodes                      |
| `TreeDetailPanel`           | `tree-detail-panel.tsx`           | Selected node detail view                       |
| `TreeMinimap`               | `tree-minimap.tsx`                | Overview minimap                                |
| `TreeGenerationNavigator`   | `tree-generation-navigator.tsx`   | Jump to specific generations                    |
| `TreeRelationshipHighlight` | `tree-relationship-highlight.tsx` | Path/ancestor highlighting                      |
| `TreeStatistics`            | `tree-statistics.tsx`             | Tree statistics panel                           |

### Layout Algorithms (4)

| Layout         | Description                         | Direction  |
| -------------- | ----------------------------------- | ---------- |
| **Vertical**   | Root at top, children below         | Top-Down   |
| **Horizontal** | Root at left, children to right     | Left-Right |
| **Compact**    | Tighter spacing for large trees     | Top-Down   |
| **Balanced**   | Center-aligned nodes per generation | Top-Down   |

### Card Design

- **Card Size:** 200×100px
- **Gender Colors:** Male (#3b82f6 blue), Female (#ec4899 pink), Other (#8b5cf6 violet)
- **Badges:** "ME" badge, Living/Deceased badge, Verified badge, Clan badge, Multiple Marriage indicator
- **Avatar:** Profile photo or initials fallback
- **Gender display:** Icon + label
- **Birth/Death dates** with age calculation
- **Occupation** display
- **"ME" Badge** with blue glow for current user

### Data Flow

1. User selects entity type (Family/Clan/Community) and entity
2. Frontend calls tree API endpoint
3. `TreeService` computes nodes and edges from PostgreSQL via Prisma
4. Response returns `TreeData` with nodes, edges, rootId, metadata
5. `TreeCanvas` computes positions using BFS layout algorithm
6. SVG renders nodes as cards, edges as connectors

### Professional Enhancements

- **Clean vertical/horizontal connectors** — no diagonal/curved edges
- **Family unit concept** — spouse connector with children originating from center
- **Proper generation rows** — oldest at top, youngest at bottom
- **Auto-rebalance** on new members
- **No overlap** between nodes
- **Subtree width calculation** for parent centering
- **Memoized positions** for performance

### API Endpoints

| Method | Endpoint                                         | Auth | Description              |
| ------ | ------------------------------------------------ | ---- | ------------------------ |
| GET    | `/api/tree/family/:familyId`                     | No   | Get complete family tree |
| GET    | `/api/tree/clan/:clanId`                         | No   | Get complete clan tree   |
| GET    | `/api/tree/community/:communityId`               | No   | Get community tree       |
| GET    | `/api/tree/member/:memberId/ancestors`           | No   | Ancestor tree            |
| GET    | `/api/tree/member/:memberId/descendants`         | No   | Descendant tree          |
| GET    | `/api/tree/search`                               | No   | Search within tree       |
| GET    | `/api/tree/stats/:entityType/:entityId`          | No   | Tree statistics          |
| GET    | `/api/tree/enhanced-stats/:entityType/:entityId` | No   | Enhanced analytics       |
| POST   | `/api/tree/common-ancestor`                      | No   | Find common ancestor     |
| POST   | `/api/tree/relationship-path`                    | No   | Find relationship path   |
| GET    | `/api/tree/diagnostics/:entityType/:entityId`    | No   | Tree diagnostics         |
| POST   | `/api/tree/node/expand`                          | Yes  | Expand node (lazy load)  |
| POST   | `/api/tree/views`                                | JWT  | Create saved view        |
| GET    | `/api/tree/views`                                | JWT  | List saved views         |
| GET    | `/api/tree/views/public`                         | No   | Public views             |
| DELETE | `/api/tree/views/:id`                            | JWT  | Delete view              |
| POST   | `/api/tree/bookmarks`                            | JWT  | Bookmark node            |
| GET    | `/api/tree/bookmarks`                            | JWT  | List bookmarks           |
| DELETE | `/api/tree/bookmarks/:id`                        | JWT  | Delete bookmark          |
| POST   | `/api/tree/search-history`                       | JWT  | Log search               |
| GET    | `/api/tree/view-history`                         | JWT  | View history             |
| GET    | `/api/tree/recently-added`                       | No   | Recent additions         |
| GET    | `/api/tree/recently-updated`                     | No   | Recent updates           |
| GET    | `/api/tree/popular-branches`                     | No   | Popular branches         |
| GET    | `/api/tree/health`                               | No   | Tree engine health       |
| GET    | `/api/tree/performance`                          | No   | Performance stats        |

### Tree Data Shape

```typescript
interface TreeData {
  nodes: TreeNode[];
  edges: TreeEdge[];
  rootId: string;
  totalNodes: number;
  maxDepth: number;
  metadata: {
    treeType: string;
    rootEntityType: string;
    rootEntityId: string;
    layout: string;
    generatedAt: string;
  };
}

interface TreeNode {
  id: string;
  displayId: string;
  entityType: string; // MEMBER, FAMILY, CLAN, SUBCLAN, COMMUNITY
  entityId: string;
  name: string;
  displayName?: string;
  gender?: string;
  birthDate?: Date;
  deathDate?: Date;
  age?: number;
  occupation?: string;
  profilePhoto?: string;
  depth: number;
  familyId?: string;
  clanId?: string;
  subClanId?: string;
  communityId?: string;
  hasChildren?: boolean;
}

interface TreeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: string; // PARENT_CHILD, SPOUSE, OTHER
  label?: string;
}
```

### Performance

- Lazy node expansion for large trees
- Layout caching in `TreeLayoutCache` table
- Memoized position calculation
- Neo4j migration ready (abstract traversal interfaces)
- Connector rendering optimized for clean SVG output

---

## 16. Neo4j Graph Database

### Purpose

Neo4j serves as the relationship engine for advanced graph traversal operations. It enables efficient queries such as computing common ancestors, finding descendant trees, discovering relationship paths between any two members, and rendering interactive family tree visualizations.

### Architecture

```
PostgreSQL (Prisma ORM)           Neo4j (neo4j-driver)
┌──────────────────────┐         ┌──────────────────────┐
│ Users                │         │ Family (node)        │
│ Auth / Sessions      │  Sync   │ Person (node)        │
│ Invitations          │ ──────► │ MARRIED_TO (rel)     │
│ Notifications        │         │ PARENT_OF (rel)      │
│ Timeline Events      │         │ BELONGS_TO (rel)     │
│ Community / Clan     │         └──────────────────────┘
│ Media / Documents    │
└──────────────────────┘
```

### Current Status: 🔄 In Progress

The Neo4j integration has the following components implemented:

- `SyncService` — Synchronizes data from PostgreSQL to Neo4j
- `GraphRepository` — Schema application, health checks
- `PersonRepository` — Person node CRUD, PARENT_OF relationships
- `FamilyRepository` — Family node CRUD
- `MarriageRepository` — MARRIED_TO relationships
- `TreeRepository` — Tree construction, ancestor/descendant traversal
- `KinshipService` — Kinship calculation (16 tests passing)
- `RelationshipService` — Relationship path algorithms (64 tests passing)
- `GraphTraversalService` — Generation label calculation (8 tests passing)

**Tests: 132/132 passing** (kinship=16, relationship=64, graph-traversal=8, cousin=18, path=30)

### Setup

**Option A: Neo4j AuraDB (Cloud — Recommended)**

1. Sign up at https://console.neo4j.io/
2. Create a free AuraDB instance
3. Set environment variables in `apps/api/.env`

**Option B: Docker (Local Development)**

```bash
docker run -d \
  --name neo4j \
  -p 7687:7687 \
  -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_dbms_memory_pagecache_size=512M \
  -e NEO4J_dbms_memory_heap_initial__size=512M \
  -e NEO4J_dbms_memory_heap_max__size=1G \
  neo4j:5
```

Access Neo4j Browser at http://localhost:7474 (username: `neo4j`, password: `password`).

### Environment Variables

| Variable         | Description         | Default                 |
| ---------------- | ------------------- | ----------------------- |
| `NEO4J_URI`      | Bolt connection URI | `bolt://localhost:7687` |
| `NEO4J_USERNAME` | Database username   | `neo4j`                 |
| `NEO4J_PASSWORD` | Database password   | —                       |
| `NEO4J_DATABASE` | Database name       | `neo4j`                 |

### Sync Mechanism

The `SyncService` synchronizes data from PostgreSQL to Neo4j:

- **Full sync** (`syncAll()`): Applies schema constraints, syncs all families, persons, and relationships. Idempotent.
- **Incremental sync**: `syncPerson()`, `syncRelationship()`, `deletePerson()`, `removeRelationship()` for individual updates.
- **Lifecycle hooks**: Can be called from event handlers after PostgreSQL mutations.

### Trigger Full Sync

```typescript
const syncService = app.get(SyncService);
const result = await syncService.syncAll();
// { success: true, nodesCreated: 42, relationshipsCreated: 87, ... }
```

---

## 17. Family Discovery & Duplicate Detection System

A comprehensive system for automatically discovering possible relatives across the entire database, detecting duplicate person records with weighted confidence scoring, providing side-by-side comparison, and enabling safe merge with full audit trail and rollback.

### 17.1 Database Models

| Model                     | Purpose                                | Key Fields                                                                                                                |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DuplicatePair`           | Detected duplicate person pairs        | `sourceMemberId`, `targetMemberId`, `confidenceScore`, `matchFactors` (JSON), `status` (PENDING/APPROVED/REJECTED/MERGED) |
| `MergeSnapshot`           | Pre-merge state snapshots for rollback | `sourceSnapshot` (JSON), `targetSnapshot` (JSON), `mergeResult` (JSON), `strategy`, `performedById`, `undone`             |
| `MergeAuditLog`           | Audit trail for every merge action     | `mergeRequestId`, `action`, `performedById`, `details`                                                                    |
| `DiscoveryRecommendation` | Suggested connections for users        | `userId`, `targetType`, `targetId`, `confidenceScore`, `matchFactors` (JSON)                                              |
| `FamilyMergeRequest`      | Cross-family merge requests            | `sourceFamilyId`, `targetFamilyId`, `status` (PENDING/APPROVED/REJECTED), `conflictData`                                  |

### 17.2 Duplicate Detection Engine

The detection algorithm evaluates similarity using weighted confidence scores across multiple dimensions:

| Factor                  | Weight | Method                                                 |
| ----------------------- | ------ | ------------------------------------------------------ |
| Full name match         | 35%    | Case-insensitive exact match of `firstName + lastName` |
| Shared surname          | 20%    | Same last name across family boundaries                |
| Email match             | 25%    | Exact case-insensitive email comparison                |
| Phone match             | 20%    | Exact phone number match                               |
| Exact name + birth year | 30%    | Name match plus birth year proximity (±2 years)        |
| Birth date proximity    | 15%    | Date difference-based scoring (exact=full, ±1yr=half)  |
| Same city               | 15%    | Case-insensitive city match                            |
| Same country            | 10%    | Case-insensitive country match                         |
| Same occupation         | 10%    | Case-insensitive occupation match                      |
| Government ID           | 40%    | Direct government ID match                             |

**Scoring formula:**

```
totalScore = Σ(weight × matchFactor) / Σ(weights)
confidenceScore = min(totalScore, 100)
```

Each score includes a `matchFactors` JSON explaining WHY the score was assigned (which fields matched, which conflicted).

**Scan flow:**

1. Get all members in user's families
2. Compare against all members outside user's families
3. Skip existing pairs (deduplication)
4. Calculate composite score for each pair
5. Auto-create DuplicatePair records for scores ≥ 40%
6. Exclude pairs where both members are already MERGED

### 17.3 Match Review System

| Action  | Description                                          |
| ------- | ---------------------------------------------------- |
| Approve | Mark pair as confirmed duplicate (status → APPROVED) |
| Reject  | Mark pair as not a duplicate (status → REJECTED)     |
| Merge   | Execute member merge (status → MERGED)               |
| Ignore  | Skip without decision                                |
| Undo    | Rollback a previous merge decision                   |

**Review workflow:**

1. Detection scan finds potential duplicates (40%+ confidence)
2. User reviews pairs in `/dashboard/duplicates` with sort by confidence
3. Side-by-side comparison shows matching/different/missing fields
4. User approves, rejects, or chooses to merge
5. Merge creates a snapshot for full rollback capability
6. All actions recorded in MergeAuditLog

### 17.4 Person Comparison Screen

The comparison screen (`/dashboard/duplicates/[id]`) provides:

- **Side-by-side layout** with two member cards
- **Confidence score** displayed as a color-coded progress bar (green ≥80%, amber ≥60%, red <60%)
- **Match indicators** for each field (green = match, red = conflict, gray = missing)
- **Field comparison** across firstName, lastName, gender, birthDate, deathDate, email, phone, city, country, occupation
- **Actions:** Approve, Reject, Merge with confirmation dialogs

### 17.5 Merge Engine

| Feature             | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| Preview             | Full field-by-field comparison before merge                |
| Conflict Resolution | Three strategies: KEEP_LEFT, KEEP_RIGHT, MERGE_BOTH        |
| Relationship Merge  | All relationships from source member transferred to target |
| Audit Trail         | Every merge recorded with performer, timestamp, details    |
| No Data Loss        | Pre-merge snapshots preserve complete state                |

**Merge strategies:**

- **KEEP_LEFT** — Keep source member, delete target; transfer all relationships to source
- **KEEP_RIGHT** — Keep target member, delete source; transfer missing fields from source
- **MERGE_BOTH** — Keep target member, merge fields (target takes priority, source fills gaps)

**Field-level merge logic (MERGE_BOTH):**

```
for each field:
  if target has value → keep target value
  else if source has value → copy source value
```

### 17.6 Merge History & Rollback

Every merge creates a permanent audit record storing:

| Field            | Description                               |
| ---------------- | ----------------------------------------- |
| `sourceSnapshot` | Complete pre-merge state of source member |
| `targetSnapshot` | Complete pre-merge state of target member |
| `mergeResult`    | Post-merge state                          |
| `strategy`       | Which merge strategy was used             |
| `performedById`  | Who performed the merge                   |
| `undone`         | Whether this merge has been reversed      |

**Rollback process:**

1. Look up the MergeSnapshot by ID
2. Verify the requesting user performed the original merge
3. Check the merge hasn't already been undone
4. If source member was deleted → restore with original data
5. If target member data was modified → restore to pre-merge state
6. Mark snapshot as `undone = true` with timestamp

### 17.7 Discovery Engine

The Discovery Engine (`/dashboard/discover`) provides automated suggestions:

| Recommendation Type     | Logic                                                             | Confidence Boost |
| ----------------------- | ----------------------------------------------------------------- | ---------------- |
| Shared surname families | Families whose name contains a surname from user's family members | +25%             |
| Same city users         | Users in the same city as user                                    | +20%             |
| Same country users      | Users in the same country                                         | +15%             |
| Same occupation users   | Users with matching occupation                                    | +10%             |
| Name match members      | Members outside user's families with matching name                | +35%             |
| Same surname members    | Members sharing a surname                                         | +20%             |
| Same location members   | Members in same city/country                                      | +15%             |
| Country clans           | Clans in the same country as user                                 | +15%             |

**Discovery flow:**

1. Collect all surnames from user's family members
2. Search for families/owners sharing those surnames
3. Search for users with overlapping location/occupation
4. Search for members outside user families with matching names/locations
5. Score each candidate with explainable match factors
6. Persist as DiscoveryRecommendation records
7. Return top 50 sorted by confidence descending

### 17.8 API Endpoints

#### Discovery (`/api/discovery`)

| Method | Endpoint                    | Auth | Description                                    |
| ------ | --------------------------- | ---- | ---------------------------------------------- |
| GET    | `/api/discovery`            | JWT  | Get discovery recommendations for current user |
| GET    | `/api/discovery/stats`      | JWT  | Discovery statistics (total/viewed/byType)     |
| PATCH  | `/api/discovery/:id/viewed` | JWT  | Mark recommendation as viewed                  |

#### Duplicates (`/api/duplicates`)

| Method | Endpoint                           | Auth | Description                                               |
| ------ | ---------------------------------- | ---- | --------------------------------------------------------- |
| GET    | `/api/duplicates`                  | JWT  | List duplicate reports (filter by status, minScore, page) |
| POST   | `/api/duplicates/detect`           | JWT  | Run duplicate detection scan                              |
| GET    | `/api/duplicates/:id`              | JWT  | Get duplicate pair detail                                 |
| PATCH  | `/api/duplicates/:id/review`       | JWT  | Review duplicate (approve/reject)                         |
| GET    | `/api/duplicates/family/:familyId` | JWT  | Get duplicates for specific family                        |

#### Merge (`/api/merge`)

| Method | Endpoint                      | Auth | Description                        |
| ------ | ----------------------------- | ---- | ---------------------------------- |
| GET    | `/api/merge/preview`          | JWT  | Preview merge between two members  |
| POST   | `/api/merge/execute`          | JWT  | Execute member merge with strategy |
| GET    | `/api/merge/history`          | JWT  | Get merge history                  |
| GET    | `/api/merge/history/:id`      | JWT  | Get merge snapshot detail          |
| POST   | `/api/merge/:snapshotId/undo` | JWT  | Undo a merge using snapshot        |
| GET    | `/api/merge/request`          | JWT  | List merge requests                |
| POST   | `/api/merge/request`          | JWT  | Create family merge request        |
| PATCH  | `/api/merge/:id/approve`      | JWT  | Approve merge request              |
| PATCH  | `/api/merge/:id/reject`       | JWT  | Reject merge request               |
| GET    | `/api/merge/:id/audit`        | JWT  | Get audit log for merge request    |

### 17.9 Frontend Pages

| Route                        | Description                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `/dashboard/discover`        | Discovery hub showing possible relatives, nearby families, shared surnames, suggested clans  |
| `/dashboard/duplicates`      | Duplicate listing with stats, tabs (all/pending/approved/rejected), scan button              |
| `/dashboard/duplicates/[id]` | Duplicate detail with side-by-side member comparison, match indicators, approve/reject/merge |
| `/dashboard/merge`           | Merge preview with field comparison table, strategy selector, confirm merge                  |
| `/dashboard/merge/history`   | Merge history with undo capability for each operation                                        |

### 17.10 Security

- All endpoints require JWT authentication
- Merge endpoints verify ownership of both source and target families
- Duplicate review restricted to family owners
- Rollback restricted to original merge performer
- Audit log records every destructive action
- Family merge requests require approval from target family owner

### 17.11 Performance

- Duplicate detection limited to 5000 comparisons per scan
- Discovery recommendations capped at 50 per user
- Pagination support for listing endpoints (page, limit params)
- Efficient Prisma queries with select-only projections
- Existing pair deduplication prevents redundant scans
- Batch operations within Prisma transactions for merge/rollback

---

## 18. Discovery Engine

The Discovery Engine provides automated suggestions for connecting families and discovering new relatives.

| Feature         | Status | Description                                              |
| --------------- | ------ | -------------------------------------------------------- |
| Recommendations | ✅     | Suggested connections based on shared surnames/locations |
| Discovery Stats | ✅     | Statistics on discovery matches                          |
| AI Suggestions  | ✅     | AI-powered connection suggestions                        |

### API Endpoints

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| GET    | `/api/discovery`       | Get recommendations  |
| GET    | `/api/discovery/stats` | Discovery statistics |

---

## 19. Search System

### 19.1 Global Search

| Feature           | Status | Description                                                          |
| ----------------- | ------ | -------------------------------------------------------------------- |
| Multi-Entity      | ✅     | Search across users, members, families, clans, communities, subclans |
| Display ID Search | ✅     | Search by formatted IDs (USR-, FAM-, MEM-, REL-, INV-, CLN-)         |
| PII Protection    | ✅     | Personally identifiable information protected                        |
| Instant Search    | ✅     | Debounced 300ms input                                                |
| Results           | ✅     | Sorted by relevance                                                  |

### 19.2 Search Fields by Entity

| Entity      | Searchable Fields                                                  |
| ----------- | ------------------------------------------------------------------ |
| Users       | displayId, username, profileSlug, name, displayName, city, country |
| Members     | displayId, firstName, lastName, city, country                      |
| Families    | displayId, name, description                                       |
| Clans       | displayId, name, slug, description                                 |
| Communities | displayId, name, slug, description, city, country                  |
| SubClans    | displayId, name, slug, description                                 |

### 19.3 Enhanced Timeline Search

| Filter Dimension | Example                                            |
| ---------------- | -------------------------------------------------- |
| Text query       | Title, description, location, venue, display ID    |
| Event type       | BIRTH, MARRIAGE, DEATH, etc.                       |
| Date range       | From/to date pickers                               |
| Status           | DRAFT, PUBLISHED, CANCELLED                        |
| Visibility       | PUBLIC, FAMILY, SUB_CLAN, CLAN, COMMUNITY, ONLY_ME |
| Importance       | LOW, NORMAL, HIGH, CRITICAL                        |
| Venue            | Location name search                               |
| Color            | Color-coded event filter                           |
| Created by       | Filter by creator                                  |
| Family           | Family-scoped filter                               |
| Tags             | Event tag filter                                   |

### 19.4 Search Features

- **Date Presets:** Today, This Week, This Month, This Year, Last 30 Days, Last 90 Days, Custom Range
- **Sort Options:** Newest, Oldest, Popular, Recently Updated, Most Commented, Most Viewed, Most Shared, Alphabetical (A-Z), Alphabetical (A-Z)
- **Filter Chips:** Horizontal scrollable chip row with one-click remove
- **Grid/List Toggle:** Display mode switch for results
- **Keyboard Navigation:** Arrow keys, Enter to select, Escape to dismiss
- **Saved Searches:** Persist frequently used search configurations
- **Search History:** Recent searches shown on focus

### 19.5 API Endpoint

| Method | Endpoint                                      | Auth | Description                       |
| ------ | --------------------------------------------- | ---- | --------------------------------- |
| GET    | `/api/search?q=term&type=all&page=1&limit=20` | JWT  | Global search across all entities |

---

## 20. Notifications

### Notification Engine (9 Event Lifecycle Types)

| Type                 | Trigger                                 |
| -------------------- | --------------------------------------- |
| `EVENT_CREATED`      | New event added to timeline             |
| `EVENT_PUBLISHED`    | Draft event published                   |
| `EVENT_COMMENTED`    | New comment on an event                 |
| `EVENT_UPDATED`      | Event details modified                  |
| `EVENT_RSVP`         | RSVP response (accepted/declined/maybe) |
| `EVENT_DOCUMENT`     | New document attached to event          |
| `EVENT_MEDIA`        | New media uploaded to event             |
| `EVENT_CANCELLED`    | Event cancelled                         |
| `EVENT_DATE_CHANGED` | Event date rescheduled                  |

### Features

- In-app notification center
- Auto-refresh every 30 seconds
- Mark single read / mark all read
- Per-user channel preferences (sound, email, push)
- Notification templates
- Delivery status tracking
- Admin broadcast capability

### Architecture

| Model                    | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `Notification`           | Core notification with type, title, message, read status |
| `NotificationPreference` | Per-user channel preferences                             |
| `NotificationDelivery`   | Delivery status tracking                                 |
| `NotificationTemplate`   | Message templates                                        |
| `NotificationQueue`      | Scheduled delivery                                       |

### API Endpoints

| Method | Endpoint                         | Description        |
| ------ | -------------------------------- | ------------------ |
| GET    | `/api/notifications`             | List notifications |
| GET    | `/api/notifications/unread`      | Unread count       |
| PATCH  | `/api/notifications/:id/read`    | Mark as read       |
| PATCH  | `/api/notifications/read-all`    | Mark all as read   |
| GET    | `/api/notifications/preferences` | Get preferences    |
| PATCH  | `/api/notifications/preferences` | Update preferences |

---

## 21. Activity System

| Feature         | Status | Description                               |
| --------------- | ------ | ----------------------------------------- |
| Activity Feed   | ✅     | Chronological activity log                |
| User-Scoped     | ✅     | Per-user activity view                    |
| Family-Scoped   | ✅     | Per-family activity view                  |
| Activity Stats  | ✅     | Activity analytics                        |
| Entity Tracking | ✅     | Tracks events, comments, documents, media |

---

## 22. Visibility & Privacy System

### Visibility Levels (6)

```
OnlyMe → Family → SubClan → Clan → Community → Public
```

| Level       | Description                              |
| ----------- | ---------------------------------------- |
| `ONLY_ME`   | Visible only to the creating user        |
| `FAMILY`    | Visible to all family members            |
| `SUB_CLAN`  | Visible to sub-clan members              |
| `CLAN`      | Visible to all clan members              |
| `COMMUNITY` | Visible to all community members         |
| `PUBLIC`    | Visible to anyone (authenticated or not) |

### Enforcement

- **Server-side enforcement** on all queries via Prisma `where` clauses
- **Role-based access control** for family/clan/community scopes
- **Ownership checks** on all mutation endpoints
- **Profile field privacy** — per-field visibility settings

### Privacy System

| Feature                 | Status | Description                      |
| ----------------------- | ------ | -------------------------------- |
| 6-Level Visibility      | ✅     | Granular access control          |
| Server-Side Enforcement | ✅     | Cannot be bypassed from client   |
| Ownership Checks        | ✅     | Verify user owns resource        |
| Profile Privacy         | ✅     | Per-field privacy settings       |
| Soft Deletes            | ✅     | All entities support soft delete |
| Account Lockout         | ✅     | 5 failed attempts → 15-min lock  |

---

## 23. Security Architecture

### Authentication

| Feature            | Status | Details                                 |
| ------------------ | ------ | --------------------------------------- |
| JWT Access Tokens  | ✅     | 1-hour expiry                           |
| JWT Refresh Tokens | ✅     | 30-day expiry                           |
| Password Hashing   | ✅     | bcryptjs with salt rounds               |
| Account Lockout    | ✅     | 5 failed → 15-minute lock               |
| Session Management | ✅     | LoginSession model for refresh tracking |

### Authorization

| Feature           | Status | Details                                               |
| ----------------- | ------ | ----------------------------------------------------- |
| Ownership Checks  | ✅     | All mutations verify ownership via PermissionsService |
| Admin API Key     | ✅     | X-Admin-Key header for admin endpoints                |
| Role-Based Access | ✅     | Clan/Community admin roles                            |
| Account Status    | ✅     | Active account required                               |

### Request Security

| Feature                   | Status | Details                                |
| ------------------------- | ------ | -------------------------------------- |
| Rate Limiting             | ✅     | 100 req/min per IP via ThrottlerModule |
| Input Validation          | ✅     | class-validator whitelist mode         |
| CORS                      | ✅     | Restricted to configured origins       |
| Helmet Headers            | ✅     | Security headers on all responses      |
| CSRF Protection           | ✅     | SameSite cookie policy                 |
| Sensitive Data Protection | ✅     | PII excluded from certain responses    |

### Data Security

| Feature          | Status | Details                            |
| ---------------- | ------ | ---------------------------------- |
| Soft Deletes     | ✅     | DeletedAt timestamps on all tables |
| Cascade Deletes  | ✅     | Prisma referential actions         |
| Response Caching | ✅     | Private Cache-Control headers      |
| File Validation  | ✅     | Type/size validation on uploads    |

---

## 24. API Resilience Layer

### Overview

The API Resilience Layer provides robust error handling, automatic recovery, and graceful degradation for all client-side API interactions (Volume 6).

### Components

| Component                | File                                         | Description                                       |
| ------------------------ | -------------------------------------------- | ------------------------------------------------- |
| `ApiHealthMonitor`       | `lib/api-health-monitor.ts`                  | Singleton health monitoring with circuit breaker  |
| `ApiRetry`               | `lib/api-retry.ts`                           | Retry utility with exponential backoff and jitter |
| `ApiOfflineQueue`        | `lib/api-offline-queue.ts`                   | Offline request queue persisted to localStorage   |
| `ApiProvider`            | `components/providers/api-provider.tsx`      | React context provider for API health status      |
| `ErrorBoundary`          | `components/ui/error-boundary.tsx`           | React error boundary with friendly fallback UI    |
| `ConnectionStatusBanner` | `components/ui/connection-status-banner.tsx` | Top-of-page banner for API connectivity status    |
| `useApiHealth()`         | (hook in api-provider)                       | Hook to consume health state in any component     |

### Health Monitoring

- **Polling interval:** 30 seconds
- **Circuit breaker:** Opens after consecutive failures, stops polling until recovery
- **Endpoints monitored:** `GET /api/health`
- **States tracked:** `healthy`, `degraded`, `unreachable`

### Retry Strategy

- **Algorithm:** Exponential backoff with jitter
- **Base delay:** 1 second
- **Max retries:** 3
- **Max delay cap:** 30 seconds
- **Jitter:** Random 0–500ms added to each retry delay
- **Retryable methods:** GET, PATCH, POST, PUT
- **Non-retryable:** DELETE

### Offline Request Queue

- **Persistence:** localStorage — survives page reload
- **Auto-drain:** Queued requests retry when connection restores
- **Max queue size:** 50 requests
- **Expiry:** Requests >24 hours old discarded on drain
- **Conflict resolution:** Server returns 409 for stale mutations

### Error Boundary

- Catches unhandled React render errors
- Displays user-friendly fallback with "Try Again" button
- Logs error details in development mode
- Prevents full-page white screen on component failures

### Connection Status Banner

- **Position:** Fixed top of viewport
- **States:** Connected, Reconnecting, Offline
- **Behavior:** Auto-dismisses on restore; manual dismiss for offline
- **Queue indicator:** Shows count of queued requests when offline

---

## 25. API Endpoints Reference

### Core Endpoints

| Group         | Endpoints | Description                                                       |
| ------------- | --------- | ----------------------------------------------------------------- |
| Auth          | 6         | register, login, refresh, logout, forgot-password, reset-password |
| Users         | 3         | CRUD, list (admin), stats                                         |
| Profile       | 8         | CRUD, image upload, privacy, completion, sessions                 |
| Families      | 5         | CRUD, stats, limits, admin list                                   |
| Members       | 5         | CRUD, duplicate check, smart invite search                        |
| Relationships | 3         | create, list, delete (same-family validation)                     |
| Invitations   | 5         | CRUD with token-based acceptance                                  |

### Hierarchy Endpoints

| Group              | Endpoints | Description                                 |
| ------------------ | --------- | ------------------------------------------- |
| Communities        | 5         | CRUD, duplicate prevention, slug validation |
| Clans              | 6         | CRUD, discovery, statistics, join/leave     |
| SubClans           | 4         | CRUD, duplicate prevention within clan      |
| Clan Requests      | 4         | request, approve, reject, cancel            |
| Clan History       | 4         | version-controlled CRUD                     |
| Community Admins   | 4         | add, remove, update roles                   |
| Community Requests | 4         | request, approve, reject                    |

### Timeline Endpoints

| Group             | Endpoints | Description                                                                         |
| ----------------- | --------- | ----------------------------------------------------------------------------------- |
| Timeline          | 13        | CRUD, calendar, search, feed, stats, publish, cancel                                |
| Event Info        | 9         | Birth, Marriage, Death, Education, Employment, Migration, Military, Award, Business |
| Event Summary     | 3         | generate, update, delete                                                            |
| Event Print       | 2         | generate PDF/JSON, share                                                            |
| Event Comments    | 4         | CRUD, threaded replies                                                              |
| Event Reactions   | 2         | add, remove                                                                         |
| Event Documents   | 3         | upload, list, remove                                                                |
| Event Activity    | 2         | feed, stats                                                                         |
| Event Versions    | 4         | history, diff, rollback                                                             |
| Event Invitations | 3         | send, respond, list                                                                 |
| Event Attendance  | 3         | check-in, QR, export CSV                                                            |

### Supporting Endpoints

| Group         | Endpoints | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| Search        | 1         | Global search across all entities           |
| Notifications | 6         | CRUD, preferences, mark read, mark all read |
| Upload        | 2         | upload (multipart), delete                  |
| Merge         | 4         | preview, execute, undo, history             |
| Duplicates    | 2         | detect, review                              |
| Discovery     | 2         | recommendations, stats                      |
| Health        | 1         | System health check                         |

### Tree Engine Endpoints

_(See [Section 15 — Family Tree Engine](#15-family-tree-engine) for full list)_

---

## 26. Backend Modules

### NestJS Module Summary

| Module                | Status | Description                                                                         |
| --------------------- | ------ | ----------------------------------------------------------------------------------- |
| `AuthModule`          | ✅     | Registration, login, JWT refresh, logout, forgot/reset password, account lockout    |
| `UsersModule`         | ✅     | User CRUD, admin user listing, user statistics                                      |
| `ProfileModule`       | ✅     | Profile CRUD, avatar/cover upload, privacy settings, profile completion, sessions   |
| `FamiliesModule`      | ✅     | Family CRUD, dashboard stats, family limits, admin listing                          |
| `MembersModule`       | ✅     | Member CRUD within a family, duplicate checking, smart invite search                |
| `RelationshipsModule` | ✅     | Relationship creation (cycle detection & validation), listing, deletion             |
| `TimelineModule`      | ✅     | Full timeline CRUD, calendar, feeds, RSVP, reminders, event cancellation/completion |
| `InvitationsModule`   | ✅     | Invitation CRUD with token-based acceptance/decline                                 |
| `NotificationsModule` | ✅     | Notification CRUD, preferences, admin broadcast, analytics                          |
| `ActivitiesModule`    | ✅     | Activity feed, user/family-scoped activity, stats                                   |
| `SearchModule`        | ✅     | Global search across users, members, families, clans, communities                   |
| `MemoriesModule`      | ✅     | Memory CRUD, comments, reactions, stats                                             |
| `MergeModule`         | ✅     | Merge request creation, listing, history                                            |
| `DuplicatesModule`    | ✅     | Duplicate detection and listing                                                     |
| `DiscoveryModule`     | ✅     | Discovery suggestions and stats                                                     |
| `HealthModule`        | ✅     | System health check endpoint                                                        |
| `IdentityModule`      | ✅     | Display ID generation for all entities                                              |
| `TreeModule`          | ✅     | Tree visualization endpoints, layout cache, bookmarks                               |
| `ClansModule`         | ✅     | Clan CRUD, discovery, stats, join/leave, admin management                           |
| `CommunitiesModule`   | ✅     | Community CRUD, admin management, requests                                          |
| `SubClansModule`      | ✅     | Sub-clan CRUD, duplicate prevention                                                 |
| `DocumentVaultModule` | ✅     | Document management, versioning, sharing, collections                               |
| `KnowledgeBaseModule` | ✅     | Wiki/articles, voting, categories                                                   |
| `UploadModule`        | ✅     | File upload with Cloudinary integration                                             |
| `Neo4jModule`         | 🔄     | Graph database sync, kinship calculation, path finding                              |

---

## 27. Frontend Pages & Components

### Shared UI Components

| Component                | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `Button`                 | Primary action button (variants: default, destructive, outline, ghost)                 |
| `Input`                  | Text input with validation                                                             |
| `Textarea`               | Multi-line text input                                                                  |
| `Select`                 | Dropdown select                                                                        |
| `Badge`                  | Status/tag badge (variants: default, success, warning, error)                          |
| `Card`                   | Glass morphism card container                                                          |
| `Modal`                  | Dialog with focus trap                                                                 |
| `Toast`                  | Notification toast (success, error, warning, info)                                     |
| `DataTable`              | Sortable, filterable table                                                             |
| `Tabs`                   | Tab navigation with active indicator                                                   |
| `Stepper`                | Multi-step progress indicator                                                          |
| `Skeleton`               | Loading skeleton (Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar, SkeletonImage) |
| `EmptyState`             | Contextual empty state illustration                                                    |
| `ErrorState`             | Error boundary fallback                                                                |
| `ErrorBoundary`          | React error boundary with fallback UI                                                  |
| `ConnectionStatusBanner` | Visual banner showing API connection status                                            |
| `LazyImage`              | IntersectionObserver lazy loading with blur placeholder                                |
| `VirtualList`            | Window virtualization for 10,000+ items                                                |

### Form Components

| Component             | Description                      |
| --------------------- | -------------------------------- |
| `FormField`           | Labeled input with error display |
| `DatePicker`          | Calendar date picker             |
| `FileUpload`          | Drag-drop file upload            |
| `RichTextEditor`      | WYSIWYG editor                   |
| `LocationPicker`      | Map-based location selector      |
| `TagInput`            | Multi-tag input                  |
| `AccordionFormLayout` | Collapsible section form layout  |
| `ProfessionalWizard`  | Step-by-step wizard              |

### Provider Components

| Component      | Description                                            |
| -------------- | ------------------------------------------------------ |
| `ApiProvider`  | API health context provider with `useApiHealth()` hook |
| `AuthProvider` | Authentication context provider                        |

### Timeline Components

| Component                 | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `EventCard`               | Timeline event card                              |
| `EventDetail`             | Full event detail view (15 tabs)                 |
| `EventForm`               | Generic event create/edit form                   |
| `BirthForm`               | Dedicated birth event form                       |
| `MarriageForm`            | Dedicated marriage event form                    |
| `DeathForm`               | Dedicated death event form                       |
| `EducationForm`           | Dedicated education event form                   |
| `EmploymentForm`          | Dedicated employment event form                  |
| `MigrationForm`           | Dedicated migration event form                   |
| `MilitaryForm`            | Dedicated military event form                    |
| `AwardForm`               | Dedicated award event form                       |
| `BusinessForm`            | Dedicated business event form                    |
| `EngagementForm`          | Dedicated engagement event form (9 sections)     |
| `DivorceForm`             | Dedicated divorce event form (10 sections)       |
| `GraduationForm`          | Dedicated graduation event form (9 sections)     |
| `PromotionForm`           | Dedicated promotion event form (9 sections)      |
| `HousePurchaseForm`       | Dedicated house purchase event form (8 sections) |
| `HajjUmrahForm`           | Dedicated hajj/umrah event form (9 sections)     |
| `MilitaryAchievementForm` | Dedicated military achievement form (8 sections) |
| `BirthdayForm`            | Dedicated birthday event form (8 sections)       |
| `AnniversaryForm`         | Dedicated anniversary event form (8 sections)    |
| `FamilyReunionForm`       | Dedicated family reunion event form (9 sections) |
| `ClanGatheringForm`       | Dedicated clan gathering event form (9 sections) |
| `CommunityEventForm`      | Dedicated community event form (10 sections)     |
| `TimelineFilters`         | Advanced filter panel (10+ dimensions)           |
| `TimelineStats`           | Statistics cards                                 |
| `TimelineSkeleton`        | Skeleton loading states for timeline             |
| `TimelineFilterChips`     | Compact filter chip row                          |
| `TimelineQuickDetails`    | Quick details side panel                         |
| `TimelineEmptyState`      | Empty state illustration                         |
| `TimelineCalendar`        | Calendar views (month, week, day, agenda)        |
| `TimelineSettings`        | Settings panel                                   |
| `EnhancedUploadZone`      | Multi-method upload with per-file progress       |
| `MediaManager`            | Media grid/list with bulk operations             |
| `DocumentManager`         | Document management                              |
| `CommentThread`           | Threaded comments                                |
| `EventSummaryPreview`     | AI summary preview                               |

### Tree Components

| Component                   | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `TreeCanvas`                | SVG-based rendering with zoom/pan (4 layouts)  |
| `TreeControls`              | Toolbar with layout, zoom, color mode controls |
| `TreeSearch`                | Search and highlight nodes                     |
| `TreeDetailPanel`           | Selected node detail view with actions         |
| `TreeMinimap`               | Overview minimap for navigation                |
| `TreeGenerationNavigator`   | Jump to specific generation                    |
| `TreeRelationshipHighlight` | Path/ancestor/descendant highlighting          |
| `TreeStatistics`            | Tree statistics panel                          |

### Utilities & Hooks

| Export                    | Description                       |
| ------------------------- | --------------------------------- |
| `useDebounce`             | Debounce hook (300ms default)     |
| `useIntersectionObserver` | IntersectionObserver hook         |
| `useLocalStorage`         | localStorage hook with SSR safety |
| `useMediaQuery`           | Responsive breakpoint hooks       |
| `api-health-monitor`      | Singleton health monitoring       |
| `api-retry`               | Exponential backoff retry         |
| `api-offline-queue`       | Offline request queue             |

### Analytics Components

| Component           | Description                                         |
| ------------------- | --------------------------------------------------- |
| Analytics Page      | Full dashboard at `/dashboard/timeline/analytics`   |
| Stat Cards          | Total events, members, media, documents with trends |
| Event Type Chart    | Horizontal bar chart (33 types)                     |
| Monthly Trends      | 12-month line chart                                 |
| Most Active Members | Top contributors ranking                            |

### Loading States

| Component        | Description                |
| ---------------- | -------------------------- |
| `PageSkeleton`   | Full page skeleton         |
| `LoadingSpinner` | Spinner for button actions |
| `LoadingOverlay` | Overlay spinner            |
| `EmptyState`     | Contextual empty state     |
| `ErrorState`     | Error with retry           |
| `OfflineState`   | Offline indicator          |
| `NotFoundState`  | 404 state                  |

---

## 28. Admin Panel

| Feature                | Status | Description                            |
| ---------------------- | ------ | -------------------------------------- |
| Admin Auth             | ✅     | X-Admin-Key header authentication      |
| User Listing           | ✅     | List, filter, search users             |
| Family Overview        | ✅     | All families in system                 |
| System Stats           | ✅     | User/family/event counts               |
| Notification Broadcast | ✅     | Send notifications to all users        |
| Notification Analytics | ✅     | Delivery stats, read rates             |
| User Management        | ✅     | Create, update, delete users (via API) |

### Admin Endpoints

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/admin/stats` | System statistics |
| GET    | `/api/users`       | List users        |
| GET    | `/api/users/:id`   | Get user by ID    |
| GET    | `/api/users/stats` | User statistics   |
| PATCH  | `/api/users/:id`   | Update user       |
| DELETE | `/api/users/:id`   | Delete user       |

---

## 29. Docker & Local Development

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16
    ports: ['5432:5432']
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  neo4j:
    image: neo4j:5
    ports: ['7687:7687', '7474:7474']
    environment:
      NEO4J_AUTH: neo4j/password

  # pgbouncer (recommended for production)
  # redis (planned)
```

### Quick Start

```bash
# Prerequisites
# Node.js 22+, pnpm 9+, Docker

# 1. Start PostgreSQL
docker run -d --name docker-postgres-1 -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres

# 2. (Optional) Start Neo4j
docker run -d --name neo4j -p 7687:7687 -p 7474:7474 -e NEO4J_AUTH=neo4j/password neo4j:5

# 3. Install dependencies
pnpm install

# 4. Push database schema
cd apps/api && npx prisma db push && cd ../..

# 5. Start all apps
pnpm run dev
```

### Available Endpoints

| App          | URL                            |
| ------------ | ------------------------------ |
| Web          | http://localhost:4001          |
| API          | http://localhost:4000/api      |
| Swagger Docs | http://localhost:4000/api/docs |
| Admin        | http://localhost:4002          |

---

## 30. Environment Variables

### Root `.env`

```env
NEXT_PUBLIC_APP_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME="Digital Family Tree"
NEXT_PUBLIC_APP_DESCRIPTION="A modern digital family tree platform"
```

### `apps/api/.env`

```env
# Server
PORT=4000
API_PREFIX=api
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/digital_family_tree

# Auth (REQUIRED)
JWT_SECRET=change-this-to-a-random-secret
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=change-this-to-another-random-secret
JWT_REFRESH_EXPIRATION=30d

# CORS
CORS_ORIGIN=http://localhost:4001

# Admin
ADMIN_API_KEY=dft-admin-secret-key-2024

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Neo4j (optional — app runs without these)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

### Admin `.env.local`

```env
NEXT_PUBLIC_ADMIN_API_KEY=dft-admin-secret-key-2024
```

---

## 31. Development Commands

```bash
# Install all dependencies
pnpm install

# Start all apps in development mode
pnpm run dev

# Start individual apps
pnpm --filter @dft/api run dev      # API (port 4000)
pnpm --filter @dft/web run dev      # Web (port 4001)
pnpm --filter @dft/admin run dev    # Admin (port 4002)

# Push Prisma schema to database
cd apps/api && npx prisma db push && cd ../..

# Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# Open Prisma Studio
cd apps/api && npx prisma studio && cd ../..

# Run API tests
cd apps/api && npx jest && cd ../..
```

---

## 32. Build & Production Commands

```bash
# Build all apps
pnpm run build

# Build individual apps
pnpm --filter @dft/api run build
pnpm --filter @dft/web run build
pnpm --filter @dft/admin run build

# Start production
pnpm run start

# TypeScript checks
pnpm --filter @dft/api exec tsc --noEmit
pnpm --filter @dft/web exec tsc --noEmit
pnpm --filter @dft/admin exec tsc --noEmit

# Lint
pnpm --filter @dft/api run lint
pnpm --filter @dft/web run lint
pnpm --filter @dft/admin run lint
```

---

## 33. Testing

### API Unit Tests (Jest)

```powershell
# Run all API tests
cd apps/api && npx jest

# Run specific test file
cd apps/api && npx jest --testPathPattern="kinship.service.spec"

# Run with coverage
cd apps/api && npx jest --coverage
```

### Test Coverage (132 Tests)

| Suite                | Tests   | Description                   |
| -------------------- | ------- | ----------------------------- |
| Kinship Service      | 16      | Kinship score calculation     |
| Relationship Service | 64      | Relationship path algorithms  |
| Graph Traversal      | 8       | Generation label calculation  |
| Cousin Service       | 18      | Cousin relationship detection |
| Path Finding         | 30      | Shortest path in graph        |
| **Total**            | **132** |                               |

### PowerShell Integration Test Suite

```powershell
# Ensure API is running on http://localhost:4000/api
.\test-full-suite.ps1
```

The test script covers:

1. Registration of 3 test users
2. Login/logout flows
3. Family CRUD (3 families, 7 members)
4. Relationship creation with cycle detection
5. Timeline events (CRUD, RSVP, reminders, cancel/complete)
6. Memories with comments and reactions
7. Global search across entity types
8. Admin endpoints via X-Admin-Key
9. Security validation (PII protection, account lockout)

**Historical Result:** 113 PASSED / 0 FAILED / 113 TOTAL (pre-refactoring baseline)

### TypeScript Checks

```powershell
pnpm --filter @dft/api exec tsc --noEmit    # API typecheck
pnpm --filter @dft/web exec tsc --noEmit    # Web typecheck
pnpm --filter @dft/admin exec tsc --noEmit  # Admin typecheck
```

---

## 34. CI/CD Pipeline

### Current Setup

| Stage            | Status | Details                       |
| ---------------- | ------ | ----------------------------- |
| Version Control  | ✅     | Git + GitHub                  |
| Monorepo Tooling | ✅     | pnpm + Turborepo with caching |
| Build            | ✅     | Turbo build for all apps      |
| TypeScript Check | ✅     | tsc --noEmit on all apps      |
| Lint             | 🔄     | ESLint configured             |

### Planned Enhancements

| Feature               | Priority | Description                |
| --------------------- | -------- | -------------------------- |
| GitHub Actions        | High     | Automated CI/CD pipeline   |
| Docker Compose        | High     | Full environment in CI     |
| E2E Tests             | High     | Playwright browser tests   |
| Deployment Automation | Medium   | Auto-deploy to staging     |
| Preview Deployments   | Medium   | Per-branch preview deploys |
| Database Migrations   | Medium   | Automated migration in CI  |

---

## 35. Deployment Guide

### Prerequisites

- **Node.js** 22+
- **pnpm** 9+ (`corepack enable`)
- **Docker** + Docker Compose
- **PostgreSQL** (Docker or managed service)
- **Neo4j** (Docker or AuraDB, optional)
- **Cloudinary** account (for media uploads)

### Production Deployment Steps

```bash
# 1. Clone and install
git clone https://github.com/your-org/digital-family-tree.git
cd digital-family-tree
pnpm install

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with production values

# 3. Build all apps
pnpm run build

# 4. Run database migrations
cd apps/api
npx prisma db push
cd ../..

# 5. Start with process manager (PM2 recommended)
pnpm run start
```

### Production Architecture

```
                         ┌──────────────┐
                         │   CDN/CDN     │
                         │  (Cloudflare) │
                         └──────┬───────┘
                     ┌──────────┴──────────┐
                     │                     │
              ┌──────v──────┐      ┌──────v──────┐
              │    Web      │      │   Admin     │
              │  (PM2/Node) │      │  (PM2/Node) │
              └──────┬──────┘      └──────┬──────┘
                     │                    │
              ┌──────v────────────────────v──────┐
              │         API (PM2 Cluster)         │
              │            Port 4000               │
              └──────┬────────────────────┬───────┘
                     │                    │
              ┌──────v──────┐     ┌──────v──────┐
              │  PostgreSQL  │     │    Neo4j    │
              │  (RDS/DO)    │     │  (AuraDB)   │
              └─────────────┘     └─────────────┘
```

---

## 36. Performance Considerations

### Performance Targets

| Metric             | Target  |
| ------------------ | ------- |
| Dashboard load     | < 500ms |
| Timeline load      | < 1s    |
| Create Event load  | < 500ms |
| Search response    | < 200ms |
| Scroll performance | 60 FPS  |

### Database Optimization

- Composite indexes on all foreign keys
- Transaction wrapping for multi-step operations
- Optimized Prisma includes (only fetch needed relations)
- Response caching via Cache-Control headers
- Cursor-based pagination for deep-page queries

### Frontend Optimization

- Infinite scroll with IntersectionObserver
- Lazy image loading with blur placeholder (LazyImage component)
- Debounced search (300ms)
- Window virtualization (VirtualList for 10,000+ events)
- Framer Motion animations with `prefers-reduced-motion` support
- Skeleton loaders for perceived performance
- Auto-save with debounce (2s delay + 5s interval)
- localStorage for user preferences
- Promise.allSettled for non-blocking parallel fetches

### Media Optimization

- Cloudinary CDN for global delivery
- Automatic image optimization
- Thumbnail generation for grid views
- Lazy loading for images below the fold

### Build Optimization

- Turborepo caching for incremental builds
- pnpm workspace hoisting for shared dependencies

---

## 37. Accessibility & UX Design

### Design System v6

| Feature         | Description                                           |
| --------------- | ----------------------------------------------------- |
| Glass Morphism  | Cards with backdrop blur                              |
| Shadow Layering | sm, md, lg levels                                     |
| Spacing System  | 8pt multiples                                         |
| Typography      | 6 levels: XL, L, M, Body, Small, Caption              |
| Hierarchy       | Container > Section > Card (max 3 levels)             |
| Color Palette   | White, gray-50, gray-100, emerald-500/600 primary     |
| Glass Effect    | `bg-white/80 backdrop-blur-xl border border-white/20` |
| Focus Ring      | Emerald, 2px offset, WCAG compliant                   |

### Accessibility

- Focus-visible ring on all interactive elements (WCAG 2.1 AA)
- Reduced motion support (`prefers-reduced-motion`)
- Skip-to-content link
- Keyboard navigation in wizard forms (Arrow keys, Enter, Escape)
- Semantic HTML structure
- WCAG-compliant color contrast
- Toast notifications with role="alert"

### UX Features

- Toast notifications (success, error, warning, info)
- Modal dialogs with focus trap
- Data tables with sort, filter, pagination
- Tab navigation with active indicator
- Stepper components for multi-step forms
- Prose typography for long-form content
- Dark/light mode support
- RTL-ready architecture
- Responsive design (desktop, tablet, mobile, large screens)
- Error states with retry buttons
- Empty states with CTAs
- Skeleton loaders (no spinners)
- Connection status banner

---

## 38. Completed Features

### ✅ Authentication & Security

- JWT authentication (1h access, 30d refresh)
- Passport.js Local + JWT strategies
- Account lockout (5 failed → 15-min lock)
- Rate limiting (100 req/min per IP)
- Admin API key authentication
- CORS, Helmet security headers
- Input validation (class-validator whitelist)
- Ownership checks on all mutations
- 6-level visibility enforcement (server-side)
- Soft deletes on all entities

### ✅ User & Profile Management

- User registration/login/logout
- Password reset flow
- Profile CRUD with 75+ fields
- Avatar/cover photo upload
- Privacy settings (per-field)
- Session management
- Profile completion scoring

### ✅ Family & Member Management

- Family CRUD with limits
- Member CRUD (30+ profile fields)
- Duplicate checking on member creation
- Smart invite search
- Family dashboard statistics
- Admin-level family listing

### ✅ Relationship System

- 15 relationship types
- Spouse / parent-child relationships
- Cycle detection on relationship creation
- Same-family validation
- Relationship listing and deletion

### ✅ Timeline System (33 Event Types)

- Full CRUD with soft delete
- 33 event types (birth, marriage, death, education, etc.)
- 22 dedicated event forms
- Calendar views (month, week, day, agenda)
- 15 feed types (chronological, importance, family, etc.)
- 13+ filter dimensions
- 9 sort options
- 15-tab event detail view
- RSVP with 7 statuses
- QR code check-in
- Attendance tracking (QR, GPS, photo, admin)
- CSV export of guest lists
- AI-generated event summaries
- Auto-save with debounce
- Print/export (PDF, JSON)
- Share links with QR codes
- Version history with field-level diff and rollback
- Cursor-based pagination
- Infinite scroll

### ✅ Notification Engine

- 9 event lifecycle notification types
- In-app notification center
- Auto-refresh (30s interval)
- Per-user channel preferences
- Read/unread tracking
- Mark all read
- Admin broadcast
- Templates and delivery tracking

### ✅ Activity System

- Chronological activity feed
- User-scoped and family-scoped views
- Activity statistics

### ✅ Search System

- Global search across all entity types
- PII protection
- 10+ filter dimensions
- 9 sort options
- Date presets
- Instant search (300ms debounce)

### ✅ Memories

- CRUD with comments and reactions
- Memory statistics

### ✅ Merge Engine

- Preview merge results
- Execute merge with undo
- Full merge history

### ✅ Duplicate Detection

- Auto-detection
- Review interface
- Accept/reject workflow

### ✅ Discovery Engine

- Recommendations based on shared surnames/locations
- Discovery statistics

### ✅ Clan & Community System

- Full CRUD for communities, clans, sub-clans
- Join request workflow
- Admin management
- Version-controlled history
- Gallery, directory, events, documents, locations
- Reputation scoring
- AI summaries

### ✅ Document Vault

- 25 document types with versioning
- Hierarchical folders
- Tagged collections
- Link sharing with secure tokens, password, expiry
- Verification workflow (4 reviewer types, confidence scoring)
- Galleries (9 types)
- Source references with reliability scoring
- Public pages with SEO metadata
- Knowledge base with voting
- Access audit logs
- Smart organization (auto-tagging, suggestions)
- Timeline integration

### ✅ Tree Engine

- SVG-based interactive tree visualization
- 4 layout algorithms (vertical, horizontal, compact, balanced)
- Zoom, pan, search, highlight
- Generation navigation
- Minimap overview
- Detailed node panel
- Relationship path highlighting
- Common ancestor computation
- Tree diagnostics
- Saved views with layout/position persistence
- Bookmarks and view history
- Layout caching
- Recently added/updated tracking
- SEO metadata for tree views
- "ME" badge for current user

### ✅ API Resilience Layer

- Health monitoring with circuit breaker (30s polling)
- Retry with exponential backoff and jitter
- Offline request queue (localStorage, 50 max, 24h expiry)
- Error boundary (per-section, with retry)
- Connection status banner (connected/reconnecting/offline)

### ✅ Premium UI Components

- Professional wizard forms
- Enhanced upload zone (multi-method, per-file progress)
- Timeline calendar views
- Timeline settings (density, theme, persistence)
- Skeleton loading (shimmer animation, no spinners)
- Framer Motion animations (entry/exit, expand/collapse, stagger)
- Filter chips with animated transitions
- Virtual list for 10,000+ items
- Lazy image loading with blur placeholder
- Glass morphism design system
- Loading states (Page, Empty, Error, Offline, NotFound)

### ✅ Display ID System

- Timestamp + counter strategy for 30+ entity types
- Eliminated sequential ID collisions
- Prefix registry for all entities

---

## 39. Known Limitations

| #   | Issue                                                                              | Severity | Status      |
| --- | ---------------------------------------------------------------------------------- | -------- | ----------- |
| 1   | **Family-centric model** — Person should be root entity for genealogy              | High     | Planned     |
| 2   | **Neo4j not fully integrated** — Services exist but need credentials and full sync | High     | In Progress |
| 3   | **No GEDCOM import/export** — Cannot migrate from Ancestry/MyHeritage              | High     | Planned     |
| 4   | **No real-time WebSocket notifications**                                           | Medium   | Planned     |
| 5   | **No Redis caching layer**                                                         | Medium   | Planned     |
| 6   | **No mobile app (React Native)**                                                   | Medium   | Future      |
| 7   | **No background job queue**                                                        | Medium   | Planned     |
| 8   | **No image compression on client side**                                            | Low      | Planned     |
| 9   | **No offline mode (PWA)**                                                          | Low      | Future      |
| 10  | **No face recognition for attendance**                                             | Low      | Future      |
| 11  | **No DNA integration**                                                             | Medium   | Future      |
| 12  | **No monetization model**                                                          | Medium   | Future      |
| 13  | **No viral loop (referrals, public profiles)**                                     | Medium   | Future      |
| 14  | **0% test coverage on frontend**                                                   | High     | Planned     |
| 15  | **God services** (tree.service.ts 1798 lines, timeline.service.ts 1595 lines)      | Medium   | Planned     |
| 16  | **9 duplicated module pairs** (Clan/Community history, gallery, etc.)              | Medium   | Planned     |
| 17  | **Database migrations not in git**                                                 | High     | Planned     |
| 18  | **JSON overuse in 30+ columns**                                                    | Medium   | Planned     |
| 19  | **No connection pooling (pgBouncer)**                                              | Medium   | Planned     |
| 20  | **No table partitioning for large tables**                                         | Low      | Future      |

---

## 40. Future Roadmap

### High Priority

| #   | Feature                                  | Description                                                |
| --- | ---------------------------------------- | ---------------------------------------------------------- |
| 1   | **Person-Centric Genealogy Model**       | Refactor from Family-centric to Person-centric root entity |
| 2   | **GEDCOM Import/Export**                 | Universal genealogy format for migration                   |
| 3   | **Neo4j Full Integration**               | Complete graph sync and real-time queries                  |
| 4   | **WebSocket Notifications**              | Real-time event lifecycle notifications                    |
| 5   | **Email Verification + Forgot Password** | Auth completeness                                          |
| 6   | **Database Migrations**                  | Version-controlled schema evolution                        |
| 7   | **Redis Caching**                        | Session management, view cache, rate limiting backend      |
| 8   | **Frontend Test Coverage**               | Unit + E2E tests                                           |

### Medium Priority

| #   | Feature                           | Description                                     |
| --- | --------------------------------- | ----------------------------------------------- |
| 9   | **Background Job Queue**          | Async processing (BullMQ/NestJS EventEmitter)   |
| 10  | **GDPR Compliance**               | Data export, account deletion, consent receipts |
| 11  | **Admin Role System**             | Individual admin accounts with RBAC             |
| 12  | **Client-Side Image Compression** | Before upload optimization                      |
| 13  | **Mobile-First Redesign**         | Touch gestures, responsive tree                 |
| 14  | **Relationship Inference**        | Auto-compute degrees, cycle detection           |
| 15  | **Public Profile Cards**          | Shareable family profile links                  |
| 16  | **Viral Loop Features**           | Referral system, claim-your-profile             |

### Low Priority / Future

| #   | Feature                       | Description                                 |
| --- | ----------------------------- | ------------------------------------------- |
| 17  | **Mobile App (React Native)** | Native mobile experience                    |
| 18  | **DNA Integration**           | Partnership with Ancestry/23andMe           |
| 19  | **Face Recognition**          | Photo tagging, attendance verification      |
| 20  | **PWA Offline Mode**          | Offline-capable web app                     |
| 21  | **Monetization**              | Clan-level subscriptions, premium features  |
| 22  | **Table Partitioning**        | For TimelineEvent, EventActivity at scale   |
| 23  | **AI Metadata Generation**    | Embeddings, auto-tagging                    |
| 24  | **Research Mode**             | Academic genealogy research tools           |
| 25  | **Place Gazetteer**           | Standardized place hierarchy with geocoding |

---

## 41. Technical Decisions

### Why Next.js 15 (App Router)?

- Server-side rendering for SEO on public pages
- Static generation for landing pages
- React 19 support
- App Router for nested layouts and server components

### Why NestJS?

- Modular architecture with dependency injection
- TypeScript-first design
- Swagger auto-generation via @nestjs/swagger
- Built-in validation pipe with class-validator
- Guard/interceptor pattern for auth and permissions

### Why PostgreSQL + Prisma?

- Relational integrity for structured data (users, profiles, media)
- Type-safe queries with Prisma client generation
- Migration management with Prisma Migrate
- 93+ models with complex relationships

### Why Neo4j?

- Family trees are inherently graph structures
- Efficient multi-generational traversal without N+1 queries
- Shortest path computation between any two members
- Common ancestor discovery at any depth

### Why Community → Clan → SubClan → Family → Member?

- No competitor supports multi-level social hierarchy
- Maps to real-world structures (Pashtun tribes, Somali clans, etc.)
- Enables granular visibility and access control
- Distinguishes the platform from Western-centric genealogy tools

### Why Timestamp + Counter for Display IDs?

- Eliminated sequential ID constraint failures
- No database round-trip for ID generation
- 46,656 unique IDs per millisecond per process
- Human-readable but unpredictable

### Why pnpm + Turborepo?

- Efficient monorepo management
- Workspace protocol for local package references
- Turborepo caching for incremental builds
- Strict dependency isolation

---

## 42. Development Rules

### Code Quality

- Never duplicate functionality
- Never break existing code
- Responsive design (desktop, tablet, mobile, large screens)
- Dark/light mode support
- RTL-ready architecture
- No hardcoded values
- Migration-safe database changes
- Production-ready code at all times

### Security

- Ownership checks on all mutations
- Server-side visibility enforcement
- Input validation on all endpoints
- No secrets in code
- Never commit .env files

### Architecture

- Controller → Service → Repository pattern
- DTO validation with class-validator
- Transaction wrapping for multi-step operations
- Soft deletes on all entities
- Display IDs on all entities

### Git

- Only commit, amend, push, or create PRs when explicitly requested
- Inspect status, diff, and recent commits before staging
- Write concise commit messages matching repo style
- Never force-push or use interactive flags
- Never commit secrets or API keys

---

_This README is the single source of truth for the Digital Family Tree project. All other documentation has been merged into this file to eliminate redundancy._
