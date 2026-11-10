import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight, Bell, ChartNoAxesColumnIncreasing, CreditCard, Eye, EyeOff, Gift,
  MessageCircle, MoreHorizontal, QrCode, Receipt, Repeat2, Send,
  Settings, ShoppingBag, Smartphone, Wallet,
} from 'lucide-react';
import { defaultAccount } from '@/data/accounts';
import { getBalance } from '@/lib/balanceStore';
import { loadTheme, saveTheme, type ThemeConfig } from '@/lib/homeThemes';
import { ThemeModal } from '@/components/home/ThemeModal';
import { ThemeAvatar } from '@/components/home/ThemeAvatar';
import { GramophoneIllustration } from '@/components/home/GramophoneIllustration';
import {
  RetroAlbumIcon, RetroCameraIcon, RetroCashIcon, RetroCompactIcon,
  RetroSuitcaseIcon, RetroTicketIcon,
} from '@/components/home/RetroIcons';

const promoImage = `${import.meta.env.BASE_URL}images/pickup-campaign.jpg`;

const shortcuts = [
  { label: 'ផ្ទេរប្រាក់', english: 'Transfer', tint: 'mint', route: '/transfer', icon: Send },
  { label: 'ទូទាត់វិក្កយបត្រ', english: 'Pay bills', tint: 'peach', route: '/payments', icon: Receipt },
  { label: 'បញ្ចូលកាត', english: 'Mobile top up', tint: 'gold', route: '/pay', icon: CreditCard },
  { label: 'គណនី', english: 'Accounts', tint: 'blue', route: '/accounts', icon: Wallet },
  { label: 'ស្កេនបង់ប្រាក់', english: 'Scan to pay', tint: 'rose', route: '/scan', icon: QrCode },
  { label: 'សេវាកម្មផ្សេងៗ', english: 'More services', tint: 'lilac', route: '/settings/features', icon: MoreHorizontal },
];

const retroShortcuts = [
  { label: 'គណនី', english: 'Accounts', route: '/accounts', render: () => <RetroCompactIcon size={46} /> },
  { label: 'កាត', english: 'Cards', route: '/cards', render: () => <RetroTicketIcon size={46} /> },
  { label: 'ទូទាត់', english: 'Payments', route: '/payments', render: () => <RetroCashIcon size={46} /> },
  { label: 'ABA ស្កែន', english: 'ABA Scan', route: '/scan', render: () => <RetroCameraIcon size={46} /> },
  { label: 'គំរូទូទាត់ប្រចាំ', english: 'Templates', route: '/payments', render: () => <RetroAlbumIcon size={46} /> },
  { label: 'ផ្ទេរប្រាក់', english: 'Transfer', route: '/transfer', render: () => <RetroSuitcaseIcon size={46} /> },
];

const providers = [
  { title: 'Cellcard', khmer: 'សែលកាត', mark: 'C', color: '#d93e50', route: '/pay', icon: Smartphone },
  { title: 'Smart', khmer: 'ស្មាត', mark: 'S', color: '#26986b', route: '/pay', icon: Smartphone },
  { title: 'Cinema', khmer: 'សំបុត្រកុន', mark: 'PLAY', color: '#7651a1', route: '/payments', icon: Receipt },
  { title: 'Markets', khmer: 'ផ្សារ និងហាង', mark: 'M', color: '#e68e42', route: '/payments', icon: ShoppingBag },
  { title: 'Travel', khmer: 'ទេសចរណ៍', mark: 'GO', color: '#477a87', route: '/payments', icon: ArrowRight },
];

const tools = [
  { title: 'កំណត់រហ័ស', subtitle: 'Quick settings', color: 'tool-violet', route: '/settings', icon: Settings },
  { title: 'គ្រប់គ្រងកាត', subtitle: 'Manage your cards', color: 'tool-navy', route: '/cards', icon: CreditCard },
  { title: 'សង្ខេបចំណាយ', subtitle: 'Spending summary', color: 'tool-plum', route: '/accounts', icon: ChartNoAxesColumnIncreasing },
  { title: 'រង្វាន់ និងអត្ថប្រយោជន៍', subtitle: 'Rewards & benefits', color: 'tool-coral', route: '/settings/features', icon: Gift },
];

