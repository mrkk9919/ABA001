/* ─── Balance store ────────────────────────────────────────────────────────
   Keeps account balances in sync with completed transfers: every successful
   transfer deducts the outbound amount from the payer account balance.
   Static seed balances live in src/data/accounts.ts; this module overlays the
   accumulated deduction on top of them and persists it to localStorage.
────────────────────────────────────────────────────────────────────────────── */

const KEY = 'aba.balance.v3'; // v3: seed balance updated to 12,087 USD

type Ledger = Record<string, number>; // accountId -> total deducted (USD numeric)

function load(): Ledger {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Ledger;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function save(l: Ledger) {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* storage unavailable */ }
}

let cache: Ledger | null = null;
function ledger(): Ledger {
  if (!cache) cache = load();
  return cache;
}

/**
 * Deduct an outbound USD amount from an account's balance.
 * @param accountId account id (see src/data/accounts.ts)
 * @param amountUsd numeric amount to deduct (positive number)
 */
export function deductBalance(accountId: string, amountUsd: number): number {
  const l = ledger();
  l[accountId] = (l[accountId] ?? 0) + Number(amountUsd);
  save(l);
  return l[accountId];
}

/** Effective balance = static seed balance minus accumulated deductions. */
export function getBalance(accountId: string, staticBalance: string | null): string | null {
  if (staticBalance === null) return null;
  const seed = Number(staticBalance) || 0;
  const total = seed - (ledger()[accountId] ?? 0);
  return total.toFixed(2);
}

/** Reset deductions (used by tests). */
export function resetBalances() {
  cache = null;
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
