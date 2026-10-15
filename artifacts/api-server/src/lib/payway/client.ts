import crypto from "node:crypto";
import { paywayConfig } from "./config";

/**
 * ABA PayWay V2 client (sandbox / production).
 * Hash = base64(HMAC-SHA512(message, apiKey)); apiKey is the 40-char Public Key.
 */

/** UTC timestamp in YYYYmmddHis. */
export function reqTime(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}` +
    `${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}`
  );
}

export function hmacSha512(message: string, key: string): string {
  return crypto.createHmac("sha512", key).update(message, "utf8").digest("base64");
}

/**
 * Purchase hash: fixed concatenation sequence defined by ABA:
 * req_time + merchant_id + tran_id + amount + items + shipping + ctid + pwt +
 * firstname + lastname + email + phone + type + payment_option + return_url +
 * cancel_url + continue_success_url + return_deeplink + currency +
 * custom_fields + return_params  (empty optional fields are skipped).
 */
const PURCHASE_ORDER = [
  "req_time",
  "merchant_id",
  "tran_id",
  "amount",
  "items",
  "shipping",
  "ctid",
  "pwt",
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "payment_option",
  "return_url",
  "cancel_url",
  "continue_success_url",
  "return_deeplink",
  "currency",
  "custom_fields",
  "return_params",
];

export function buildPurchaseHash(fields: Record<string, string>): string {
  const str = PURCHASE_ORDER.map((k) => fields[k] ?? "").join("");
  return hmacSha512(str, paywayConfig.apiKey);
}

/**
 * Check-transaction hash: request parameters &-joined with
 * key=value pairs, sorted by parameter name in ascending order.
 */
export function buildCheckHash(fields: Record<string, string>): string {
  const str = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("&");
  return hmacSha512(str, paywayConfig.apiKey);
}

export interface PurchaseParams {
  tranId: string;
  amount: number;
  currency: "USD" | "KHR";
  items?: Array<{ name: string; quantity: string; price: string }>;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** abapay = browser checkout form; abapay_khqr_deeplink = ABA app deeplink. */
  paymentOption: "abapay" | "abapay_khqr_deeplink";
  returnUrl?: string;
  cancelUrl?: string;
  continueSuccessUrl?: string;
}

/**
 * Build the full purchase field set (with hash). Used both for the server-side
 * POST (deeplink) and for returning a signed browser form (abapay).
 */
export function buildPurchaseFields(params: PurchaseParams): Record<string, string> {
  const fields: Record<string, string> = {
    req_time: reqTime(),
    merchant_id: paywayConfig.merchantId,
    tran_id: params.tranId,
    amount:
      params.currency === "KHR"
        ? String(Math.round(params.amount))
        : Number(params.amount).toFixed(2),
    type: "purchase",
    payment_option: params.paymentOption,
    currency: params.currency,
  };
  if (params.items?.length) {
    fields.items = Buffer.from(JSON.stringify(params.items), "utf8").toString("base64");
  }
  if (params.firstName) fields.firstname = params.firstName;
  if (params.lastName) fields.lastname = params.lastName;
  if (params.email) fields.email = params.email;
  if (params.phone) fields.phone = params.phone;
  if (params.returnUrl) fields.return_url = params.returnUrl;
  if (params.cancelUrl) fields.cancel_url = params.cancelUrl;
  if (params.continueSuccessUrl) fields.continue_success_url = params.continueSuccessUrl;
  fields.hash = buildPurchaseHash(fields);
  return fields;
}

export async function createPurchase(params: PurchaseParams): Promise<{
  status: number;
  body: string;
  json: any;
}> {
  const fields = buildPurchaseFields(params);

  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== "") form.append(k, v);
  }

  const res = await fetch(
    `${paywayConfig.baseUrl}/api/payment-gateway/v1/payments/purchase`,
    {
      method: "POST",
      headers: { language: "en", Referer: paywayConfig.baseUrl },
      body: form,
      signal: AbortSignal.timeout(15_000),
    },
  );
  const body = await res.text();
  let json: any = null;
  try { json = JSON.parse(body); } catch { /* HTML / form response */ }
  return { status: res.status, body, json };
}

export async function checkTransaction(tranId: string): Promise<{
  status: number;
  json: any;
}> {
  const fields: Record<string, string> = {
    req_time: reqTime(),
    merchant_id: paywayConfig.merchantId,
    tran_id: tranId,
  };
  fields.hash = buildCheckHash(fields);

  const res = await fetch(
    `${paywayConfig.baseUrl}/api/payment-gateway/v1/payments/check-transaction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", language: "en" },
      body: new URLSearchParams(fields).toString(),
      signal: AbortSignal.timeout(15_000),
    },
  );
  const body = await res.text();
  let json: any = null;
  try { json = JSON.parse(body); } catch { /* ignore */ }
  return { status: res.status, json };
}

/** Incoming-funds range query: PayWay reconciliation (credited/入账) statement. */
export async function reconciliation(fromDate: string, toDate: string): Promise<{
  status: number;
  body: string;
  json: any;
}> {
  const fields: Record<string, string> = {
    req_time: reqTime(),
    merchant_id: paywayConfig.merchantId,
    from_date: fromDate,
    to_date: toDate,
  };
  fields.hash = buildCheckHash(fields);

  const res = await fetch(
    `${paywayConfig.baseUrl}/api/payment-gateway/v1/payments/reconciliation`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", language: "en" },
      body: new URLSearchParams(fields).toString(),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const body = await res.text();
  let json: any = null;
  try { json = JSON.parse(body); } catch { /* ignore */ }
  return { status: res.status, body, json };
}

/** Incoming-funds range query: PayWay search-transaction (入账交易搜索). */
export async function searchTransaction(fromDate: string, toDate: string): Promise<{
  status: number;
  body: string;
  json: any;
}> {
  const fields: Record<string, string> = {
    req_time: reqTime(),
    merchant_id: paywayConfig.merchantId,
    from_date: fromDate,
    to_date: toDate,
  };
  fields.hash = buildCheckHash(fields);

  const res = await fetch(
    `${paywayConfig.baseUrl}/api/payment-gateway/v1/payments/search-transaction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", language: "en" },
      body: new URLSearchParams(fields).toString(),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const body = await res.text();
  let json: any = null;
  try { json = JSON.parse(body); } catch { /* ignore */ }
  return { status: res.status, body, json };
}

export { paywayConfig };
