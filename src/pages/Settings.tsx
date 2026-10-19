import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  X, User, ShieldCheck, Sparkles, Globe, Phone, FileText, Briefcase, ChevronRight, Volume2,
} from 'lucide-react';
import { getTtsLang, setTtsLang, type TtsLang } from '@/lib/tts';

/* ─── Grey/white cartoon cat avatar (Tom style, same as Home) ───────────────── */
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

/* ─── Settings page (mirrors ABA app's ការកំណត់ផ្សេងៗ screen) ─────────────── */
const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'ឧសភា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

export default function Settings() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<'personal' | 'business'>('personal');
  const [abaBizOn, setAbaBizOn] = useState(true);
  const [voiceLang, setVoiceLang] = useState<TtsLang>(() => getTtsLang());
  const VOICE_LABELS: Record<TtsLang, string> = { zh: '中文', en: 'English', km: 'ខ្មែរ' };
  const VOICE_NEXT: Record<TtsLang, TtsLang> = { zh: 'en', en: 'km', km: 'zh' };
  const cycleVoice = () => {
    const next = VOICE_NEXT[voiceLang];
    setVoiceLang(next);
    setTtsLang(next);
  };

  const now = new Date();
  const lastLogin = `Login ចុងក្រោយ: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} | ${now.getDate()} ${KHMER_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const rows: { icon: React.ReactNode; label: string; value?: string; toggle?: boolean; onToggle?: (v: boolean) => void; route?: string }[] = [
    { icon: <User className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'ប្រូហ្វាល់របស់ខ្ញុំ', route: '/settings/profile' },
    { icon: <ShieldCheck className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'សុវត្ថិភាព' },
    { icon: <Sparkles className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'មុខងារបន្ថែម', route: '/settings/features' },
    { icon: <Globe className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'ភាសា', value: 'ភាសាខ្មែរ' },
    { icon: <Volume2 className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'Voice 播报语言', value: VOICE_LABELS[voiceLang], onToggle: cycleVoice },
    { icon: <Phone className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'ទាក់ទងមកយើងខ្ញុំ' },
    { icon: <FileText className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'លក្ខខណ្ឌ' },
    { icon: <Briefcase className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2} />, label: 'មុខងារអាជីវករ ABA', toggle: abaBizOn, onToggle: setAbaBizOn },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#F3EDFF] via-[#FBF4FF] to-white font-sans flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#F3EDFF] to-transparent">
        <button onClick={() => setLocation('/')} className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800">
          <X className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <p className="text-[17px] font-bold text-gray-900 tracking-tight">ABA ការកំណត់ផ្សេងៗ</p>
        <div className="w-9" />
      </div>

      <div className="px-4 pb-10 flex flex-col flex-1">
        {/* Profile card */}
        <div className="mt-2 rounded-3xl bg-white/85 backdrop-blur shadow-[0_8px_24px_rgba(123,79,232,0.10)] overflow-hidden">
          <div className="px-5 pt-6 pb-5 flex flex-col items-center">
            <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-[3px] border-white shadow-md">
              <TomCatAvatar />
            </div>
            <p className="mt-3 text-[18px] font-extrabold text-gray-900 tracking-tight">Yukheang SOEU</p>
            <p className="mt-0.5 text-[13px] text-gray-500 font-medium">លេខសម្គាល់: 49399</p>
          </div>

          {/* Tabs */}
          <div className="px-5 pb-5">
            <div className="flex rounded-2xl bg-[#F1ECFB] p-1">
              <button
                onClick={() => setTab('personal')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${tab === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                បុគ្គល
              </button>
              <button
                onClick={() => setTab('business')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${tab === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                អាជីវករ ABA
              </button>
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div className="mt-3 rounded-3xl bg-white shadow-[0_8px_24px_rgba(123,79,232,0.08)] overflow-hidden divide-y divide-gray-100">
          {rows.map((r) => (
            <button
              key={r.label}
              onClick={() => (r.route ? setLocation(r.route) : r.onToggle?.(!r.toggle))}
              className="w-full px-5 py-4 flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
            >
              <span className="w-9 h-9 rounded-[10px] bg-[#F3EDFF] flex items-center justify-center shrink-0">{r.icon}</span>
              <span className="flex-1 text-[15px] font-semibold text-gray-800">{r.label}</span>
              {r.value && <span className="text-[13px] text-gray-500 font-medium">{r.value}</span>}
              {r.toggle !== undefined ? (
                <span
                  onClick={(e) => { e.stopPropagation(); r.onToggle?.(!r.toggle); }}
                  className={`w-[46px] h-[26px] rounded-full p-0.5 transition-colors ${r.toggle ? 'bg-[#7B4FE8]' : 'bg-gray-300'}`}
                  aria-pressed={r.toggle}
                >
                  <span className={`block w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${r.toggle ? 'translate-x-[18px]' : ''}`} />
                </span>
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2.2} />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[13px] text-gray-600 font-semibold">កម្មវិធី កំណែ: V 5.1.5</p>
          <p className="mt-1 text-[13px] text-gray-500">{lastLogin}</p>
          <p className="mt-3 text-[12px] text-gray-400 leading-relaxed">
            ផលិតផលស្នាដៃខ្មែរ បង្កើតនៅកម្ពុជា
            <br />
            <span className="font-semibold text-gray-500">PCI DSS Certified LEVEL 1 SERVICE PROVIDER</span>
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#E8002D] text-white text-[13px] font-extrabold tracking-wide">ABA BANK</span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide max-w-[110px] leading-tight text-left">NATIONAL BANK OF CANADA GROUP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
