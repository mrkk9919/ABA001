CREATE TYPE "public"."account_type" AS ENUM('savings', 'checking', 'mobile', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('aba', 'khqr', 'payway', 'manual', 'import');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit', 'refund', 'fee', 'transfer');--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"account_name" text NOT NULL,
	"masked_number" text NOT NULL,
	"account_type" "account_type" DEFAULT 'savings' NOT NULL,
	"currency" text NOT NULL,
	"current_balance" numeric(20, 4) DEFAULT '0' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'completed' NOT NULL,
	"source" "transaction_source" DEFAULT 'manual' NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"currency" text NOT NULL,
	"balance_after" numeric(20, 4),
	"counterparty_name" text,
	"counterparty_account" text,
	"merchant_name" text,
	"description" text,
	"reference_number" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"phone" text,
	"email" text,
	"avatar_url" text,
	"pin_hash" text,
	"theme_id" text DEFAULT 'sixties' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_accounts_user_idx" ON "bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_user_provider_number_unique" ON "bank_accounts" USING btree ("user_id","provider","masked_number");--> statement-breakpoint
CREATE INDEX "bank_transactions_user_occurred_idx" ON "bank_transactions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "bank_transactions_account_occurred_idx" ON "bank_transactions" USING btree ("account_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transactions_account_reference_unique" ON "bank_transactions" USING btree ("account_id","reference_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");