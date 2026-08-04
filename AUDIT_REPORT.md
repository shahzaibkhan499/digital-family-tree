# Digital Family Tree — Full Audit Report

Date: 2026-08-03
Scope: full monorepo (apps/web, apps/api, apps/admin, packages/config, packages/ui, infra, CI).
Status: discovery + toolchain + deep audits + live verification complete. Follow-up session (2026-08-03) FIXED the event-attendance double-prefix 404 and WIRED the owner check-in flow (backend + frontend), verified end-to-end in the running app via Reticle. Session (2026-08-04) FIXED: password-reset token exposure (CRITICAL), permissions/profile visibility `some:{}` leak, admin API key exposure, JWT env/ConfigModule routing, plus a timeline PUBLIC-event regression found during verification. Session (2026-08-05) FIXED: Cloudinary delete-by-URL ownership check, communities request route 404s, event-invitations N+1 + transactions, prod hardening (Swagger gated, `middleware.ts` auth gate, `<Suspense>` in timeline), Neo4j sync wiring + MERGE idempotency + explicit graph-unavailable errors, dead-code removal, docs. All fixes live-verified against the running app (direct API calls; Reticle daemon was DOWN this session — no `reticle gate`).

---

## 1. System Overview

pnpm monorepo (pnpm 9.15.0, turbo 2.3.3, Node 22, husky + commitlint + lint-staged).

| Piece             | Tech                                           | Port | Notes                                                                 |
| ----------------- | ---------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `apps/api`        | NestJS 10 + Prisma 5.22 + PostgreSQL + Neo4j 5 | 4000 | 103 Prisma models; helmet/CORS/throttler/swagger; cookie + bearer JWT |
| `apps/web`        | Next.js 15 + React 19                          | 4001 | App Router; 44 routes; client-heavy                                   |
| `apps/admin`      | Next.js 15 + React 19                          | 4002 | All pages `'use client'`; no auth, relies on X-Admin-Key              |
| `packages/config` | shared config                                  | —    | appConfig, navItems, contactEmail                                     |
| `packages/ui`     | shadcn-style components                        | —    | button/card/badge/navbar/footer/layout/theme-toggle/loader            |
| `gemini-web2api/` | Python Gemini→OpenAI proxy                     | 8081 | EXTERNAL tool, in use — see §8                                        |

Runtime at time of audit: api (PID 17720), web (PID 20312), reticle daemon :4400, gemini-web2api :8081. `.env` files exist on disk. Git tracked only `.env.example`; repo has uncommitted working-tree changes across `apps/api`, `apps/web`, `apps/admin` (CSP, cookies, auth, landing page, dashboards) — see §6.

## 2. Toolchain & Build Status

| Check                            | Result                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS                                                                                                                                                                                                                                                                                                                              |
| `pnpm typecheck` (5 pkgs)        | PASS                                                                                                                                                                                                                                                                                                                              |
| `pnpm lint`                      | FAIL — 4 errors all `no-useless-escape` in `apps/api/src/auth/dto/register.dto.ts:16` (double escape `\[`/`\]`/`\/`). ~480 warnings total, mostly `no-explicit-any`.                                                                                                                                                              |
| `pnpm build`                     | Web PASS (44 routes, 103kB shared). API prebuild `prisma generate` FAILED with EPERM: running dev server holds a lock on `query_engine-windows.dll` (environmental, not a code bug; `nest build` directly produces dist fine; CI/build on non-Windows or when dev server stopped will pass). Admin NOT run (api aborts pipeline). |
| `pnpm test` (api)                | PASS — 4 suites / 152 tests (Neo4J service + merge-scoring)                                                                                                                                                                                                                                                                       |

## 3. DB & Schema (Phase 3)

- **103 models**, **401 @@index**, 26 @@unique blocks, 74 inline @unique, 84 Json columns, 215 @relation.
- **No enums** — every enum is `String @default(...)` (drift risk).
- **No `prisma/migrations/` dir, no seed script.** Schema applied with `prisma db push`. `prisma validate` PASSES with warnings (`SetNull` on required ref).
- Only seeded via app/scripts; test account `test@familytree.com / TestPass123!` (exists, login 201).
- User model holds denormalized `fatherId/motherId/spouseId/childrenIds/siblingIds` as plain strings (no FK integrity).
- `EventPrintVersion` has a relation field literally named `User` (capital).

