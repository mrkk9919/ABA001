/* ─── Shared account data ────────────────────────────────────────────────────
   Single source of truth for all account balances and metadata.
   Edit here and every page (Home, Accounts, AccountDetail) stays in sync.
────────────────────────────────────────────────────────────────────────────── */

export type Account = {
  id: string;
  name: string;
  number: string;
  type: string;
  balance: string | null;   // null = balance not shown (e.g. Mobile account)
  currency: string;
  card: string;             // masked card number shown in detail view
  color: string;            // accent / border colour
  borderColor: string;      // alias kept for Accounts list card
  badge: { label: string; color: string } | null;
  cardType: 'flag' | 'visa' | 'flag-visa' | null;
};

export const accounts: Account[] = [
  {
    id: '1',
    name: 'qiang',
    number: '150 614 168',
    type: 'Mobile Savings',
    badge: { label: 'គណនីគោល', color: 'bg-[#E8002D] text-white' },
    cardType: 'flag-visa',
    balance: '12087.00',
    currency: 'USD',
    card: '*858',
    color: '#29AEFF',
    borderColor: '#29AEFF',
  },
  {
    id: '2',
    name: 'Perinal Account',
    number: '000 233 604',
    type: 'Savings',
    badge: { label: 'គ្មានការប្រាក់', color: 'bg-[#16A34A] text-white' },
    cardType: 'visa',
    balance: '0.00',
    currency: 'USD',
    card: '*442',
    color: '#9B59B6',
    borderColor: '#9B59B6',
  },
  {
    id: '5',
    name: 'qiang KHR',
    number: '600 980 842',
    type: 'Mobile Savings',
    badge: null,
    cardType: null,
    balance: '20000000.00',
    currency: 'KHR',
    card: '*842',
    color: '#C8102E',
    borderColor: '#C8102E',
  },
];

/** The default account shown on the Home balance card. */
export const defaultAccount = accounts.find((a) => a.badge?.label === 'គណនីគោល') ?? accounts[0];

/**
 * Total available balance shown on the Accounts ring chart.
 * Computed as the sum of all non-null USD balances, formatted to 2 dp.
 * (KHR accounts are displayed separately in their own currency.)
 */
export const totalAvailableUSD: string = accounts
  .filter((a) => a.currency === 'USD')
  .reduce((sum, a) => sum + (a.balance !== null ? parseFloat(a.balance) : 0), 0)
  .toFixed(2);