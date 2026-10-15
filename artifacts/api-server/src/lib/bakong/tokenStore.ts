import fs from "node:fs";
import path from "node:path";

export interface StoredToken {
  token: string;
  email: string;
  issuedAt: number; // epoch seconds (iat from JWT)
  expiresIn: number; // seconds
}

const tokenFile = () =>
  path.resolve(process.cwd(), ".bakong-token.json");

let cached: StoredToken | null | undefined;

export function readToken(): StoredToken | null {
  if (cached !== undefined) return cached;
  try {
    cached = JSON.parse(fs.readFileSync(tokenFile(), "utf8")) as StoredToken;
  } catch {
    cached = null;
  }
  return cached;
}

export function writeToken(stored: StoredToken): void {
  cached = stored;
  fs.writeFileSync(tokenFile(), JSON.stringify(stored, null, 2), "utf8");
}

export function tokenExpiresAt(stored: StoredToken): number {
  return (stored.issuedAt + stored.expiresIn) * 1000;
}

export function isTokenExpired(stored: StoredToken, now = Date.now()): boolean {
  return now >= tokenExpiresAt(stored) - 60_000; // 1 min safety margin
}

export function maskToken(token: string): string {
  if (token.length <= 12) return "••••";
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}