## 4. Security Findings (from live-checked deep audits — TOP PRIORITY, HIGH)

1. **JWT reset-password account takeover — FIXED ✅ (2026-08-04, live-verified).** Old behavior: `POST /api/auth/forgot-password` returned `201` AND the signed `resetToken` in the response body; no email delivery existed. Fix (`auth.service.ts`): generate `crypto.randomBytes(32).toString('hex')` token, store only SHA-256 hash + 15-min expiry on `User` (`resetTokenHash`, `resetTokenExpiresAt` — schema pushed), deliver out-of-band via an in-app notification with `actionUrl` = `${FRONTEND_URL || 'http://localhost:4001'}/reset-password?token=...`, API response no longer contains any token. `reset-password` validates token length ≥20, hash lookup with expiry, single-use (clears hash/expiry/refreshToken/failed-attempts/lock), bcrypt 12, audit log `PASSWORD_RESET` + notifications. Verified live end-to-end as guest: forgot-password → notification link → reset → login with new password (200) → token reuse rejected (400). Also confirmed the auth throttle works (429 after 3 forgot-password/reset calls per hour).
2. **Admin API key in browser bundle + shared default — FIXED ✅ (2026-08-04).** Old behavior: `apps/admin/lib/admin-api.ts:1` read `NEXT_PUBLIC_ADMIN_API_KEY || 'dft-admin-secret-key-2024'` (hardcoded fallback); the same key lived in `apps/admin/.env`, `.env.local` and root `.env` as `NEXT_PUBLIC_*` (inlined into client bundles) and was sent to `/api/nest/*` from browser JS. Fix: removed the `next.config.ts` rewrite that proxied browser→Nest; added server-side proxy `apps/admin/app/api/nest/[...path]/route.ts` which injects `X-Admin-Key` from server-side `ADMIN_API_KEY` only; `admin-api.ts` no longer sends the key; `NEXT_PUBLIC_ADMIN_API_KEY` removed from all env files; key randomized to a fresh 64-char value in `apps/api/.env` + root `.env` (`.env.example` keeps placeholder); guard now compares with `crypto.timingSafeEqual` (`admin-api-key.guard.ts`). Live-verified: no key → 401, old key → 401, new key → 200 on `/api/users/stats`.
3. **Broken membership visibility filter = privilege escalation — FIXED ✅ (2026-08-04, live-verified).** `common/permissions.service.ts` used `members: { some: { email: undefined } }` / `members: { some: {} }` — Prisma skips `undefined` → matches ANY family with ≥1 member, so every logged-in user saw every family's FAMILY-visibility data (timeline, memories, profile privacy fields, clan/sub-clan/community scoping). Fix: new `getMembershipFamilies(userId)` helper — user's own families (ownerId) PLUS families whose `FamilyMember.email` matches the user's email (`mode: 'insensitive'`); applied to `getClanRole`, `canViewTimelineEvent`, `canViewMemory`, all `getVisible*Ids`. Same leak fixed in `profile.service.ts` (FAMILY-privacy fields) with a `getMembershipFamilyIds` helper. **Regression found while verifying:** `timeline.service.ts:195` early-returned empty when the user had no visible scopes, which (after the fix) hid PUBLIC events from everyone without a family — removed the early return and made the `visibilityConditions` OR list conditional on non-empty id arrays. Live-verified: guest with no membership saw only PUBLIC events (1); after adding a FamilyMember with the guest's email → saw all 7 FAMILY events of that family; after removal → back to 1; cross-family FAMILY events stayed hidden throughout. Test member row deleted after verification.
4. **Arbitrary Cloudinary deletion.** `upload/upload.controller.ts:76-79` accepts any authenticated user's `{ url }` and deletes the asset (any user's avatar/cover/doc). No ownership check. **STILL OPEN — next in queue.**
5. **Weak/guessable JWT secrets in `.env`** (`dft-production-super-secret-jwt-key-2026-...`); `JWT_EXPIRATION=1h` (docs 15m), refresh 30d vs cookie 7d — no alignment/revocation list. **PARTIAL FIX (env routing, 2026-08-04):** the API previously crashed at boot with `secretOrPrivateKey must have a value` whenever it started from the repo root (watch mode / CI) because `apps/api/.env` wasn't loaded — `app.module.ts` `ConfigModule.forRoot` now uses `envFilePath: [<api>/.env, <repo-root>/.env]`, and `JwtModule.registerAsync` + `JWT_REFRESH_SECRET` provider + `jwt.strategy.ts` read secrets lazily via `ConfigService` instead of module-load-time `process.env`. Login verified restored. Weak/guessable VALUES still to be rotated by owner.
6. **Email flow is nonexistent upstream.** Resend/SMTP not wired; invitations return raw `token` in create response. **PARTIAL:** password-reset now delivered via in-app notification channel (out-of-band) — see #1. Invite token in create response still OPEN (invitations contract with FE).

