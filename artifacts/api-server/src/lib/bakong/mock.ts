/**
 * Mock implementations used when BAKONG_MODE=mock or no token is configured.
 * These keep the same response shape as the real Bakong Open API so the
 * frontend code path is identical in both modes.
 */

/** Minimal NBC participant map (mirrors the frontend BANK_MAP). */
const BANKS: Record<string, string> = {
  ababank: "ABA Bank",
  acledabank: "ACLEDA Bank",
  acledabank_plc: "ACLEDA Bank PLC",
  wingbank: "Wing Bank",
  canadiabank: "Canadia Bank",
  sathapana: "Sathapana Bank",
  vattanacbank: "Vattanac Bank",
  cambodiabank: "Cambodia Bank",
  principlebank: "Prince Bank",
  ppbank: "Phnom Penh Bank",
  maybank: "Maybank",
  cimb: "CIMB Bank",
  jtrustroyal: "J Trust Royal Bank",
  jtrust: "J Trust Royal Bank",
  kookminbank: "KB Kookmin Bank",
  kookmin: "KB Kookmin Bank",
  bankofchina: "Bank of China",
  icbc: "ICBC",
  sacombank: "Sacom Bank",
  phillipbank: "Phillip Bank",
  rhbindochina: "RHB Indochina Bank",
  ucb: "Union Commercial Bank",
  cpb: "Cambodian Public Bank",
  wooribank: "Woori Bank",
  kbanc: "KBank Cambodia",
  kb: "KBank Cambodia",
  bidc: "BIDC Bank",
  amk: "AMK Microfinance",
  hattha: "Hattha Bank",
  prasac: "PRASAC Microfinance",
  lolc: "LOLC (Cambodia)",
  kredit: "KREDIT Microfinance",
  market: "Market Microfinance",
  gdbank: "Global Digital Bank",
  bruc: "BRUC",
  pippay: "Pi Pay Plc.",
  pipay: "Pi Pay Plc.",
  emoney: "eMoney",
};

export function mockCheckAccount(
  accountId: string,
): {
  responseCode: number;
  responseMessage: string;
  errorCode: number | null;
  bankName: string | null;
} {
  const bankCode = accountId.split("@")[1]?.toLowerCase() ?? "";
  if (!bankCode) {
    return {
      responseCode: 1,
      responseMessage: "Account ID not found (no bank code)",
      errorCode: 11,
      bankName: null,
    };
  }
  const bankName = BANKS[bankCode] ?? null;
  if (bankName) {
    return {
      responseCode: 0,
      responseMessage: "Account ID exists",
      errorCode: null,
      bankName,
    };
  }
  return {
    responseCode: 1,
    responseMessage: "Account ID not found",
    errorCode: 11,
    bankName: null,
  };
}

let mockSeq = 0;

/** Simulates a settled Bakong transaction record. */
export function mockTransaction(
  qrMd5: string,
  shortHash: string,
  amount: number,
  currency: string,
  toAccountId: string,
  fromAccountId: string,
): {
  responseCode: number;
  responseMessage: string;
  errorCode: number | null;
  data: {
    hash: string;
    fromAccountId: string;
    toAccountId: string;
    currency: string;
    amount: number;
    description: string;
  };
} {
  mockSeq += 1;
  const fullHash = `${"f".repeat(32)}${String(mockSeq).padStart(3, "0")}`;
  return {
    responseCode: 0,
    responseMessage: "Getting transaction successfully.",
    errorCode: null,
    data: {
      hash: fullHash,
      fromAccountId: fromAccountId || `aba_demo_${mockSeq}@ababank`,
      toAccountId,
      currency,
      amount,
      description: `Mock Bakong transfer ${shortHash}`,
    },
  };
}
