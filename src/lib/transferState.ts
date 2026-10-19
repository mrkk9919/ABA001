/**
 * Tiny in-memory transfer state shared between Scanner → Transfer page.
 * Using a module-level store avoids URL encoding / search-param gymnastics.
 */
import type { KHQRData } from './khqr';

export interface PendingTransfer {
  data: KHQRData;
  /** raw KHQR string from the scan/upload — needed by the Bakong gateway. */
  raw: string;
}

let _pending: PendingTransfer | null = null;

export function setPendingTransfer(data: KHQRData, raw = '') { _pending = { data, raw }; }
export function getPendingTransfer(): PendingTransfer | null { return _pending; }
export function clearPendingTransfer() { _pending = null; }
