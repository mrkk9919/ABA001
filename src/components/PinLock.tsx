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
  const [faceScanning, setFaceScanning] = useState(false);

  /* Face unlock — tries real device biometrics (Face ID / fingerprint) via
     WebAuthn; on devices without it, shows the scanning animation and
     unlocks after 2s (demo mode). */
  const tryFaceUnlock = async () => {
    setFaceScanning(true);
    try {
      const PKC = (window as any).PublicKeyCredential;
      if (PKC?.isUserVerifyingPlatformAuthenticatorAvailable) {
        const avail = await PKC.isUserVerifyingPlatformAuthenticatorAvailable();
        if (avail) {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          await (navigator as any).credentials.get({
            publicKey: { challenge, allowCredentials: [], userVerification: 'required', timeout: 25000 },
          });
        }
      }
    } catch { /* biometric unavailable — fall through to simulated scan */ }
    await new Promise((r) => setTimeout(r, 2000));
    setFaceScanning(false);
    onUnlock();
  };

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

  const keys: (string | null)[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', '⌫'];

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
          if (k === 'face') {
            return (
              <button
                key={i}
                onClick={tryFaceUnlock}
                className="h-16 w-16 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Face unlock"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                  <circle cx="9" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="10" r="1" fill="currentColor" />
                  <path d="M9 15c.8.7 1.9 1 3 1s2.2-.3 3-1" />
                </svg>
              </button>
            );
          }
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

      {/* Face scanning overlay */}
      {faceScanning && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: 'rgba(10,20,38,0.96)' }}>
          <div className="relative w-44 h-44">
            {/* Corner brackets */}
            {[
              'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
              'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
              'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
              'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
            ].map((cls, i) => (
              <span key={i} className={`absolute w-10 h-10 border-[#E8002D] ${cls}`} />
            ))}
            {/* Face icon inside */}
            <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto w-20 h-20 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M9 15c.8.7 1.9 1 3 1s2.2-.3 3-1" />
              <path d="M5 8v-.5A6.5 6.5 0 0 1 11.5 1h1A6.5 6.5 0 0 1 19 7.5V8M12 19v2" />
            </svg>
            {/* Scanning line */}
            <div className="absolute left-2 right-2 h-0.5 bg-[#E8002D] shadow-[0_0_12px_#E8002D]" style={{ animation: 'faceScan 1.6s ease-in-out infinite alternate' }} />
          </div>
          <p className="mt-8 text-white text-[15px] font-semibold tracking-wide">កំពុងស្គេមមុខ...</p>
          <p className="mt-1 text-white/50 text-[12px]">Scanning face · align your face</p>
        </div>
      )}

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes faceScan {
          0% { top: 8%; }
          100% { top: 92%; }
        }
      `}</style>
    </div>
  );
};

export default PinLock;
