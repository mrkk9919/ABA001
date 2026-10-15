import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { bakongConfig, bakongBaseUrl } from "../lib/bakong/config";
import {
  effectiveToken,
  requestToken,
  verifyToken,
  renewToken,
  checkBakongAccount,
  checkTransactionByMd5,
  checkTransactionByShortHash,
  checkTransactionByHash,
  checkTransactionByInstructionRef,
  checkTransactionByExternalRef,
  checkTransactionByMd5List,
  checkTransactionByHashList,
  generateDeeplink,
} from "../lib/bakong/client";
import { maskToken } from "../lib/bakong/tokenStore";
import { mockCheckAccount, mockTransaction } from "../lib/bakong/mock";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Config / status ──────────────────────────────────────────────────────── */

router.get("/config", (_req, res) => {
  const token = effectiveToken();
  res.json({
    mode: bakongConfig.mode,
    baseUrl: bakongBaseUrl(),
    hasToken: !!token,
    tokenMasked: token ? maskToken(token.token) : null,
    tokenExpired: token?.expired ?? false,
    email: token?.email ?? bakongConfig.email ?? null,
  });
});

/* ─── Token lifecycle (real Bakong registration) ──────────────────────────── */
/* NOTE: NBC removed /v1/request_token + /v1/verify from the public docs
   (Change Log 1.0.3, 11.01.2022). These routes are kept for backward
   compatibility only; the current auth flow is POST /v1/renew_token {email}
   → "Authorization: Bearer <token>". See /v1/renew below. */

router.post("/register", async (req: Request, res: Response) => {
  const { email, organization, project } = req.body ?? {};
  if (!email || !organization || !project) {
    res.status(400).json({ error: "email, organization and project are required" });
    return;
  }
  const out = await requestToken(String(email), String(organization), String(project));
  res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
});

router.post("/verify", async (req: Request, res: Response) => {
  const { code, email } = req.body ?? {};
  if (!code) {
    res.status(400).json({ error: "code is required (20-char code sent to your email)" });
    return;
  }
  const out = await verifyToken(String(code), email ? String(email) : "");
  res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
});

router.post("/renew", async (req: Request, res: Response) => {
  const email = (req.body?.email ?? bakongConfig.email) as string;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const out = await renewToken(String(email));
  res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
});

/* ─── Account verification (the "read the payee" real check) ──────────────── */

router.post("/account/check", async (req: Request, res: Response) => {
  const { accountId } = req.body ?? {};
  if (!accountId) {
    res.status(400).json({ error: "accountId is required" });
    return;
  }
  const id = String(accountId);
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkBakongAccount(id);
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json(mockCheckAccount(id));
});

/* ─── Transaction status (real Bakong lookup) ─────────────────────────────── */

