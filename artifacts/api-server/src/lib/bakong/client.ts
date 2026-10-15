import { bakongBaseUrl, bakongConfig } from "./config";
import { readToken, writeToken, isTokenExpired, type StoredToken } from "./tokenStore";

export interface BakongApiResponse<T = unknown> {
  status: number;
  json: {
    responseCode?: number | null;
    responseMessage?: string | null;
    errorCode?: number | null;
    data?: T | null;
  } | null;
}

/**
 * Lowest-level call against the Bakong Open API. Every endpoint is POST + JSON.
 * Endpoints that require authentication pass "Bearer <token>".
 */
async function bakongPost<T = unknown>(
  apiPath: string,
  body: unknown,
  opts: { auth?: boolean } = {},
): Promise<BakongApiResponse<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const token = bakongConfig.envToken || readToken()?.token;
    if (!token) {
      return {
        status: 401,
        json: {
          responseCode: 6,
          responseMessage:
            "Bakong token is not configured. Run /v1/request_token + /v1/verify first (or set BAKONG_TOKEN).",
          errorCode: 6,
          data: null,
        },
      };
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${bakongBaseUrl()}${apiPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    return {
      status: 0,
      json: {
        responseCode: 9,
        responseMessage: `Cannot connect to Bakong server (${bakongBaseUrl()}${apiPath}). Please try again later.`,
        errorCode: 9,
        data: null,
      },
    };
  }

  const json = (await res.json().catch(() => null)) as BakongApiResponse<T>["json"];
  return { status: res.status, json };
}

/* ─── Token lifecycle ─────────────────────────────────────────────────────── */

/** POST /v1/request_token — sends a verification code to the registered email. */
export async function requestToken(email: string, organization: string, project: string) {
  return bakongPost("/v1/request_token", { email, organization, project });
}

/** POST /v1/verify — exchange the 20-char email code for an access token. */
export async function verifyToken(code: string, email: string) {
  const out = await bakongPost<{ token: string }>("/v1/verify", { code });
  const token = out.json?.data?.token;
  if (token) {
    // Decode the JWT payload (base64url) to recover iat/exp for caching.
    let issuedAt = Math.floor(Date.now() / 1000);
    let expiresIn = 2 * 3600;
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
      );
      if (typeof payload.iat === "number") issuedAt = payload.iat;
      if (typeof payload.exp === "number") expiresIn = payload.exp - issuedAt;
    } catch {
      // keep defaults
    }
    writeToken({ token, email, issuedAt, expiresIn });
  }
  return out;
}

/** POST /v1/renew_token — renew the token for the given email. */
export async function renewToken(email: string) {
  const out = await bakongPost<{ token: string }>("/v1/renew_token", { email });
  const token = out.json?.data?.token;
  if (token) {
    const prev = readToken();
    let issuedAt = Math.floor(Date.now() / 1000);
    let expiresIn = 2 * 3600;
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
      );
      if (typeof payload.iat === "number") issuedAt = payload.iat;
      if (typeof payload.exp === "number") expiresIn = payload.exp - issuedAt;
    } catch {
      // keep defaults
    }
    writeToken({ token, email: prev?.email ?? email, issuedAt, expiresIn });
  }
  return out;
}

export function effectiveToken(): { token: string; email: string; expired: boolean } | null {
  const env = bakongConfig.envToken;
  if (env) return { token: env, email: bakongConfig.email, expired: false };
  const stored = readToken();
  if (!stored) return null;
  return { token: stored.token, email: stored.email, expired: isTokenExpired(stored) };
}

/* ─── Account & transaction lookups ───────────────────────────────────────── */

/** POST /v1/check_bakong_account — confirm a Bakong account exists. */
export async function checkBakongAccount(accountId: string) {
  return bakongPost("/v1/check_bakong_account", { accountId }, { auth: true });
}

/** POST /v1/check_transaction_by_md5 — status by the MD5 of the QR string. */
export async function checkTransactionByMd5(md5: string) {
  return bakongPost("/v1/check_transaction_by_md5", { md5 }, { auth: true });
}

/** POST /v1/check_transaction_by_short_hash — status by 8-char hash + amount + currency. */
export async function checkTransactionByShortHash(
  hash: string,
  amount: number,
  currency: string,
) {
  return bakongPost(
    "/v1/check_transaction_by_short_hash",
    { hash, amount, currency },
    { auth: true },
  );
}

/** POST /v1/check_transaction_by_hash — status by full 64-char hash. */
export async function checkTransactionByHash(hash: string) {
  return bakongPost("/v1/check_transaction_by_hash", { hash }, { auth: true });
}

/** POST /v1/check_transaction_by_instruction_ref — status by instruction reference. */
export async function checkTransactionByInstructionRef(instructionRef: string) {
  return bakongPost("/v1/check_transaction_by_instruction_ref", { instructionRef }, { auth: true });
}

/** POST /v1/check_transaction_by_external_ref — status by external reference (ID). */
export async function checkTransactionByExternalRef(externalRef: string) {
  return bakongPost("/v1/check_transaction_by_external_ref", { externalRef }, { auth: true });
}

/** POST /v1/check_transaction_by_md5_list — bulk status by list of md5 (array body, ≤50). */
export async function checkTransactionByMd5List(md5s: string[]) {
  return bakongPost("/v1/check_transaction_by_md5_list", md5s, { auth: true });
}

/** POST /v1/check_transaction_by_hash_list — bulk status by list of full hash (array body, ≤50). */
export async function checkTransactionByHashList(hashes: string[]) {
  return bakongPost("/v1/check_transaction_by_hash_list", hashes, { auth: true });
}

/** POST /v1/generate_deeplink_by_qr — payment deeplink for the consumer app. */
export async function generateDeeplink(
  qr: string,
  sourceInfo: { appIconUrl: string; appName: string; appDeepLinkCallback: string },
) {
  return bakongPost("/v1/generate_deeplink_by_qr", { qr, sourceInfo });
}