### Security MEDIUM (high volume — key items)

- `@Body('email')`/`@Body()` plain params bypass `class-validator` on `auth`, `users`, `upload`.
- Weak update-password policy (`MinLength(6)`) vs register (10+).
- 10 MB body + `urlencoded({extended:true})`; no `trust proxy` / `X-Forwarded-For` → throttling/IP logging collapse.
- `/api/docs` (Swagger) exposed unconditionally incl. prod; CORS origin fallback includes localhost when unset? — Restrict in prod; HSTS/misc helm well set.
- `catch(() => {})`-style swallow in audit/activity/notifications lanes.
- CSP includes `'unsafe-inline'`/`data:` for styles/img (low-med).

### API — Live contract mismatches (FE ↔ BE, confirmed at runtime)

- **Community request approve/reject/cancel** — FE does `GET/PATCH .../communities/{id}/requests/{requestId}/approve`; backend `communities.controller.ts:188,199,211` has NO `:id` prefix → **404**. (Live-tested: both route shapes 404.) **STILL OPEN.**
- **Event attendance double-prefix — FIXED ✅ (this session).** Backend `event-attendance.controller.ts:5` was `@Controller('api/timeline/events/:eventId/attendance')`; with `setGlobalPrefix('api')` the real route was `/api/api/timeline/...` while FE calls `/api/timeline/events/:eid/attendance` (was live 404). Fix: removed the baked-in `api/` prefix. Verified live: GET attendance/stats, POST check-in/check-out, print/export/info all 200/201 through the FE proxy and in-browser.

## 5. Neo4j Graph Layer (Phase5 — large but mostly ailing)

- `Neo4jModule` + `sync.service` **never wired** (no caller — node crashes if it were). Graph functionality (kinship/cousin/paths, ancestor, tree, graph) exists and the 152 tests cover classification logic, but there is **no controller** — so it's effectively (still) dead from FE. Document/file concerns: no `conflict`/`security` in graph.
- Services good: graph-traversal, kinship, relationship, path, cousin — well covered (4 spec files).
- Errendous: no reconnection (`isConnected()` sticky `false`), raw Cypher via `neo4j-driver` in repositories; index of `CREATE`-vs-`MERGE` matters.

There are abstract, well-factored services, but nothing calls them at runtime: `syncAll` has no invocation path and uses raw `CREATE` (non-idempotent; reruns duplicate edges). Strong recommendation: wire an admin/startup sync entry or delete.

## 6. Frontend/Web quality findings

- High: `apps/web/lib/api-client` + communities controller mismatch (live 404) **STILL OPEN**; attendance prefix (live 404) — **FIXED this session**.
- Fixed this session (pre-existing, discovered during check-in flow wiring): RSVP panel read flat `p.name` while API returns `user.name` (rows showed "Unknown"/"U"); `isOwner` in `[id]/page.tsx` checked `event.userId/organizerId` but API returns `createdById`, so the Check-in button was unreachable for everyone. Both corrected.
- Med: `timeline/page.tsx` uses `useSearchParams` without `<Suspense>` (Next 15 build/route risk); only `/dashboard/layout` and `(auth)/layout` client-side guard — no `middleware.ts`; `localStorage` for tokens (XSS exposure); prod `app/member/[slug]`+`u/[id]` fetch `127.0.0.1:4000` no cache strategy.
- Low: `api-retry.ts`, `use-local-storage`, `use-intersection-observer`, `virtual-list`, `lazy-image` are unused/dead exports; duplicate local `EmptyState`; a11y gaps: icon-only controls with no accessible name, `<img>` missing `alt`.
- Top-10 largest files (some 1,200–1,900 lines).

