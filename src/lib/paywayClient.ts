/**
 * Frontend client for the ABA PayWay gateway (artifacts/api-server).
 *
 * The gateway holds the merchant credentials and signs every request, so the
 * API key / RSA keys never reach the browser. When the gateway is unreachable
 * (static preview without backend), calls degrade to local fallbacks.
 */

const GATEWAY_BASE: string =
  (import.meta.env.VITE_BAKONG_GATEWAY_URL as string | undefined) || "/api";

export interface PayWayStatus {
  reachable: boolean;
  mode: "mock" | "live";
  configured: boolean;
  merchantId?: string | null;
  baseUrl?: string;
}

export interface PayWayInitiateResult {
  mode: "mock" | "form" | "deeplink" | "json" | "error";
  status: "success" | "pending" | "failed";
  url?: string;
  fields?: Record<string, string>;
  data?: any;
  tranId?: string;
  message?: string;
  detail?: string;
}

export interface PayWayCheckResult {
  ok: boolean;
  /** PayWay transaction status: 0 approved, 2 pending, 3 declined, 6 not found, 11 server error */
  status?: number;
  description?: string;
  apv?: string;
  amount?: string;
  payerAccount?: string;
  bankRef?: string;
  error?: string;
}

async function getJson(path: string): Promise<any> {
  try {
    const r = await fetch(`${GATEWAY_BASE}/payway${path}`, {
      signal: AbortSignal.timeout(4000),
    });
    return { ok: r.ok, json: await r.json().catch(() => null) };
  } catch {
    return { ok: false, json: null };
  }
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; json: any }> {
  try {
    const r = await fetch(`${GATEWAY_BASE}/payway${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: r.ok, json: await r.json().catch(() => null) };
  } catch {
    return { ok: false, json: null };
  }
}

export async function getPaywayStatus(): Promise<PayWayStatus> {
  const { ok, json } = await getJson("/config");
  if (!ok || !json) return { reachable: false, mode: "mock", configured: false };
  return {
    reachable: true,
    mode: json.mode === "live" ? "live" : "mock",
    configured: !!json.configured,
    merchantId: json.merchantId ?? null,
    baseUrl: json.baseUrl,
  };
}

export interface IncomingRow {
  tran_id: string;
  amount: string | number;
  currency?: string;
  status?: number | string;
  description?: string;
  payment_option?: string;
  req_time?: string;
  [k: string]: unknown;
}

export interface IncomingResult {
  mode: "mock" | "live" | "error";
  rows: IncomingRow[];
  error?: { code?: string; message?: string };
}

/** Fetch ABA PayWay incoming (入账) statement for a date range. */
export async function getIncoming(fromDate: string, toDate: string): Promise<IncomingResult> {
  const { ok, json } = await getJson(
    `/incoming?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
  );
  if (!ok || !json) {
    // Gateway offline → local demo rows.
    return { mode: "error", error: { code: "unreachable", message: "网关不可达（本地预览）" }, rows: demoIncoming() };
  }
  if (json.mode === "error") {
    return { mode: "error", error: json.error ?? { code: "unknown" }, rows: json.demo ?? demoIncoming() };
  }
  const raw = Array.isArray(json.data) ? json.data : Array.isArray(json.data?.list) ? json.data.list : [];
  return { mode: json.mode === "mock" ? "mock" : "live", rows: raw };
}

function demoIncoming(): IncomingRow[] {
  return [
    { tran_id: "ABA1000012345", amount: "20.00", currency: "USD", status: 0, description: "approved", payment_option: "abapay", req_time: "20261001090000" },
    { tran_id: "ABA1000012344", amount: "15.50", currency: "USD", status: 0, description: "approved", payment_option: "abapay_khqr_deeplink", req_time: "20260930183000" },
    { tran_id: "ABA1000012343", amount: "50000", currency: "KHR", status: 0, description: "approved", payment_option: "abapay", req_time: "20260930120000" },
    { tran_id: "ABA1000012342", amount: "8.00", currency: "USD", status: 0, description: "approved", payment_option: "abapay", req_time: "20260930080000" },
    { tran_id: "ABA1000012341", amount: "120.00", currency: "USD", status: 1, description: "declined", payment_option: "abapay", req_time: "20260929090000" },
  ];
}

/**
 * Create an ABA PayWay payment through the gateway.
 * - mode "form": submit `fields` to `url` in the browser (ABA checkout page).
 * - mode "deeplink": open `data.abapay_deeplink` in the ABA Mobile app.
 * - mode "error": gateway answered with an ABA error (e.g. code 21 expired key).
 * - mode "mock": gateway not configured → instant local success.
 */
export async function initiatePaywayPayment(p: {
  amount: number;
  currency: string;
  tranId?: string;
  paymentOption?: "abapay" | "abapay_khqr_deeplink";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  continueSuccessUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<PayWayInitiateResult | null> {
  const { ok, json } = await postJson("/purchase", p);
  if (!ok || !json) return null;
  const tranId = json.fields?.tran_id ?? json.data?.tran_id ?? json.data?.pw_tran_id ?? p.tranId;
  return { ...json, tranId };
}

/** Poll an ABA PayWay transaction status. */
export async function checkPaywayStatus(tranId: string): Promise<PayWayCheckResult> {
  const { ok, json } = await postJson("/check-status", { tranId });
  if (!ok || !json) return { ok: false };
  if (json.error) return { ok: false, error: json.error };
  const st = Number(json.status);
  return {
    ok: st === 0,
    status: st,
    description: json.description ?? json.message,
    apv: json.apv,
    amount: json.totalAmount ?? json.amount,
    payerAccount: json.payer_account ?? json.payerAccount,
    bankRef: json.bank_ref ?? json.bankRef,
  };
}

/** Submit the signed ABA form in the current tab (ABA checkout page). */
export function submitPayWayForm(url: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = "_blank";
  form.rel = "noreferrer";
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
