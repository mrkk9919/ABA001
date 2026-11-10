import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const accountTypeEnum = pgEnum('account_type', ['savings', 'checking', 'mobile', 'other']);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'credit',
  'debit',
  'refund',
  'fee',
  'transfer',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'reversed',
]);
export const transactionSourceEnum = pgEnum('transaction_source', [
  'aba',
  'khqr',
  'payway',
  'manual',
  'import',
]);
export const bankConnectionStatusEnum = pgEnum('bank_connection_status', [
  'pending',
  'connected',
  'expired',
  'revoked',
  'error',
]);

/** Application user. Never store a raw PIN or password here. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    email: text('email'),
    avatarUrl: text('avatar_url'),
    appPaymentPinHash: text('app_payment_pin_hash'),
    themeId: text('theme_id').default('sixties').notNull(),
    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_phone_unique').on(table.phone),
  ],
);

/**
 * Bank OAuth/API connection metadata. Store ciphertext only; the encryption
 * key belongs in a deployment secret manager and never in PostgreSQL or Git.
 */
export const bankConnections = pgTable(
  'bank_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    externalCustomerId: text('external_customer_id'),
    status: bankConnectionStatusEnum('status').default('pending').notNull(),
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bank_connections_user_idx').on(table.userId),
    uniqueIndex('bank_connections_user_provider_unique').on(table.userId, table.provider),
  ],
);

/** Bank or mobile-money account belonging to a user. */
export const bankAccounts = pgTable(
  'bank_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    accountName: text('account_name').notNull(),
    maskedNumber: text('masked_number').notNull(),
    accountType: accountTypeEnum('account_type').default('savings').notNull(),
    currency: text('currency').notNull(),
    currentBalance: decimal('current_balance', { precision: 20, scale: 4 }).default('0').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bank_accounts_user_idx').on(table.userId),
    uniqueIndex('bank_accounts_user_provider_number_unique').on(
      table.userId,
      table.provider,
      table.maskedNumber,
    ),
  ],
);

/** Immutable bank statement entry. Corrections should be represented by a reversal row. */
export const bankTransactions = pgTable(
  'bank_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    status: transactionStatusEnum('status').default('completed').notNull(),
    source: transactionSourceEnum('source').default('manual').notNull(),
    amount: decimal('amount', { precision: 20, scale: 4 }).notNull(),
    currency: text('currency').notNull(),
    balanceAfter: decimal('balance_after', { precision: 20, scale: 4 }),
    counterpartyName: text('counterparty_name'),
    counterpartyAccount: text('counterparty_account'),
    merchantName: text('merchant_name'),
    description: text('description'),
    referenceNumber: text('reference_number'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bank_transactions_user_occurred_idx').on(table.userId, table.occurredAt),
    index('bank_transactions_account_occurred_idx').on(table.accountId, table.occurredAt),
    uniqueIndex('bank_transactions_account_reference_unique').on(table.accountId, table.referenceNumber),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type NewBankTransaction = typeof bankTransactions.$inferInsert;
