import { Router, type IRouter, type Request, type Response } from "express";
import { paywayConfig, isPayWayConfigured, maskMerchant } from "../lib/payway/config";
import { buildPurchaseFields, createPurchase, checkTransaction, reconciliation, searchTransaction, type PurchaseParams } from "../lib/payway/client";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Config / status ──────────────────────────────────────────────────────── */

router.get("/config", (_req, res) => {
  res.json({
    mode: paywayConfig.mode,
    configured: isPayWayConfigured(),
    merchantId: paywayConfig.merchantId ? maskMerchant(paywayConfig.merchantId) : null,
    baseUrl: paywayConfig.baseUrl,
  });
});

/* ─── Create purchase (ABA PayWay) ────────────────────────────────────────── */

router.post("/purchase", async (req: Request, res: Response) => {
  const {
    amount,
    currency,
    tranId,
    items,
    paymentOption,
    firstName,
    lastName,
    email,
    phone,
    returnUrl,
    cancelUrl,
    continueSuccessUrl,
  } = req.body ?? {};

  if (amount == null || !currency) {
    res.status(400).json({ error: "amount and currency are required" });
    return;
  }

  if (!isPayWayConfigured()) {
    // Mock: settle instantly, same shape as the frontend expects.
    res.json({
      mode: "mock",
      status: "success",
      data: {
        tranId: String(tranId ?? `mock-${Date.now()}`),
        amount: Number(amount),
        currency,
        hash: "mock-hash",
      },
    });
    return;
  }

  const tid = String(tranId ?? `ABA${Date.now().toString().slice(-10)}`);
  const opt = paymentOption === "abapay_khqr_deeplink" ? "abapay_khqr_deeplink" : "abapay";
  const params: PurchaseParams = {
    tranId: tid,
    amount: Number(amount),
    currency: currency === "KHR" ? "KHR" : "USD",
    items,
    firstName,
    lastName,
    email,
    phone,
    paymentOption: opt,
    returnUrl,
    cancelUrl,
    continueSuccessUrl,
  };

  try {
    if (opt === "abapay") {
      // Browser checkout: return the signed form the frontend submits directly
      // to ABA PayWay. The API key never leaves the server.
      const fields = buildPurchaseFields(params);
      res.json({
        mode: "form",
        status: "pending",
        url: `${paywayConfig.baseUrl}/api/payment-gateway/v1/payments/purchase`,
        fields,
      });
      return;
    }

    // abapay_khqr_deeplink: server-side POST returns ABA app deeplink / QR.
    const out = await createPurchase(params);
    if (out.json && (out.json.status === "0" || out.json.code === "00")) {
      res.json({ mode: "deeplink", status: "pending", data: out.json });
      return;
    }
    res.status(200).json({ mode: "error", status: "failed", data: out.json ?? { raw: out.body.slice(0, 400) }, httpStatus: out.status });
  } catch (err: any) {
    logger.error({ err: String(err?.message ?? err) }, "payway purchase failed");
    res.status(502).json({ mode: "error", status: "failed", message: "PayWay unreachable", detail: String(err?.message ?? err) });
  }
});

/* ─── Check transaction status ─────────────────────────────────────────────── */

router.post("/check-status", async (req: Request, res: Response) => {
  const { tranId } = req.body ?? {};
  if (!tranId) {
    res.status(400).json({ error: "tranId is required" });
    return;
  }
  if (!isPayWayConfigured()) {
    res.json({ mode: "mock", status: "success", data: { tran_id: String(tranId), status: 0, description: "approved (mock)" } });
    return;
  }
  try {
    const out = await checkTransaction(String(tranId));
    res.json(out.json ?? { status: 11, description: "PayWay unreachable" });
  } catch (err: any) {
    logger.error({ err: String(err?.message ?? err) }, "payway check-status failed");
    res.status(502).json({ status: 11, description: "PayWay unreachable", detail: String(err?.message ?? err) });
  }
});

/* ─── Incoming funds: reconciliation (对账入账) ────────────────────────────── */

const demoIncoming = [
  { tran_id: "ABA1000012345", amount: "20.00", currency: "USD", status: 0, description: "approved", payment_option: "abapay", req_time: "20261001090000" },
  { tran_id: "ABA1000012344", amount: "15.50", currency: "USD", status: 0, description: "approved", payment_option: "abapay_khqr_deeplink", req_time: "20260930183000" },
  { tran_id: "ABA1000012343", amount: "50000", currency: "KHR", status: 0, description: "approved", payment_option: "abapay", req_time: "20260930120000" },
  { tran_id: "ABA1000012342", amount: "8.00", currency: "USD", status: 0, description: "approved", payment_option: "abapay", req_time: "20260930080000" },
  { tran_id: "ABA1000012341", amount: "120.00", currency: "USD", status: 1, description: "declined", payment_option: "abapay", req_time: "20260929090000" },
];

function normDate(v: unknown): string {
  if (typeof v === "string" && /^\d{14}$/.test(v)) return v;
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}` +
    `000000`
  );
}

router.get("/incoming", async (req: Request, res: Response) => {
  const from = normDate(req.query.from_date);
  const to = normDate(req.query.to_date ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  if (!isPayWayConfigured()) {
    res.json({ mode: "mock", data: demoIncoming });
    return;
  }
  try {
    const out = await reconciliation(from, to);
    const code = out.json?.code ?? out.json?.status?.code;
    if (out.json && code !== undefined && String(code) !== "00" && String(code) !== "0") {
      // ABA answered with a business error (e.g. expired API key code 21):
      // surface it but still return demo rows so the UI stays testable.
      res.json({ mode: "error", error: { code, message: out.json?.status?.message ?? out.json?.message ?? "" }, demo: demoIncoming });
      return;
    }
    const liveData = out.json?.data ?? out.json;
    if (!liveData) {
      res.json({ mode: "error", error: { code: "empty", message: "ABA 未返回入账数据（API Key 可能已过期，请向 ABA 更新 Public Key）" }, demo: demoIncoming });
      return;
    }
    res.json({ mode: "live", data: liveData, raw: out.body.slice(0, 500) });
  } catch (err: any) {
    logger.error({ err: String(err?.message ?? err) }, "payway incoming failed");
    res.json({ mode: "error", error: { code: "unreachable", message: String(err?.message ?? err) }, demo: demoIncoming });
  }
});

router.get("/incoming/search", async (req: Request, res: Response) => {
  const from = normDate(req.query.from_date);
  const to = normDate(req.query.to_date ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  if (!isPayWayConfigured()) {
    res.json({ mode: "mock", data: demoIncoming });
    return;
  }
  try {
    const out = await searchTransaction(from, to);
    const code = out.json?.code ?? out.json?.status?.code;
    if (out.json && code !== undefined && String(code) !== "00" && String(code) !== "0") {
      res.json({ mode: "error", error: { code, message: out.json?.status?.message ?? out.json?.message ?? "" }, demo: demoIncoming });
      return;
    }
    const liveData = out.json?.data ?? out.json;
    if (!liveData) {
      res.json({ mode: "error", error: { code: "empty", message: "ABA 未返回入账数据（API Key 可能已过期，请向 ABA 更新 Public Key）" }, demo: demoIncoming });
      return;
    }
    res.json({ mode: "live", data: liveData, raw: out.body.slice(0, 500) });
  } catch (err: any) {
    logger.error({ err: String(err?.message ?? err) }, "payway incoming search failed");
    res.json({ mode: "error", error: { code: "unreachable", message: String(err?.message ?? err) }, demo: demoIncoming });
  }
});

export default router;
