/* ─── Dynamic transaction store ────────────────────────────────────────────
   Transactions produced by the app itself (successful KHQR transfers) are
   appended here, persisted to localStorage, and surfaced in the account
   statement (AccountDetail list) and its receipt (TransactionDetail).
   Static reference transactions (ids 1–12) stay in their page modules.
────────────────────────────────────────────────────────────────────────────── */

export type TxAvatar = {
  type: 'store' | 'initials';
  color: string;
  text?: string;
};

export type TxStatus = { label: string; time: string };

export type TxDetail = {
  amount: string;
  currency?: 'USD' | 'KHR';
  type: 'debit' | 'credit';
  merchant: string;
  avatar?: TxAvatar;
  status?: TxStatus[];
  fields: { label: string; value: string }[];
};

export type StoredTxn = {
  id: number;
  name: string;
  amount: string;
  currency?: 'USD' | 'KHR';
  type: 'debit' | 'credit';
  avatarType: 'initials' | 'store';
  initials?: string;
  avatarColor?: string;
  hasArrow: boolean;
};

type Persisted = {
  list: StoredTxn[];
  details: Record<string, TxDetail>;
};

const KEY = 'aba.txns.v1';
const INITIAL_ID = 13; // static reference txns occupy ids 1..12

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { list: [], details: {} };
    const parsed = JSON.parse(raw) as Persisted;
    if (!Array.isArray(parsed.list) || !parsed.details) return { list: [], details: {} };
    return parsed;
  } catch {
    return { list: [], details: {} };
  }
}

function save(p: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

let cache: Persisted | null = null;
function store(): Persisted {
  if (!cache) cache = load();
  return cache;
}

/** Dynamic transactions in statement order (newest first). */
export function getDynamicTxns(): StoredTxn[] {
  return [...store().list].sort((a, b) => b.id - a.id);
}

/** Receipt detail for a dynamic transaction id (string form for lookups). */
export function getTxnDetail(txId: string): TxDetail | undefined {
  return store().details[txId];
}

/** Reset dynamic transactions (used by tests). */
export function resetTxns() {
  cache = null;
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

const pad = (n: number) => String(n).padStart(2, '0');

function fmtDateTime(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h12 = d.getHours() % 12 || 12;
  return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function fmtDateHead(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Today's statement date header, e.g. "23 Sep 2026". */
export function todayStatementDate(): string {
  return fmtDateHead(new Date());
}

export type NewTxnInput = {
  name: string;            // recipient merchant name
  amount: string;          // numeric amount as typed (payee/order currency)
  currency: 'USD' | 'KHR'; // payee/order currency
  deductAmount?: string;   // amount actually deducted (account currency)
  deductCurrency?: 'USD' | 'KHR';
  bankName: string;
  bankColor: string;
  bakongId: string;
  accountNumber: string;
  note?: string;
};

/** Append a completed transfer to the statement; returns the stored row. */
export function addTxn(input: NewTxnInput): StoredTxn {
  const s = store();
  const id = Math.max(INITIAL_ID - 1, ...s.list.map((t) => t.id)) + 1;
  const now = new Date();

  const trxId = String(Math.floor(10000000000 + Math.random() * 90000000000));

  const row: StoredTxn = {
    id,
    name: input.name,
    // Statement row shows the amount actually deducted (account currency);
    // e.g. a 28,800 KHR order paid from USD → -7.11 (deductCurrency USD).
    amount: input.deductAmount != null && input.deductCurrency
      ? input.deductCurrency === 'KHR'
        ? `-${Number(input.deductAmount).toLocaleString()}`
        : `-${Number(input.deductAmount).toFixed(2)}`
      : input.currency === 'KHR' ? `-${Number(input.amount).toLocaleString()}` : `-${Number(input.amount).toFixed(2)}`,
    type: 'debit',
    currency: input.deductCurrency ?? input.currency,
    avatarType: 'initials',
    initials: input.name.split(' ').map((n) => n[0]).join('').slice(0, 4),
    avatarColor: input.bankColor,
    hasArrow: true,
  };

  // Receipt template depends on the counterparty bank:
  //  - ABA account → ABA "ABA to ABA" receipt (no timeline, APV/RRN fields)
  //  - other banks  → Bakong cross-bank receipt (timeline + hash/reference)
  const isABA = input.bankName === 'ABA Bank';
  const hash = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const tlTime = `${fmtDateHead(now)} | ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const detail: TxDetail = {
    amount: row.amount,
    currency: input.deductCurrency ?? input.currency,
    type: 'debit',
    merchant: input.name,
    avatar: { type: 'initials', color: input.bankColor, text: row.initials },
    ...(isABA
      ? {
          fields: [
            { label: 'Trx. ID', value: trxId },
            { label: 'Authorization Code', value: `APV-${String(Math.floor(100000 + Math.random() * 900000))}` },
            { label: 'Cambodia time', value: fmtCambodiaTime(now) },
            { label: 'Account#', value: input.accountNumber ? `${input.accountNumber.slice(0, 3)} xxx xxx` : 'xxx xxx xxx' },
            { label: 'Recipient', value: input.name },
            { label: 'Bank', value: input.bankName },
            { label: 'Recipient account', value: input.bakongId },
            { label: 'Clearing time', value: fmtDateTime(now) },
            { label: 'From account', value: 'qiang (150 614 168)' },
            { label: 'Original amount', value: `${input.amount} ${input.currency}` },
            { label: 'RRN#', value: String(Math.floor(1000000000 + Math.random() * 9000000000)) },
            { label: 'Transfer type', value: 'ABA to ABA' },
            ...(input.note ? [{ label: 'Note', value: input.note }] : []),
          ],
        }
      : {
          status: [
            { label: 'Sent',      time: tlTime },
            { label: 'Processed', time: tlTime },
            { label: 'Delivered', time: tlTime },
          ],
          fields: [
            { label: 'Trx. ID', value: trxId },
            { label: 'Bakong hash #', value: hash },
            { label: 'Bank', value: input.bankName },
            { label: 'Recipient account', value: input.bakongId },
            { label: 'From account', value: 'qiang (150 614 168)' },
            { label: 'Original amount', value: `${input.amount} ${input.currency}` },
            { label: 'Reference #', value: `100FT${trxId}` },
            { label: 'Seller', value: input.name },
            { label: 'Transaction date', value: fmtDateTime(now) },
          ],
        }),
  };

  s.list.push(row);
  s.details[String(id)] = detail;
  save(s);
  return row;
}

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "17-SEP-26" style date used by ABA receipts (Cambodia time). */
function fmtCambodiaTime(d: Date): string {
  return `${pad(d.getDate())}-${MONTHS_SHORT[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
}