export default function HomeRedesign({ onSwitch }: { onSwitch: () => void }) {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig>(() => loadTheme());
  const [themeOpen, setThemeOpen] = useState(false);

  const isSixties = theme.id === 'sixties';
  const balance = Number(getBalance(defaultAccount.id, defaultAccount.balance) ?? defaultAccount.balance);
  const formattedBalance = `$${balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const applyTheme = (next: ThemeConfig) => {
    setTheme(next);
    saveTheme(next);
  };

  return (
    <main
      className="relative mx-auto flex h-[100dvh] min-h-[620px] w-full max-w-[420px] flex-col overflow-hidden bg-[#756f5c] font-sans text-[#463e35]"
      style={{
        backgroundImage: `url('${theme.bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(63,105,96,.48) 0%, rgba(66,83,73,.27) 23%, rgba(65,60,50,.46) 67%, rgba(77,68,56,.55) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex-1 overflow-y-auto px-4 pb-6 pt-4 [scrollbar-width:none]">
        {/* Top actions */}
        <div className="flex h-8 items-center justify-end gap-3.5 text-[#fff9ec]">
          <button type="button" aria-label="Messages" onClick={() => setLocation('/chat')} className="relative active:scale-95 transition-transform">
            <MessageCircle size={21} />
          </button>
          <button type="button" aria-label="Notifications" onClick={() => setLocation('/notifications')} className="relative active:scale-95 transition-transform">
            <Bell size={21} />
            <span className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full border border-[#f7ead1] bg-[#e55c4e]" />
          </button>
          <button type="button" aria-label="Scan code" onClick={() => setLocation('/scan')} className="active:scale-95 transition-transform">
            <QrCode size={21} />
          </button>
          <button
            type="button"
            aria-label="ABA Pay QR"
            onClick={() => setLocation('/scan')}
            className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[#d84c43] text-[#fff9e9] shadow-[0_3px_9px_#423f343a] active:scale-95 transition-transform"
          >
            <QrCode size={18} />
          </button>
          <button
            type="button"
            aria-label="切换主页设计"
            title="切换主页设计"
            onClick={onSwitch}
            className="grid h-[30px] w-[30px] place-items-center rounded-[9px] border border-white/40 bg-white/15 active:scale-95 transition-transform"
          >
            <Repeat2 size={17} />
          </button>
        </div>

        {/* Profile */}
        <header className="mb-4 mt-[19px] flex items-center gap-3 px-1.5 text-[#fff9e9]">
          <ThemeAvatar themeId={theme.id} onClick={() => setLocation('/settings/profile')} />
          <button type="button" onClick={() => setLocation('/settings/profile')} className="flex flex-col items-start text-left">
            <span className="text-[12px] leading-relaxed opacity-95">{theme.greetingKh}</span>
            <span className="text-[19px] font-bold leading-tight tracking-wide">Yukheang</span>
          </button>
        </header>

        {/* Balance card */}
        <section
          className="relative overflow-hidden rounded-[23px] border border-[#fffcec]/65 shadow-[0_12px_34px_rgba(49,43,34,.16)] backdrop-blur-xl"
          style={{ background: theme.cardTint }}
          aria-label="Account overview"
        >
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-semibold text-[#82786a]">សមតុល្យដែលអាចប្រើបាន</p>
                <p className="text-[24px] font-bold leading-tight tracking-tight text-[#443e34]" data-balance>
                  {showBalance ? formattedBalance : '••••••••'}
                  {showBalance && <span className="ml-1 text-[13px] font-semibold text-[#443e34]">USD</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSixties && (
                  <div className="pointer-events-none h-[62px] w-[62px] opacity-95">
                    <GramophoneIllustration />
                  </div>
                )}
                <button
                  type="button"
                  aria-label={showBalance ? 'លាក់ចំនួនទឹកប្រាក់' : 'បង្ហាញចំនួនទឹកប្រាក់'}
                  onClick={() => setShowBalance((value) => !value)}
                  className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#d8e8d9] text-[#4f806f] active:scale-95 transition-transform"
                >
                  {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[#776c5e]">
              <span className="rounded-md bg-[#e3ebd9] px-2 py-1 font-semibold text-[#527563]">
                {isSixties ? 'គណនីគោល W' : 'គណនីសន្សំ'}
              </span>
              <span>{defaultAccount.name}</span>
              <span className="font-mono tracking-widest text-[#8d7c66]">•• {defaultAccount.number.slice(-4)}</span>
            </div>

            <div className="my-3 h-px bg-[#665b47]/10" />

            <div className="grid grid-cols-3">
              {isSixties
                ? [
                    { label: 'ទទួលលុយ', icon: Receipt, route: '/receive' },
                    { label: 'ផ្ញើលុយ', icon: Send, route: '/transfer' },
                    { label: 'វិភាគ', icon: ChartNoAxesColumnIncreasing, route: '/accounts' },
                  ].map(({ label, icon: Icon, route }, index) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setLocation(route)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-[#516e61] ${index ? 'border-l border-[#5c503e]/20' : ''}`}
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  ))
                : [
                    { label: 'គណនី', icon: Wallet, route: '/accounts' },
                    { label: 'ផ្ទេរប្រាក់', icon: Send, route: '/transfer' },
                    { label: 'ប្រវត្តិ', icon: ChartNoAxesColumnIncreasing, route: '/accounts' },
                  ].map(({ label, icon: Icon, route }, index) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setLocation(route)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-[#516e61] ${index ? 'border-l border-[#5c503e]/20' : ''}`}
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
            </div>
          </div>
        </section>

        {/* Everyday banking shortcuts */}
        <section className="mt-5" aria-label="Everyday banking">
          <div className="grid grid-cols-3 gap-2">
            {isSixties
              ? retroShortcuts.map(({ label, english, route, render }) => (
                  <button
                    type="button"
                    key={english}
                    title={english}
                    onClick={() => setLocation(route)}
                    className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-[26px] border border-white/70 bg-[#fcfaf4]/95 px-1 py-2.5 shadow-[0_4px_14px_rgba(45,38,30,.08)] transition-transform active:scale-95"
                  >
                    <span className="flex h-12 w-12 items-center justify-center">{render()}</span>
                    <span className="text-center text-[13px] font-bold leading-tight text-[#4a3e35]">{label}</span>
                  </button>
                ))
              : shortcuts.map(({ label, english, tint, route, icon: Icon }) => (
                  <button
                    type="button"
                    key={english}
                    onClick={() => setLocation(route)}
                    className="flex min-h-[98px] flex-col items-center justify-center gap-2 rounded-[20px] border border-white/65 bg-[#faf7ea]/95 text-[#6b5749] shadow-[0_7px_18px_rgba(55,49,38,.14)] transition-transform active:scale-95"
                  >
                    <span className={`grid h-[39px] w-[39px] place-items-center rounded-[14px] ${tint}`}>
                      <Icon size={22} />
                    </span>
                    <span className="flex flex-col items-center gap-0.5 text-center text-[11px] font-semibold leading-snug">
                      {label}
                      <span className="text-[9px] font-medium text-[#968a78]">{english}</span>
                    </span>
                  </button>
                ))}
          </div>

          <div className="mt-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {[
              { label: 'មីនីអាប់', icon: Smartphone, route: '/settings/features' },
              { label: 'អាជីវករ ABA', icon: ShoppingBag, route: '/payments' },
              { label: 'សេវាហិរញ្ញវត្ថុ', icon: Wallet, route: '/accounts' },
            ].map(({ label, icon: Icon, route }) => (
              <button
                type="button"
                key={label}
                onClick={() => setLocation(route)}
                className="flex min-h-[43px] shrink-0 items-center gap-2 rounded-[18px] border border-white/55 bg-[#f9f6e7]/95 px-3.5 text-[10px] font-semibold text-[#746253] shadow-[0_4px_12px_#493c2f24]"
              >
                <Icon size={17} className="text-[#6b967d]" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* News & promotions */}
        <section className="mt-5" aria-label="Promotions">
          <div className="mb-2.5 flex items-center justify-between px-1 text-[#fff8e6] drop-shadow">
            <div>
              <h2 className="text-[17px] font-bold leading-snug">ដំណឹង និង ប្រូម៉ូសិន</h2>
              <p className="mt-0.5 text-[10px] text-white/80">News &amp; promotions</p>
            </div>
            <button type="button" onClick={() => setLocation('/payments')} className="flex items-center gap-1 text-[10px] font-semibold">
              See all <ArrowRight size={13} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLocation('/payments')}
            aria-label="Explore the vehicle offer"
            className="relative block h-[156px] w-full overflow-hidden rounded-[23px] border border-white/55 text-left shadow-[0_10px_24px_rgba(42,39,34,.22)] active:scale-[0.99] transition-transform"
            style={{ background: `#a84136 url(${promoImage}) center / cover no-repeat` }}
          >
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(49,48,52,.66),rgba(49,48,52,.1)_70%),linear-gradient(0deg,rgba(29,37,39,.28),transparent_54%)]" />
            <span className="absolute left-[15px] top-[14px] z-[2] block max-w-[190px] text-[#fff8eb]">
              <span className="inline-flex rounded-full bg-[#be403d] px-2 py-1 text-[8px] font-bold uppercase tracking-widest">
                ABA KHQR · LOCAL OFFER
              </span>
              <span className="mt-2 block text-[16px] font-bold leading-snug drop-shadow">បើកផ្លូវថ្មី<br />ជាមួយរថយន្តថ្មី</span>
              <span className="mt-1 block text-[10px] text-[#fff2dd]">A new road ahead. Explore auto loan offers.</span>
            </span>
            <span className="absolute bottom-[13px] right-[14px] z-[2] inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-[#3d625d]/80 px-2.5 py-1.5 text-[9px] font-bold text-white">
              Discover <ArrowRight size={12} />
            </span>
            <span className="absolute bottom-[14px] left-1/2 z-[2] flex -translate-x-1/2 gap-1">
              <i className="block h-[5px] w-[15px] rounded-[10px] bg-white" />
              <i className="block h-[5px] w-[5px] rounded-[10px] bg-white/60" />
              <i className="block h-[5px] w-[5px] rounded-[10px] bg-white/60" />
            </span>
          </button>
        </section>

        {/* Popular services */}
        <section className="mt-5" aria-label="Popular services">
          <div className="mb-2.5 flex items-center justify-between px-1 text-[#fff8e6] drop-shadow">
            <div>
              <h2 className="text-[17px] font-bold leading-snug">មីនីអាប់</h2>
              <p className="mt-0.5 text-[10px] text-white/80">Popular services</p>
            </div>
            <button type="button" onClick={() => setLocation('/settings/features')} className="flex items-center gap-1 text-[10px] font-semibold">
              See all <ArrowRight size={13} />
            </button>
          </div>
          <div className="flex snap-x gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {providers.map(({ title, khmer, mark, color, route, icon: Icon }) => (
              <button
                type="button"
                key={title}
                onClick={() => setLocation(route)}
                className="flex min-h-[139px] w-[100px] shrink-0 snap-start flex-col items-center rounded-[22px] border border-white/45 bg-[#f1ebd8]/80 px-2 py-3 shadow-[0_8px_22px_#3e393028] transition-transform active:scale-95"
              >
                <span
                  className="mb-2 grid h-[68px] w-[68px] place-items-center rounded-[20px] border-2 border-white/75 text-white shadow-[0_5px_11px_#42382b2e]"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={24} />
                </span>
                <span className="text-[10px] font-bold text-[#584c41]">{title}</span>
                <span className="mt-1 text-center text-[9px] leading-snug text-[#817563]">{khmer}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Useful tools */}
        <section className="mt-5 pb-1" aria-label="Banking tools">
          <div className="mb-2.5 flex items-center justify-between px-1 text-[#fff8e6] drop-shadow">
            <div>
              <h2 className="text-[17px] font-bold leading-snug">ការគ្រប់គ្រងគណនី</h2>
              <p className="mt-0.5 text-[10px] text-white/80">Useful tools, close at hand</p>
            </div>
            <button type="button" onClick={() => setLocation('/settings')} className="flex items-center gap-1 text-[10px] font-semibold">
              Explore <ArrowRight size={13} />
            </button>
          </div>
          <div className="flex snap-x gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {tools.map(({ title, subtitle, color: tone, route, icon: Icon }) => (
              <button
                type="button"
                key={title}
                onClick={() => setLocation(route)}
                className={`relative flex h-[190px] w-[145px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[22px] border border-white/30 p-3.5 text-left text-white shadow-[0_10px_22px_#25262946] ${tone} active:scale-95 transition-transform`}
              >
                <span className="grid h-[67px] w-[67px] place-items-center rounded-[21px] bg-white/15 shadow-[inset_0_0_0_1px_#ffffff26]">
                  <Icon size={34} />
                </span>
                <span className="flex flex-col gap-1 text-[12px] font-bold leading-snug">
                  {title}
                  <small className="text-[9px] font-medium text-white/70">{subtitle}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setThemeOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#e3f3df]/95 px-4.5 py-2.5 text-[11px] font-bold text-[#668276] shadow-[0_5px_14px_#40392d29] active:scale-95 transition-transform"
            >
              <MoreHorizontal size={16} />
              កែប្រែទម្រង់អេក្រង់
            </button>
          </div>
          <p className="mb-3 mt-3.5 px-1 text-center text-[9px] tracking-wide text-white/75">
            A little of Phnom Penh, wherever your day takes you.
          </p>
        </section>
      </div>


      {themeOpen && (
        <ThemeModal
          onClose={() => setThemeOpen(false)}
          activeThemeId={theme.id}
          onSelectTheme={applyTheme}
          lang="kh"
        />
      )}

      <style>{`
        .mint { color: #51816f; background: #d9ebd9; }
        .peach { color: #bf6e54; background: #f5dfcb; }
        .gold { color: #a17b41; background: #f2e7c5; }
        .blue { color: #557c8b; background: #dce9e8; }
        .rose { color: #ba655b; background: #f3ded6; }
        .lilac { color: #7d6e8d; background: #e9e1e8; }
        .tool-violet { background: linear-gradient(145deg,#6655a3,#342f58 82%); }
        .tool-navy { background: linear-gradient(145deg,#4e7180,#172b40 78%); }
        .tool-plum { background: linear-gradient(145deg,#7a4387,#30233f 83%); }
        .tool-coral { background: linear-gradient(145deg,#bd654f,#603945 82%); }
      `}</style>
    </main>
  );
}
