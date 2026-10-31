import {
  mysqlTable,
  int,
  bigint,
  varchar,
  text,
  decimal,
  smallint,
  timestamp
} from "drizzle-orm/mysql-core"

// 用户表
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 128 }),
  status: smallint("status").default(1),
  createdAt: timestamp("created_at").defaultNow()
})

// 账户表
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 128 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  balance: decimal("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  accountNo: varchar("account_no", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow()
})

// 交易流水表
export const transactions = mysqlTable("transactions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  fromAccountId: int("from_account_id").notNull().references(() => accounts.id),
  toAccountNo: varchar("to_account_no", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  channel: varchar("channel", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("success"),
  remark: varchar("remark", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
})

// 通知表
export const notifications = mysqlTable("notifications", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  isRead: smallint("is_read").default(0),
  createdAt: timestamp("created_at").defaultNow()
})

export type User = typeof users.$inferSelect
export type Account = typeof accounts.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Notification = typeof notifications.$inferSelect
