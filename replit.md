# ABA Mobile Banking Clone

A pixel-faithful web recreation of the ABA Bank (Cambodia) mobile app UI, built page-by-page from the user's phone screenshots inside a phone-frame layout.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/aba-mobile/src/pages/` — one file per screen
- `artifacts/aba-mobile/src/App.tsx` — wouter routes
- `artifacts/aba-mobile/src/index.css` — Noto Sans Khmer font stack, ABA red `#E8002D`, `.hide-scrollbar` utility

## Product

- UI clone of the ABA Mobile banking app with real Bakong account lookup, transfers, QR receive, payments and international remittance screens.
- All pages match the user's reference screenshots in Khmer (ភាសាខ្មែរ).