## 7. Integrations & third-party reality check

- **Search** — Prisma ILIKE + hand-rolled soundex/levenshtein JS + Postgres `fuzzystrmatch`. PII leak: global search returns `email`, `phone`, `govId` to any authenticated user (search.service.ts: select `searchMembers`). Unbounded `limit`.
- **AI insights** — **NO LLM.** `ai-insights.service` is CRUD over `Community/ClanAISummary`; no keys/SDK; FE widget is hard-coded heuristics. Endpoints public-read, any JWT write (no ownership) — content-posing risk.
- **Cloudinary** — only real storage integration. Works (API key/secrete configured), but `public_id`/`overwrite` placed inside `transformation` so avatar overwrite never applies; `MAX_FILE_SIZE` mismatches controller 100MB.
- **Resend/Mapbox/PostHog/Sentry** — **not implemented** (documented only in DEPLOYMENT_GUIDE). Not a bug, but be explicit in docs.
- **Notifications** — real, well-shaped (DB + event + delivery + preferences + queue model `NotificationQueue`) but delivery/preferences are inert; Broadcast admin loops sync (self-DoS risk at scale).
- **Redis** — configured in env/compose but unused.

## 9. Code-quality, performance, maintainability

- God-object services: `tree.service.ts` (1,884 LOC, god), `timeline.service.ts` (1,526), `document-vault.service.ts` (1,043), `merge.service.ts` (910). Controllers with >70 endpoints (`document-vault.controller.ts`).
- **N+1 patterns:** per-family `for`-loop `findUnique`s (invitations.service.ts:23-33), recursive `findMany` per generation in tree/genealogy journeys, clans/community member stats iterate member-by-member, uploads sequential per file. Missing `take` limits on several stats queries (pagination absent).
- **Transactions: only 2 `$transaction` in the backend.** Timeline create/update, merge approve, invitations create, doc `currentVersion` increment are all non-atomic — partial states / version collisions (increment via `update`).
- Duplicated logic: soundex/levenshtein reimplemented in search, duplicates, merge; visibility `some:{} ` scoping repeated across permissions/profile; top-clans vs top-communities duplicated.
- `process.env` read inside services instead of ConfigModule; magic numbers (0.75 thresholds, 5,000-member cap).

## 10. Dependencies/dev-Dep hygiene

- Root pins `@types/express@^5`, `@types/body-parser@^1` while Nest uses `express@^4` — minor drift.
- `apps/api/package-lock.json` present inside a pnpm workspace (would trip pnpm `--frozen-lockfile`?). Recommend pruning. (pnpm workspace full install passed.)
- `scripts/verify-production.ps1` `-RootDir` unused; `gemini*) — see below.

## 11. gemini-web2api folder — verdict: KEEP (not part of monorepo build; external tool) = **DO NOT DELETE**

- Standalone Python (OpenAI-compatible proxy over Gemini) with own `.git`, Dockerfile, Cloudflare Worker deploy, cookie-sync extension, README, 28 files / 0.3MB.
- **It's not bundled into the pnpm workspace, not required by any `package.json`, and not a ghost in `git ls-files`.**
- It IS used by OpenCode config (`~/.config/opencode/opencode.jsonc` provider `gemini-web2api` baseURL `http://localhost:8081/v1`) — the running port 8081 currently serves `/v1/models`. **Deleting it would remove the only working AI bridge this machine uses.** Keep and treat as external.

## 12. Priority remediation order

