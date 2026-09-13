# SkillSwap

SkillSwap is a responsive peer-to-peer college skill exchange app where students teach what they know, learn what they need, and connect with complementary partners.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `pnpm --filter @workspace/skillswap run typecheck` — check the SkillSwap frontend
- `PORT=21899 BASE_PATH=/ pnpm --filter @workspace/skillswap run build` — build the frontend outside its managed workflow

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/skillswap/src/App.tsx` — route-aware application shell, auth demo, protected navigation, and feature screens
- `artifacts/skillswap/src/lib/skillswap-data.ts` — typed demo domain, seed data, matching logic, and localStorage persistence
- `artifacts/skillswap/src/index.css` — SkillSwap visual tokens, typography, responsive styling, and motion
- `artifacts/skillswap/.replit-artifact/artifact.toml` — app preview and workflow configuration

## Architecture decisions

- The first release is frontend-first and uses localStorage so every core demo action works without requiring a backend connection.
- Domain data and persistence helpers are isolated from the route UI so a future Django + MySQL service layer can replace them without redesigning screens.
- Wouter provides lightweight route handling while the app keeps the landing/auth experience separate from the protected dashboard shell.

## Product

- Landing and auth demo flows with visible evaluation credentials
- Dashboard with skill statistics, recommended partners, and complementary match explanations
- Searchable discovery, profile pages, teach/learn skill CRUD, request lifecycle, chat, scheduling, feedback, notifications, settings, and admin overview
- Responsive navigation and responsive layouts for desktop, tablet, and mobile

## User preferences

No persistent user preferences have been specified.

## Gotchas

- The frontend build expects `PORT` and `BASE_PATH`; the managed workflow supplies them automatically.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
