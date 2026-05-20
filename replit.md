# AlphaTrade Pro

Premium stock recommendation platform for India with daily picks, P&L tracking, and ₹2000/month subscription.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 at `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo + React Native (web preview at `/`)
- Admin: React + Vite + Tailwind + shadcn/ui (at `/admin/`)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle DB schema (users, recommendations, payments, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/mobile-app/app/` — Expo screens (auth, tabs, detail)
- `artifacts/mobile-app/contexts/AuthContext.tsx` — JWT auth state
- `artifacts/admin-dashboard/src/pages/` — Admin dashboard pages

## Architecture decisions

- JWT auth stored in AsyncStorage (mobile) / localStorage (admin). `SESSION_SECRET` env var is the JWT secret.
- Subscription tiers: `trial` (30 days from signup, free), `premium` (₹2000/month via Razorpay), `expired`.
- Payments via Razorpay. Env vars needed: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- API first: all endpoints defined in OpenAPI spec, code generated from it.
- Admin user must have `is_admin = true` in DB. Default admin: phone `9999999999`, password `Admin@123`.

## Product

- **Mobile app** (`/`): Expo app for end users — login/register, today's stock picks, history, analytics, subscription management.
- **Admin dashboard** (`/admin/`): React dashboard for admins — manage users, post recommendations, update P&L, view analytics, send push notifications.
- **API** (`/api`): Express backend with auth, recommendations, analytics, payments, notifications, subscriptions.

## Demo Credentials

- Admin: phone `9999999999`, password `Admin@123`
- User (trial): phone `9876543210`, password `User@123`
- User (premium): phone `9876543211`, password `User@123`

## User preferences

- Dark navy + emerald green finance theme throughout
- India-first: INR prices, NSE symbols, Indian number formatting

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the server depends on compiled lib declarations.
- Drizzle schema uses camelCase in TS (`pnlPercent`), snake_case in DB (`pnl_percent`).
- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` instead.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` env vars not yet set — payments will create orders but Razorpay SDK integration needs these.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