1. ~~Password reset: out-of-band delivery + token removal from response~~ **DONE ✅ 2026-08-04, live-verified** (SHA-256 single-use token, notification link, reuse rejected).
2. ~~Fix `permissions.service` / `profile.service` visibility predicates~~ **DONE ✅ 2026-08-04, live-verified** (email-based membership; + fixed PUBLIC-event regression in `timeline.service.ts`).
3. ~~Move admin key to server-side env (not `NEXT_PUBLIC_`), randomize; constant-time compare~~ **DONE ✅ 2026-08-04, live-verified** (server-side `/api/nest` proxy route, key rotated, timingSafeEqual).
4. ~~Fix Cloudinary ownership check on delete-by-URL~~ **DONE ✅ 2026-08-04, live-verified** (`upload.service.ts` `assertOwnsUrl`/`deleteFile`, `delete` endpoint takes userId; 403 cross-user, 401 anon, 200 owner).
5. ~~Align FE (`api-client.ts`) ↔ backend routes~~ **DONE ✅ 2026-08-04, live-verified** (attendance `api/` prefix; communities requests now under `:id/requests/:requestId` — full approve/reject/cancel flow + 403 non-admin check passed).
   - Bonus work (previous session, verified): owner check-in flow wired end-to-end — see §4 note below.
6. ~~Route env through `ConfigModule`/`ConfigService`; remove hardcoded JWT defaults~~ **DONE ✅ 2026-08-04** (`envFilePath` from `__dirname`, `JwtModule.registerAsync`, `JWT_REFRESH_SECRET` provider, strategy via ConfigService; boot-from-any-cwd fixed). JWT secret values still to be rotated by owner.
7. ~~Prisma transactions for multi-write flows; N+1 in event invitations~~ **DONE ✅ 2026-08-04, live-verified** (event-invitations: per-family for-loop → single `findMany`; per-user create loop → batched `findUnique` + `createMany` w/ `skipDuplicates` in `$transaction`; stats via `groupBy`. Idempotency + respond + stats verified live). Pagination `take`/`skip` audit for remaining list endpoints: still to review.
8. ~~Swagger off in prod; `middleware.ts` server-side auth gate; `<Suspense>` in timeline page~~ **DONE ✅ 2026-08-05, live-verified** (docs gated by `NODE_ENV !== 'production'`; `apps/web/middleware.ts` gates `/dashboard/:path*` on `auth_token` cookie — 307→/login without, 200 with; cookie synced in `api-client.ts` `setToken`/`removeToken`; timeline page wrapped in `<Suspense>`. Web typecheck + lint clean).
9. ~~Wire or delete the Neo4j `sync` path; add `MERGE` idempotency + explicit "graph unavailable" error~~ **DONE ✅ 2026-08-05, live-verified** (write queries person/family/parent-child/MEMBER_OF/MARRIED_TO/DIVORCED_FROM switched CREATE→MERGE; `SyncService.syncAll` exposed via admin-key-guarded `POST /api/admin/neo4j/sync` — 401 without key, 201 with key returning explicit `{success:false,errors:["Neo4j not connected"]}`; `run`/`readQuery` throw 503 `ServiceUnavailableException` when disconnected; read services keep graceful `isConnected()` fallback since FE tree/profile tabs consume them. Neo4j unit tests: 132 pass).
10. Document email/AI/mapbox gaps; delete dead exports (`api-retry`, `use-local-storage`, virtual-list, etc.). **STILL OPEN.**

## 12b. Implementation plan / queue (2026-08-04 session)

Queue (todowrite) with status:

1. ✅ Password reset token exposure (CRITICAL) — done + verified (see §4.1).
2. ✅ Permissions/profile visibility leak — done + verified (see §4.3).
3. ✅ Admin API key → server-side, randomized, constant-time — done + verified (see §4.2).
4. ✅ Cloudinary ownership check on delete-by-URL — done + verified (see §4).
5. ✅ Communities request approve/reject/cancel 404 — done + verified (full flow incl. 403 for non-admin).
6. ✅ Env via ConfigModule/ConfigService (partially completed as part of task 1 — §4.5).
7. ✅ Event-invitations N+1 + transactions — done + verified (see §12 item 7).
8. ✅ Prod hardening: Swagger off in prod, `middleware.ts` auth gate, `<Suspense>` in timeline page — done + verified (see §12 item 8).
9. ⏳ Neo4j sync wiring/idempotency (wire or delete).
10. ⏳ Docs/dead-code cleanup.
11. ⏳ Final verification (typecheck, lint, browser via Reticle, `reticle gate`).

