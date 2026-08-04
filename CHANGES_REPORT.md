# Digital Family Tree — Complete Change Report

## Commits

| Hash        | Description                                              |
| ----------- | -------------------------------------------------------- |
| `1cea923`   | fix(api): generate Prisma client before build            |
| `6227a2c`   | fix(api): generate Prisma client before build            |
| _(current)_ | fix(api): `import * as cookieParser` for CommonJS compat |

## Phase 0 — Security Foundation

- **`.env.example`** — cleaned placeholder values (no live creds)
- **`register.dto.ts`** — strong password validation: `@Matches` regex, min 10, max 128 chars
- **`auth.service.ts`** — bcrypt 10→12; audit logging events: REGISTER, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REUSE_DETECTED, PASSWORD_RESET, ACCOUNT_LOCKED
- **Token reuse detection** — invalidates all sessions on reuse
- **Reset token** — uses `RESET_TOKEN_SECRET` + `RESET_TOKEN_EXPIRATION`
- **`main.ts`** — Helmet CSP + HSTS + referrer-policy + XSS + frameguard
- **Rate limits** — register 3/60s, login 5/15min, refresh 10/60s, forgot-password 3/1h, reset-password 5/15min

## Phase 1 — Full Authentication

- **`main.ts`** — added `cookie-parser` middleware; Helmet config with HSTS/CSP
- **`jwt.strategy.ts`** — dual token extraction: `req.cookies.access_token` AND `Authorization: Bearer`
- **`auth.controller.ts`** — sets/clears HttpOnly+Secure+SameSite cookies on register/login/refresh/logout; `changePassword` endpoint with bcrypt 12 + token rotation + audit log
- **`users.service.ts`** — bcrypt 10→12 + audit log on password change
- **`auth.module.ts`** — removed `UsersModule` from imports
- **Frontend `api-client.ts`** — `credentials: 'include'` on all fetch calls; auto-refresh loop guard (`!endpoint.includes('/refresh')`)
- **Frontend `auth-context.tsx`** — cookie-based session management

## Phase 2 — Landing Page (Production)

- **`hero.tsx`** — staggered animations + stats (Trees Created / Family Members / Data Protection)
- **`features.tsx`** — Apple-style expandable accordion: Interactive SVG Tree, Rich Timeline (33 events), Document Vault, Granular Privacy, Clan & Community, Smart Discovery
- **`how-it-works.tsx`** — showcase-style hover+expand cards
- **`technology.tsx`** → renamed to **`why-choose-us.tsx`** — premium gradient cards (Performance, Security, Generations, Design, Media, Timelines)
- **`roadmap.tsx`** → replaced with **`testimonials.tsx`** section
- **`faq.tsx`** — production FAQ (removed early-development Q&A)
- **`footer-section.tsx`** — updated links; removed "early development" language
- **`navItems`** in `packages/config/src/index.ts` — removed Roadmap, added Benefits

## Phase 3 — Dashboard Shell

- **Outer `(dashboard)/layout.tsx`** — auth protection with `router.replace('/login')`, spinner+label loading state, returns `null` after redirect
- **Inner `dashboard/layout.tsx`** — skeleton sidebar + 3-column content grid with `SkeletonCards`
- **`ErrorBoundary`** — wrapping page content
- **`window.location.href` → `router.replace()`** for SPA-friendly redirects
- **`filterByRole`** — now supports `orRoles` attribute for OR-logic role matching

## Render Build Fixes

- **`apps/api/package.json`** — added `"prebuild": "prisma generate"` (line 6)
- **`render.yaml`** — buildCommand updated
- **`@types/express@^5.0.0`** and **`@types/body-parser@^1.19.0`** — added as direct devDependencies (lines 47-48)

## Current Fix (this session)

- **`apps/api/src/main.ts:5`** — changed `import cookieParser from 'cookie-parser'` to `import * as cookieParser from 'cookie-parser'` to fix CommonJS compatibility at runtime

## Test Account

- **Email:** `test@familytree.com`
- **Password:** `TestPass123!`
- **Role:** USER
- **Plan:** free
- **API:** http://localhost:4000/api
- **Web App:** http://localhost:4001
