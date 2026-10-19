/**
 * Frontend client for the Bakong gateway (artifacts/api-server).
 *
 * The gateway proxies the real NBC Bakong Open API
 * (SIT https://sit-api-bakong.nbc.org.kh / production https://api-bakong.nbc.org.kh).
 * The gateway is discovered automatically: the local dev gateway first, then the
 * relative /api (when the preview is served behind a backend). When no gateway
 * is reachable (e.g. a static preview with no backend), every call degrades to
 * a local fallback so the demo keeps working.
 */

const DEV_GATEWAY: string =
  (import.meta.env.VITE_BAKONG_GATEWAY_URL as string | undefined) || "http://localhost:5200/api";

let gatewayBase: string | null = null;

async function resolveGateway(): Promise<string | null> {
  if (gatewayBase) return gatewayBase;
  const candidates = [DEV_GATEWAY, "/api"];
  for (const base of candidates) {
    try {
      const r = await fetch(`${base}/bakong/config`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        gatewayBase = base;
        return base;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export interface BakongStatus {
  reachable: boolean;
  mode: "mock" | "live";
  hasToken: boolean;
  baseUrl?: string;
}

export interface BakongAccountCheck {
  /** true when the gateway answered and the account exists (responseCode 0). */
  ok: boolean;
  /** real bank name resolved by the gateway, when the backend knows it. */
  bankName: string | null;
  /** false when the gateway is offline (local fallback). */
  live: boolean;
}

export interface BakongPaymentResult {
  id: string;
  status: "pending" | "success" | "failed";
  paymentUrl?: string | null;
  hash?: string;
  fromAccountId?: string;
  toAccountId?: string;
  currency?: string;
  amount?: number;
  md5?: string;
  shortHash?: string;
}

async function post(path: string, body?: unknown): Promise<{ ok: boolean; json: any }> {
  const base = await resolveGateway();
  if (!base) return { ok: false, json: null };
  try {
    const r = await fetch(`${base}/bakong${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    const json = await r.json().catch(() => null);
    return { ok: r.ok, json };
  } catch {
    return { ok: false, json: null };
  }
}

export async function getBakongStatus(): Promise<BakongStatus> {
  const base = await resolveGateway();
  if (!base) return { reachable: false, mode: "mock", hasToken: false };
  try {
    const r = await fetch(`${base}/bakong/config`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return { reachable: false, mode: "mock", hasToken: false };
    const j = await r.json();
    return {
      reachable: true,
      mode: j.mode === "live" ? "live" : "mock",
      hasToken: !!j.hasToken,
      baseUrl: j.baseUrl,
    };
  } catch {
    return { reachable: false, mode: "mock", hasToken: false };
  }
}

/**
 * Real Bakong account check through the gateway. On failure (offline) the
 * caller is expected to keep the local readout and continue.
 */
export async function checkBakongAccount(accountId: string): Promise<BakongAccountCheck> {
  const { ok, json } = await post("/account/check", { accountId });
  if (!ok || !json) return { ok: true, bankName: null, live: false };
  return {
    ok: json.responseCode === 0,
    bankName: typeof json.bankName === "string" ? json.bankName : null,
    live: true,
  };
}

/** Initiate a payment through the gateway (mock settles instantly). */
export async function initiateBakongPayment(p: {
  qr: string;
  amount: number;
  currency: string;
  toAccountId: string;
  fromAccountId?: string;
  reference?: string;
}): Promise<BakongPaymentResult | null> {
  const { ok, json } = await post("/payments/initiate", p);
  if (!ok || !json) return null;
  return (json.data as BakongPaymentResult) ?? null;
}

/** Poll a pending payment session. */
export async function pollBakongPayment(id: string): Promise<BakongPaymentResult | null> {
  const base = await resolveGateway();
  if (!base) return null;
  try {
    const r = await fetch(`${base}/bakong/payments/${id}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.data as BakongPaymentResult) ?? null;
  } catch {
    return null;
  }
}
