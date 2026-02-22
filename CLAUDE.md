# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

There are no test commands — the project does not currently have a test suite.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_API_URL` — Spring Boot backend (default: `http://127.0.0.1:8080`)
- `NEXT_PUBLIC_WS_URL` — WebSocket endpoint (default: `http://127.0.0.1:8080/ws`)
- `AUTH_SECRET` — NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Optional Google OAuth
- `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` — Optional Kakao OAuth

## Architecture Overview

**TableMaster** is a venue/table management system for staff and admins, built with Next.js 16 App Router.

### Route Structure & Role-Based Access

`src/proxy.ts` (the Next.js middleware) enforces role-based routing:
- `/login`, `/signup` — public
- `/staff/*` — requires `ROLE_STAFF` or `ROLE_ADMIN`
- `/admin/*` — requires `ROLE_ADMIN` only
- `/` — redirects logged-in users to their role's dashboard

Two separate app sections each have their own layout with their own sidebar:
- `src/app/staff/` — staff dashboard, entry registration, table management, chat monitor, moderation, stats
- `src/app/admin/` — admin dashboard, device management, profile

### Authentication Flow

`src/auth.ts` configures NextAuth v5 (beta) with a JWT strategy:
1. Credentials login POSTs to `/api/v1/auth/login` on the Spring Boot backend
2. The backend returns `accessToken` (JWT) + `refreshToken`; user info is decoded from the JWT payload
3. Tokens are stored in the NextAuth JWT; access tokens refresh automatically 5 minutes before expiry via `/api/v1/auth/refresh`
4. `SessionExpiredHandler` (`src/components/session-expired-handler.tsx`) detects `RefreshTokenError` in the session and redirects to `/login` after showing a toast

### Real-Time Updates (WebSocket)

`AdminNotificationProvider` (`src/components/providers/admin-notification-provider.tsx`) is the central real-time system, mounted in the root layout for all authenticated users:
- Connects via STOMP over SockJS (`src/lib/websocket/stomp-client.ts`) using the access token as a Bearer header
- Subscribes to `/topic/role.ADMIN` (admin-only device notifications) and `/topic/tables` (shared table delta updates)
- On table events (`TABLE_ADDED`, `TABLE_REMOVED`, `TABLE_UPDATED`), it directly mutates the TanStack Query cache — no full refetch needed
- Reconnects automatically when the access token changes

### Data Fetching Pattern

TanStack Query is used for all server state:
- `src/hooks/use-tables.ts` — `useTables()`, `useTable()`, `useDeleteTable()`
- `src/hooks/use-admin.ts` — `useDevices()`, `usePendingDevices()`, etc.
- API clients live in `src/lib/api/` — each file exports typed fetch functions that attach `Authorization: Bearer <token>` via `getSession()`
- WebSocket deltas update the TanStack Query cache directly, so UI stays reactive without polling

### UI Component System

- `src/components/ui/` — shadcn/ui primitives (do not edit these directly; re-add via `npx shadcn@latest add <component>`)
- `src/components/dashboard/staff/` and `src/components/dashboard/admin/` — feature components for each role's dashboard
- Icons from `@tabler/icons-react` (preferred) and `lucide-react`
- Styling: Tailwind CSS v4, `cn()` utility from `src/lib/utils.ts` for conditional class merging

### Internationalization

`src/lib/i18n/` provides a minimal i18n utility with Korean (`ko`) and Vietnamese (`vi`) locale files. Use `getTranslations(locale)` to get a typed `Translations` object and the `t()` helper for variable interpolation.

### Form Validation

Signup/login forms use `react-hook-form` + `zod`. Schemas are generated dynamically from a `ValidationConfig` (fetched from the backend) via `src/lib/validation/schemas.ts`, so validation rules mirror backend constraints.

### Path Aliases

`@/` maps to `src/` (configured in `tsconfig.json`).

## Build
* 디벨롭 모드로 개발 중이니 빌드는 따로 하지 말 것 명령 이후 변경사항 요약만
* 임의로 커밋, 푸시 하지말 것