### Test findings during 2026-08-04 verification

- Auth throttle confirmed working: 3rd `forgot-password`/`reset-password` in the same hour → 429 `ThrottlerException` (by design; used fresh windows for testing).
- Reset token is time-limited: an earlier test failed with 400 "Invalid or expired reset token" because the notification was 16 min old (>15-min expiry) — expected behavior, not a bug.
- API dev process (nest watch) restarts with cwd=repo-root where root `.env` has no JWT keys → boot crash `secretOrPrivateKey must have a value`; fixed via ConfigModule `envFilePath` (task 6). Lesson: always re-test auth after any API restart.
- Timeline PUBLIC regression (see §4.3): caused by the empty-scope early return in `findAll`; fixed and re-verified.
- Test data created during verification and REMOVED after: FamilyMember `c421e04f-...` ("UI Guest", email ui.guest@test.com) in family `25e1867d-...`. Kept (useful for future testing): QA `qa.verify.attendance@test.com / QaTest123!`, guest `ui.guest@test.com / FreshPass789!` (NOTE: password was changed during reset testing; QaTest123! restore attempt hit the throttle — restore before reuse), event `1c5dc9c1-...` "UI Check-in Verification" (PUBLIC, UPCOMING).

## 13. Reticle / regression status

- **Reticle daemon was DOWN on 2026-08-05** (port :4400 no listener; no `reticle` CLI/binary installed — only `@reticlehq/react@2.2.1` instrumentation in node_modules). `reticle gate` could not run. Per AGENTS.md this is reported explicitly instead of skipped silently. Re-verify in browser once the daemon is restarted.
- The two live-verified 404 contract bugs (communities requests approve, event attendance double-prefix) are uncaught by any recorded flow; `reticle verify` currently has 0 saved flows.
- Attendance contract bug: **FIXED and browser-verified** (previous session, via SSE JSON-RPC bridge against the :4400 daemon — event detail → People tab → Check-in mode → guest click → 201/refresh; `reticle_console` clean; `reticle gate` pass).
- 2026-08-05 session fixes verified via direct API calls against the running app: event-invitations create/idempotency/respond/stats; middleware 307→/login without cookie, 200 with; Swagger 200 in dev (gated for prod); `/api/admin/neo4j/sync` 401 without key / 201 with (explicit "Neo4j not connected" SyncResult); genealogy endpoints graceful-fallback; 132 Neo4j unit tests pass; API/web/admin typechecks clean; API lint 0 errors; register DTO regex lint fixed; login with changed password post-throttle verified (full reset lifecycle).

## 14. Open requests for owner

- Confirm whether to keep migrations/`prisma db push` and seed strategy (recommend adding `prisma migrate` + seed).
- Rotate JWT secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`) to strong random values in all env files (values still `dft-production-...` placeholders).
- Remaining low-priority items (§12): docs/dead-code cleanup is DONE 2026-08-05; still open: pagination `take`/`skip` audit for remaining list endpoints, global search PII (email/phone/govId) exposure (search.service.ts), AI-insights write ownership, Redis/notification delivery inert paths — all documented in §7.
- Restart the Reticle daemon to re-run `reticle gate` / browser verification of this session's FE-facing changes (middleware gate, Suspense timeline).
- Test data left in dev DB (kept for regression testing): event `1c5dc9c1-9a1d-493a-8909-16a472ba1e3a` "UI Check-in Verification" (PUBLIC, UPCOMING, created by QA user `1af7cc23-...`); guest account `ui.guest@test.com` (password now `FreshPass789!` — was `QaTest123!` before reset-flow testing; restore with another reset once the hourly throttle clears); QA account `qa.verify.attendance@test.com / QaTest123!`; accepted event-invitation for guest on event `1c5dc9c1-...` (from N+1 fix verification); earlier QA records on event `9e8fa68f-...` incl. marriageInformation row with spouseName "Test Spouse". Admin API key rotated (stored locally in `%TEMP%\opencode\qa\admin-key.txt`; `.env.example` keeps placeholder).
