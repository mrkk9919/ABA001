import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, Landmark } from 'lucide-react';
import { getIncoming, type IncomingRow, type IncomingResult } from '@/lib/paywayClient';

/* ABA API ទទួលប្រាក់ — incoming funds statement from the ABA PayWay gateway. */

const TemplePattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.05]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 420 420">
    <g fill="#2E6FD8">
      {[20, 230].map((x) => (
        <g key={x} transform={`translate(${x},40)`}>
          <rect x="36" y="90" width="40" height="60" />
          <rect x="16" y="110" width="80" height="40" />
          <rect x="0" y="130" width="112" height="20" />
          <path d="M56 0 L86 90 H26 Z" />
          <path d="M26 30 L46 90 H6 Z" />
          <path d="M86 30 L106 90 H66 Z" />
          <rect x="46" y="20" width="20" height="30" />
        </g>
      ))}
    </g>
  </svg>
);

function fmtDate(rt: string): string {
  if (!rt || rt.length < 12) return '—';
  const y = rt.slice(0, 4), mo = rt.slice(4, 6), d = rt.slice(6, 8), h = rt.slice(8, 10), mi = rt.slice(10, 12);
  return `${y}-${mo}-${d} ${h}:${mi}`;
}

function fmtAmount(r: IncomingRow): string {
  const n = Number(r.amount);
  const cur = r.currency === 'KHR' ? '៛' : '$';
  return cur === '៛' ? `${n.toLocaleString()}៛` : `${cur}${n.toFixed(2)}`;
}

export default function Incoming() {
  const [, setLocation] = useLocation();
  const [res, setRes] = useState<IncomingResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 86400000);
    const p = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}000000`;
    getIncoming(fmt(from), fmt(to)).then((r) => {
      setRes(r);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const approved = (r: IncomingRow) => {
    const s = Number(r.status);
    return !r.status || s === 0 || s === 2;
  };

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] font-sans flex flex-col overflow-y-auto">
      <TemplePattern />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-3 flex items-center justify-between">
        <button onClick={() => setLocation('/transfer')} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[17px] font-extrabold text-gray-900 tracking-tight">ABA API ទទួលប្រាក់</p>
          <p className="text-[11px] text-gray-500 font-medium">ABA PayWay Incoming · 入账</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2E6FD8]">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative px-4 flex flex-col flex-1 pb-10">
        {/* Gateway mode banner */}
        {res && (
          <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 text-[12px] font-semibold ${
            res.mode === 'live' ? 'bg-[#16A34A]/10 text-[#16A34A]'
            : res.mode === 'mock' ? 'bg-[#2E6FD8]/10 text-[#2E6FD8]'
            : 'bg-[#F59E0B]/10 text-[#B45309]'
          }`}>
            {res.mode === 'live' ? <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
            <div>
              {res.mode === 'live' && <p>已连接 ABA PayWay 网关 · 实时入账数据</p>}
              {res.mode === 'mock' && <p>ABA PayWay 网关未配置 · 展示演示入账数据</p>}
              {res.mode === 'error' && (
                <>
                  <p>ABA API 返回错误：{res.error?.code ?? 'unknown'} — {res.error?.message ?? ''}</p>
                  <p className="text-[11px] font-normal mt-0.5">下方为演示入账数据（更换有效 Public Key 后自动显示真实入账）</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {res && res.rows.length > 0 && (
          <div className="mt-4 rounded-3xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] px-5 py-4 flex items-center gap-4">
            <span className="w-11 h-11 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
              <Landmark className="w-6 h-6" strokeWidth={2.1} />
            </span>
            <div className="flex-1">
              <p className="text-[12px] text-gray-500 font-medium">ចំនួនសរុប（入账合计 · 30 天）</p>
              <p className="text-[22px] font-extrabold text-gray-900 leading-tight">
                {(() => {
                  const ok = res.rows.filter(approved);
                  const usd = ok.filter((r) => r.currency !== 'KHR').reduce((s, r) => s + (Number(r.amount) || 0), 0);
                  const khr = ok.filter((r) => r.currency === 'KHR').reduce((s, r) => s + (Number(r.amount) || 0), 0);
                  return `${usd.toFixed(2)} USD${khr ? ` · ${khr.toLocaleString()}៛` : ''}`;
                })()}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{res.rows.filter(approved).length} 笔成功入账</p>
            </div>
          </div>
        )}

        {/* Incoming list */}
        <p className="mt-5 text-[13px] font-bold text-gray-700 mb-2">ប្រវត្តិទទួលប្រាក់ · 入账流水</p>
        {loading ? (
          <div className="rounded-3xl bg-white shadow-sm px-5 py-10 text-center text-[13px] text-gray-400 font-medium">
            កំពុងផ្ទុក… 加载中
          </div>
        ) : res && res.rows.length > 0 ? (
          <div className="rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-5 divide-y divide-gray-100">
            {res.rows.map((r) => (
              <div key={String(r.tran_id) + String(r.req_time)} className="py-4 flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${approved(r) ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#E8002D]/10 text-[#E8002D]'}`}>
                  {approved(r) ? <TrendingUp className="w-5 h-5" strokeWidth={2.2} /> : <AlertTriangle className="w-5 h-5" strokeWidth={2.2} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">
                    {r.payment_option === 'abapay_khqr_deeplink' ? 'ABA QR 收款' : 'ABA PayWay 收款'} · {approved(r) ? '入账' : '未入账'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {String(r.tran_id)} · {fmtDate(String(r.req_time ?? ''))}
                    {r.description ? ` · ${r.description}` : ''}
                  </p>
                </div>
                <span className={`text-[15px] font-extrabold shrink-0 ${approved(r) ? 'text-[#16A34A]' : 'text-[#E8002D]'}`}>
                  +{fmtAmount(r)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white shadow-sm px-5 py-10 text-center text-[13px] text-gray-400 font-medium">
            មិនមានប្រតិបត្តិការ · 暂无入账记录
          </div>
        )}
      </div>
    </div>
  );
}