router.post("/transaction/check", async (req: Request, res: Response) => {
  const { md5, hash, shortHash, amount, currency } = req.body ?? {};
  if (bakongConfig.mode === "live" && effectiveToken()) {
    let out;
    if (md5) out = await checkTransactionByMd5(String(md5));
    else if (hash) out = await checkTransactionByHash(String(hash));
    else if (shortHash && amount != null && currency)
      out = await checkTransactionByShortHash(String(shortHash), Number(amount), String(currency));
    else {
      res.status(400).json({ error: "provide md5, hash, or shortHash+amount+currency" });
      return;
    }
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  // Mock: settle a synthetic transaction.
  res.json(
    mockTransaction(
      String(md5 ?? ""),
      String(shortHash ?? "mock0000"),
      Number(amount ?? 1),
      String(currency ?? "USD"),
      String(req.body?.toAccountId ?? "demo@ababank"),
      String(req.body?.fromAccountId ?? "aba_demo@ababank"),
    ),
  );
});

/* ─── Official v1.0.3+ lookups: instruction ref / external ref / bulk lists ── */

router.post("/transaction/instruction-ref", async (req: Request, res: Response) => {
  const { instructionRef } = req.body ?? {};
  if (!instructionRef) {
    res.status(400).json({ error: "instructionRef is required (≤35 chars)" });
    return;
  }
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkTransactionByInstructionRef(String(instructionRef));
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json(mockTransaction("", String(instructionRef).slice(0, 8), 1, "USD", "demo@ababank", "aba_demo@ababank"));
});

router.post("/transaction/external-ref", async (req: Request, res: Response) => {
  const { externalRef } = req.body ?? {};
  if (!externalRef) {
    res.status(400).json({ error: "externalRef is required (≤35 chars)" });
    return;
  }
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkTransactionByExternalRef(String(externalRef));
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json(mockTransaction("", String(externalRef).slice(0, 8), 1, "USD", "demo@ababank", "aba_demo@ababank"));
});

function asList(body: any, key: string): string[] | null {
  if (Array.isArray(body)) return body.map(String);
  if (body && Array.isArray(body[key])) return body[key].map(String);
  return null;
}

router.post("/transaction/md5-list", async (req: Request, res: Response) => {
  const md5s = asList(req.body, "md5");
  if (!md5s?.length || md5s.length > 50) {
    res.status(400).json({ error: "md5 array (1–50 items) is required" });
    return;
  }
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkTransactionByMd5List(md5s);
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json({
    responseCode: 0,
    responseMessage: "Getting transaction data successfully.",
    errorCode: null,
    data: md5s.map(md5 => ({
      md5,
      status: "SUCCESS",
      message: "Transaction success",
      data: mockTransaction(md5, md5.slice(0, 8), 1, "USD", "demo@ababank", "aba_demo@ababank").data,
    })),
  });
});

router.post("/transaction/hash-list", async (req: Request, res: Response) => {
  const hashes = asList(req.body, "hash");
  if (!hashes?.length || hashes.length > 50) {
    res.status(400).json({ error: "hash array (1–50 items) is required" });
    return;
  }
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkTransactionByHashList(hashes);
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json({
    responseCode: 0,
    responseMessage: "Getting transaction data successfully.",
    errorCode: null,
    data: hashes.map(h => ({
      hash: h,
      status: "SUCCESS",
      message: "Transaction success",
      data: mockTransaction("", h.slice(0, 8), 1, "USD", "demo@ababank", "aba_demo@ababank").data,
    })),
  });
});

/* ─── Payment deeplink (consumer completes payment in Bakong/ABA app) ─────── */

router.post("/deeplink", async (req: Request, res: Response) => {
  const { qr } = req.body ?? {};
  if (!qr) {
    res.status(400).json({ error: "qr is required" });
    return;
  }
  if (bakongConfig.mode === "live") {
    const out = await generateDeeplink(String(qr), {
      appIconUrl: "https://bakong.nbc.org.kh/images/logo.svg",
      appName: "Bakong",
      appDeepLinkCallback: `${req.protocol}://${req.get("host")}/api/bakong/payments/return`,
    });
    res.json(out.json ?? { responseCode: 9, responseMessage: "Bakong unreachable" });
    return;
  }
  res.json({
    responseCode: 0,
    responseMessage: "Getting deep link successfully (mock)",
    data: { shortLink: null, note: "mock-mode deeplink" },
  });
});

/* ─── Payment sessions (frontend payment flow) ────────────────────────────── */

interface PaymentSession {
  id: string;
  qr: string;
  md5: string;
  shortHash: string;
  amount: number;
  currency: string;
  toAccountId: string;
  fromAccountId: string;
  reference: string;
  status: "pending" | "success" | "failed";
  paymentUrl: string | null;
  createdAt: number;
}

const sessions = new Map<string, PaymentSession>();

function md5Of(qr: string): string {
  return crypto.createHash("md5").update(qr, "utf8").digest("hex");
}

router.post("/payments/initiate", async (req: Request, res: Response) => {
  const { qr, amount, currency, toAccountId, fromAccountId, reference } = req.body ?? {};
  if (!qr || amount == null) {
    res.status(400).json({ error: "qr and amount are required" });
    return;
  }
  const id = crypto.randomUUID().slice(0, 8);
  const md5 = md5Of(String(qr));
  const shortHash = md5.slice(0, 8);

  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await generateDeeplink(String(qr), {
      appIconUrl: "https://bakong.nbc.org.kh/images/logo.svg",
      appName: "Bakong",
      appDeepLinkCallback: `${req.protocol}://${req.get("host")}/api/bakong/payments/return?id=${id}`,
    });
    const shortLink = (out.json?.data as { shortLink?: string } | null | undefined)?.shortLink ?? null;
    sessions.set(id, {
      id, qr: String(qr), md5, shortHash,
      amount: Number(amount), currency: String(currency ?? "USD"),
      toAccountId: String(toAccountId ?? ""), fromAccountId: String(fromAccountId ?? ""),
      reference: String(reference ?? ""), status: "pending", paymentUrl: shortLink, createdAt: Date.now(),
    });
    res.json({
      responseCode: 0,
      responseMessage: "Payment initiated. Complete it in the Bakong app.",
      data: { id, status: "pending", paymentUrl: shortLink, md5, shortHash },
    });
    return;
  }

  // Mock / no token: settle immediately.
  const tx = mockTransaction(
    md5,
    shortHash,
    Number(amount),
    String(currency ?? "USD"),
    String(toAccountId ?? "demo@ababank"),
    String(fromAccountId ?? "aba_demo@ababank"),
  );
  sessions.set(id, {
    id, qr: String(qr), md5, shortHash,
    amount: Number(amount), currency: String(currency ?? "USD"),
    toAccountId: String(toAccountId ?? "demo@ababank"),
    fromAccountId: String(fromAccountId ?? "aba_demo@ababank"),
    reference: String(reference ?? ""), status: "success", paymentUrl: null, createdAt: Date.now(),
  });
  res.json({
    responseCode: 0,
    responseMessage: "Getting transaction successfully.",
    data: {
      id,
      status: "success",
      hash: tx.data.hash,
      fromAccountId: tx.data.fromAccountId,
      toAccountId: tx.data.toAccountId,
      currency: tx.data.currency,
      amount: tx.data.amount,
    },
  });
});

router.get("/payments/:id", async (req: Request, res: Response) => {
  const session = sessions.get(String(req.params.id));
  if (!session) {
    res.status(404).json({ error: "Payment session not found" });
    return;
  }
  if (session.status === "success") {
    res.json({ responseCode: 0, responseMessage: "Payment completed.", data: { id: session.id, status: "success" } });
    return;
  }
  if (bakongConfig.mode === "live" && effectiveToken()) {
    const out = await checkTransactionByMd5(session.md5);
    const found = out.json?.responseCode === 0 && !!out.json?.data;
    if (found) {
      session.status = "success";
      res.json({ responseCode: 0, responseMessage: "Getting transaction successfully.", data: { id: session.id, status: "success", ...(out.json?.data as object) } });
      return;
    }
    res.json({ responseCode: 1, responseMessage: "Transaction could not be found. Please check and try again.", data: { id: session.id, status: "pending" } });
    return;
  }
  session.status = "success";
  res.json({ responseCode: 0, responseMessage: "Payment completed (mock).", data: { id: session.id, status: "success" } });
});

export default router;
