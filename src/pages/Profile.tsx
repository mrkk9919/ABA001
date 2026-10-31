import React, { useState } from 'react';
import { useLocation } from 'wouter';
import PinLock from '@/components/PinLock';
import { X, Pencil, Check, User } from 'lucide-react';

/* ─── Grey/white cartoon cat avatar (Tom style, same as Home/Settings) ─── */
const TomCatAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <rect width="100" height="100" fill="#F2E8D8" />
    <polygon points="26,40 18,12 48,32" fill="#8CA6BC" />
    <polygon points="74,40 82,12 52,32" fill="#8CA6BC" />
    <polygon points="28,37 23,17 44,31" fill="#E8A0B0" />
    <polygon points="72,37 77,17 56,31" fill="#E8A0B0" />
    <ellipse cx="50" cy="58" rx="33" ry="31" fill="#8CA6BC" />
    <ellipse cx="50" cy="70" rx="24" ry="18" fill="#F5F1E8" />
    <path d="M20,52 Q50,38 80,52 L80,44 Q50,30 20,44 Z" fill="#7A94AC" opacity="0.6" />
    <ellipse cx="41" cy="52" rx="7.5" ry="10" fill="#FFFDF2" />
    <ellipse cx="59" cy="52" rx="7.5" ry="10" fill="#FFFDF2" />
    <circle cx="42.5" cy="55" r="3.6" fill="#1A1A1A" />
    <circle cx="57.5" cy="55" r="3.6" fill="#1A1A1A" />
    <circle cx="43.5" cy="53.5" r="1.2" fill="white" />
    <circle cx="58.5" cy="53.5" r="1.2" fill="white" />
    <ellipse cx="50" cy="65" rx="4" ry="3" fill="#C84A4A" />
    <path d="M44 71 Q50 76 56 71" fill="none" stroke="#8A6A5A" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="38" cy="70" r="0.9" fill="#8A6A5A" />
    <circle cx="34" cy="73" r="0.9" fill="#8A6A5A" />
    <circle cx="62" cy="70" r="0.9" fill="#8A6A5A" />
    <circle cx="66" cy="73" r="0.9" fill="#8A6A5A" />
    <line x1="14" y1="64" x2="32" y2="68" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="14" y1="72" x2="32" y2="72" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="68" y1="68" x2="86" y2="64" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="68" y1="72" x2="86" y2="72" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <path d="M20,62 L14,60 M20,68 L13,68" stroke="#8CA6BC" strokeWidth="3" strokeLinecap="round" />
    <path d="M80,62 L86,60 M80,68 L87,68" stroke="#8CA6BC" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ─── Personal info (ប្រូហ្វាល់របស់ខ្ញុំ) — full-screen, editable ────────── */
type FieldKey = 'fullName' | 'idCard' | 'phone' | 'email' | 'usdAccount' | 'khrAccount';

const LS_KEY = 'aba.profile.v1';

const DEFAULTS: Record<FieldKey, { label: string; hint: string; value: string }> = {
  fullName: { label: 'ឈ្មោះពេញ', hint: 'Full name', value: 'SOEU YUKHEANG' },
  idCard: { label: 'លេខអត្តសញ្ញាណប័ណ្ណ', hint: 'ID card no.', value: '49399' },
  phone: { label: 'លេខទូរស័ព្ទ', hint: 'Phone number', value: '016 888 6168' },
  email: { label: 'អ៊ីមែល', hint: 'Email address', value: 'soueuyukheang@gmail.com' },
  usdAccount: { label: 'គណនីដុល្លារ', hint: 'USD account', value: '150 614 168' },
  khrAccount: { label: 'គណនីរៀល', hint: 'KHR account', value: '600 980 842' },
};

const load = (): Record<FieldKey, string> => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v.value])) as Record<FieldKey, string>, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v.value])) as Record<FieldKey, string>;
};

