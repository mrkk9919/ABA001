/**
 * Bakong gateway configuration.
 *
 * Modes:
 *  - "mock" (default): no real Bakong calls; the gateway simulates account
 *    checks and transaction results so the full payment journey stays testable.
 *  - "live": real Bakong Open API calls against NBC. Requires a developer
 *    token obtained via /v1/request_token + /v1/verify (see README).
 */
export type BakongMode = "mock" | "live";

export interface BakongConfig {
  mode: BakongMode;
  sitBase: string;
  prodBase: string;
  /** Token provided via env (BAKONG_TOKEN) — highest priority. */
  envToken: string;
  /** Optional email used for token renewal (BAKONG_EMAIL). */
  email: string;
}

export const bakongConfig: BakongConfig = {
  mode: (process.env.BAKONG_MODE as BakongMode) ?? "mock",
  sitBase: process.env.BAKONG_SIT_BASE ?? "https://sit-api-bakong.nbc.org.kh",
  prodBase:
    process.env.BAKONG_PROD_BASE ?? "https://api-bakong.nbc.gov.kh",
  envToken: process.env.BAKONG_TOKEN ?? "",
  email: process.env.BAKONG_EMAIL ?? "",
};

export function bakongBaseUrl(): string {
  return bakongConfig.mode === "live"
    ? bakongConfig.prodBase
    : bakongConfig.sitBase;
}
