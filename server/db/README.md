# ABA001 database layer

This directory contains the PostgreSQL schema for user information, bank accounts, and bank statement transactions. It uses Drizzle ORM and is intentionally kept outside the Vite client bundle so `DATABASE_URL` is never exposed to GitHub Pages visitors.

## Tables

- `users`: display identity, contact fields, theme preference, app payment PIN hash, and login lockout state. Never store a raw PIN or bank password.
- `bank_connections`: bank provider, connection status, external customer ID, and encrypted OAuth/API token ciphertext. The encryption key must live in a deployment secret manager, never in PostgreSQL, Git, or the browser.
- `bank_accounts`: provider, masked account number, currency, current balance, and primary-account flag.
- `bank_transactions`: immutable statement entries with amount, currency, balance after, counterparty, reference, status, source, and occurrence time.

## Setup

1. Copy `.env.example` to `.env` in a trusted server/deployment environment.
2. Set `DATABASE_URL` to the Neon PostgreSQL connection string. Do not commit `.env`.
3. Generate a migration with `pnpm db:generate`.
4. Apply migrations with `pnpm db:migrate`.

GitHub Pages is static hosting, so the browser must not connect directly to PostgreSQL. A server or serverless API must call `server/db/client.ts` and expose only authenticated, validated endpoints. This change prepares the database layer; it does not claim to connect to a real bank or fetch live bank transactions. Live statement data requires an authorized bank API or a controlled import flow. Do not collect or store an ABA/online-banking password; use the bank's official OAuth/API authorization flow instead.