export default function Profile() {
  const [, setLocation] = useLocation();
  const [fields, setFields] = useState<Record<FieldKey, string>>(load);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState(false);
  const [profileUnlocked, setProfileUnlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem('aba.profile.unlocked') === '1'; } catch { return false; }
  });
  if (!profileUnlocked) {
    return (
      <PinLock
        title="បញ្ចូលលេខសម្ងាត់"
        subtitle="បញ្ចូល PIN ដើម្បីចូលមជ្ឈដ្ឋានផ្ទាល់ខ្លួន · Enter PIN to access personal center"
        storageKey="aba.profile.unlocked"
        onUnlock={() => setProfileUnlocked(true)}
      />
    );
  }

  const startEdit = (k: FieldKey) => {
    setEditing(k);
    setDraft(fields[k]);
  };

  const saveField = () => {
    if (!editing) return;
    const next = { ...fields, [editing]: draft.trim() || fields[editing] };
    setFields(next);
    setEditing(null);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setToast(true);
    window.setTimeout(() => setToast(false), 1600);
  };

  const keys = Object.keys(DEFAULTS) as FieldKey[];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#F3EDFF] via-[#FBF4FF] to-white font-sans flex flex-col relative">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#F3EDFF] to-transparent">
        <button onClick={() => setLocation('/settings')} className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800" aria-label="Back to settings">
          <X className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <p className="text-[17px] font-bold text-gray-900 tracking-tight">ប្រូហ្វាល់របស់ខ្ញុំ</p>
        <div className="w-9" />
      </div>

      <div className="px-4 pb-10 flex flex-col flex-1">
        {/* Profile hero */}
        <div className="mt-2 rounded-3xl bg-white/85 backdrop-blur shadow-[0_8px_24px_rgba(123,79,232,0.10)] overflow-hidden">
          <div className="px-5 pt-6 pb-6 flex flex-col items-center">
            <div className="w-[92px] h-[92px] rounded-full overflow-hidden border-[3px] border-white shadow-md">
              <TomCatAvatar />
            </div>
            <p className="mt-3 text-[19px] font-extrabold text-gray-900 tracking-tight">{fields.fullName}</p>
            <p className="mt-1 text-[13px] text-gray-500 font-medium">លេខសម្គាល់: {fields.idCard}</p>
            <button
              onClick={() => startEdit('fullName')}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7B4FE8] text-white text-[13px] font-bold shadow-[0_6px_16px_rgba(123,79,232,0.35)]"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
              កែប្រែឈ្មោះ
            </button>
          </div>
        </div>

        {/* Fields card */}
        <div className="mt-3 rounded-3xl bg-white shadow-[0_8px_24px_rgba(123,79,232,0.08)] overflow-hidden divide-y divide-gray-100">
          {keys.map((k) => {
            const d = DEFAULTS[k];
            const isEditing = editing === k;
            return (
              <div key={k} className="px-5 py-4">
                <p className="text-[12px] font-semibold text-gray-400">{d.label} · {d.hint}</p>
                {isEditing ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#F5F2FC] border border-[#D8CCF5] text-[15px] font-semibold text-gray-900 outline-none focus:border-[#7B4FE8]"
                    />
                    <button onClick={saveField} className="w-9 h-9 rounded-xl bg-[#7B4FE8] text-white flex items-center justify-center shrink-0" aria-label="Save">
                      <Check className="w-4 h-4" strokeWidth={2.6} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="text-[16px] font-bold text-gray-900 tracking-tight">{fields[k]}</p>
                    <button onClick={() => startEdit(k)} className="w-8 h-8 rounded-lg bg-[#F3EDFF] flex items-center justify-center text-[#7B4FE8]" aria-label={`Edit ${d.label}`}>
                      <Pencil className="w-4 h-4" strokeWidth={2.2} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="mt-3 px-4 py-3 rounded-2xl bg-[#FDF6FF] border border-[#F0DFFF]">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            <span className="font-bold text-[#7B4FE8]">Note:</span> ព័ត៌មានទាំងនេះបានរក្សាទុកលើឧបករណ៍នេះតែប៉ុណ្ណោះ (Profile data is stored on this device only.)
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[13px] text-gray-600 font-semibold">កម្មវិធី កំណែ: V 5.1.5</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#E8002D] text-white text-[13px] font-extrabold tracking-wide">ABA BANK</span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide max-w-[110px] leading-tight text-left">NATIONAL BANK OF CANADA GROUP</span>
          </div>
        </div>
      </div>

      {/* Saved toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-gray-900/90 text-white text-[13px] font-semibold shadow-lg">
          បានរក្សាទុកហើយ · Saved
        </div>
      )}
    </div>
  );
}
