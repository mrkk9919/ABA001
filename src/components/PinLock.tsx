import React, { useState } from 'react';

/* ─── ABA-style 6-digit PIN lock ──────────────────────────────────────────────
   Used at app launch (every fresh entry) and before the personal center.
   The correct PIN is 888000 (user-specified). Wrong PIN shakes the dots and
   clears. Unlock state is kept in sessionStorage so a refresh / new tab
   re-prompts (matches "每次进入都要输密码"). */
export const APP_PIN = '888000';
const PIN_LEN = 6;

const PinLock = ({
  title = 'បញ្ចូលលេខសម្ងាត់',
  subtitle = 'Enter your PIN to continue',
  storageKey,
  onUnlock,
}: {
  title?: string;
  subtitle?: string;
  storageKey: string;
  onUnlock: () => void;
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const press = (d: string) => {
    if (pin.length >= PIN_LEN) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LEN) {
      if (next === APP_PIN) {
        try { sessionStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 650);
      }
    }
  };

  const backspace = () => { setError(false); setPin((p) => p.slice(0, -1)); };

  const keys: (string | null)[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', '⌫'];

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-between py-12 px-8 select-none"
      style={{
        background: 'linear-gradient(170deg, #0F1B33 0%, #16264A 55%, #0A1426 100%)',
        fontFamily: '"DM Sans", "Noto Sans Khmer", sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[26px] font-extrabold tracking-wide"
          style={{ background: 'linear-gradient(135deg, #E8002D, #B30022)', boxShadow: '0 8px 24px rgba(232,0,45,.35)' }}
        >
          ABA
        </div>
        <h1 className="text-white text-[20px] font-bold mt-2">{title}</h1>
        <p className="text-white/50 text-[13px]">{subtitle}</p>
      </div>

      {/* Dots */}
      <div
        className="flex gap-4"
        style={error ? { animation: 'pinShake 0.45s ease-in-out' } : undefined}
      >
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-150"
            style={{
              borderColor: error ? '#E8002D' : 'rgba(255,255,255,0.4)',
              backgroundColor: i < pin.length ? (error ? '#E8002D' : '#fff') : 'transparent',
              transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      {error && (
        <p className="text-[#FF6B7A] text-[13px] font-medium -mt-2">លេខសម្ងាត់មិនត្រឹមត្រូវ · Incorrect PIN</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-x-10 gap-y-5 w-full max-w-[300px]">
        {keys.map((k, i) => {
          if (k === null) return <span key={i} />;
          if (k === '⌫') {
            return (
              <button
                key={i}
                onClick={backspace}
                className="h-16 flex items-center justify-center text-white/70 active:scale-90 transition-transform"
                aria-label="Delete"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => press(k)}
              className="h-16 w-16 rounded-full text-white text-[26px] font-medium flex items-center justify-center active:bg-white/15 active:scale-92 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {k}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default PinLock;
