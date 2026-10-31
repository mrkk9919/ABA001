/**
 * Transfer state shared between Scanner → PayFlow page.
 * Persisted to sessionStorage (in addition to an in-memory memo) so the
 * scanned recipient survives any client-side navigation, service-worker
 * activation, or accidental refresh — otherwise PayFlow would fall back to
 * the hardcoded demo payee and the scanned recipient would never appear.
 */
import type { KHQRData } from './khqr';

export interface PendingTransfer {
  data: KHQRData;
  /** raw KHQR string from the scan/upload — needed by the Bakong gateway. */
  raw: string;
}

const KEY = 'aba.pendingTransfer.v1';
let _memo: PendingTransfer | null = null;

export function setPendingTransfer(data: KHQRData, raw = '') {
  const p: PendingTransfer = { data, raw };
  _memo = p;
  try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

export function getPendingTransfer(): PendingTransfer | null {
  if (_memo) return _memo;
  try {
    const s = sessionStorage.getItem(KEY);
    if (s) { _memo = JSON.parse(s) as PendingTransfer; return _memo; }
  } catch { /* corrupt / unavailable */ }
  return null;
}

export function clearPendingTransfer() {
  _memo = null;
  try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
