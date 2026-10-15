import fs from "node:fs";
import path from "node:path";

/**
 * ABA PayWay gateway configuration (read from environment).
 * PEM keys are referenced by path (keys/ folder) and read from disk.
 */
export interface PayWayConfig {
  mode: "mock" | "live";
  baseUrl: string;
  merchantId: string;
  /** HMAC-SHA512 signing key (the 40-char Public Key / API Key). */
  apiKey: string;
  rsaPublicKey: string;
  rsaPrivateKey: string;
}

function readPem(file?: string): string {
  if (!file) return "";
  try {
    return fs.readFileSync(path.resolve(process.cwd(), file), "utf8").trim();
  } catch {
    return "";
  }
}

export const paywayConfig: PayWayConfig = {
  mode: (process.env.PAYWAY_MODE as "mock" | "live") ?? "mock",
  baseUrl:
    process.env.PAYWAY_BASE_URL ?? "https://checkout-sandbox.payway.com.kh",
  merchantId: process.env.PAYWAY_MERCHANT_ID ?? "",
  apiKey: process.env.PAYWAY_API_KEY ?? "",
  rsaPublicKey: readPem(process.env.PAYWAY_RSA_PUBLIC_KEY_FILE),
  rsaPrivateKey: readPem(process.env.PAYWAY_RSA_PRIVATE_KEY_FILE),
};

export function isPayWayConfigured(): boolean {
  return (
    paywayConfig.mode === "live" &&
    !!paywayConfig.merchantId &&
    !!paywayConfig.apiKey
  );
}

export function maskMerchant(id: string): string {
  if (id.length <= 4) return "••••";
  return `${id.slice(0, 3)}•••${id.slice(-2)}`;
}
