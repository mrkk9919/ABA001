import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, ChevronDown, ChevronRight,
  CircleDollarSign, GraduationCap, HeartHandshake, HeartPulse, MapPin, Search,
  Shield, Ticket, Truck, X, PhoneCall, Wifi, Droplets, Landmark, Gamepad2, Plane, Baby,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type ServiceItem = {
  title: string;
  detail: string;
  color: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
};

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const featuredServices: ServiceItem[] = [
  { title: 'បញ្ចូលលុយទូរស័ព្ទ', detail: 'សេវាបញ្ចូលលុយគ្រប់បណ្តាញ', color: 'linear-gradient(145deg,#20bde0,#0782bf)', icon: PhoneCall },
  { title: 'អ៊ីនធឺណិត & ទូរទស្សន៍', detail: 'ទូទាត់អ៊ីនធឺណិត និងទូរទស្សន៍', color: 'linear-gradient(145deg,#14c7c7,#00939a)', icon: Wifi },
  { title: 'ទឹក ភ្លើង & សេវាកម្ម', detail: 'ទូទាត់វិក្កយបត្រប្រចាំខែ', color: 'linear-gradient(145deg,#55c5df,#258ab4)', icon: Droplets },
  { title: 'សេវាសាធារណៈ', detail: 'បង់ពន្ធ និងសេវារដ្ឋាភិបាល', color: 'linear-gradient(145deg,#ffc42c,#ee9410)', icon: Landmark },
];

const categories: ServiceItem[] = [
  { title: 'ធានារ៉ាប់រង', detail: 'ទទួលបានការការពារសម្រាប់អ្នក និងគ្រួសារ', color: 'linear-gradient(145deg,#ff3d6d,#dc174d)', icon: Shield },
  { title: 'ហិរញ្ញវត្ថុ & វិនិយោគ', detail: 'ទូទាត់ សន្សំ និងសេវាហិរញ្ញវត្ថុ', color: 'linear-gradient(145deg,#14c9bd,#009a9d)', icon: CircleDollarSign },
  { title: 'ការដឹកជញ្ជូន & មធ្យោបាយ', detail: 'ធ្វើដំណើរ និងដឹកជញ្ជូនទំនិញ', color: 'linear-gradient(145deg,#118fb9,#087093)', icon: Truck },
  { title: 'វិស័យអប់រំ', detail: 'សាលារៀន វគ្គសិក្សា និងសម្ភារៈសិក្សា', color: 'linear-gradient(145deg,#61d323,#26a916)', icon: GraduationCap },
  { title: 'ការកម្សាន្ត', detail: 'ល្បែង កីឡា និងពេលវេលារីករាយ', color: 'linear-gradient(145deg,#4e7df5,#0ca9dc)', icon: Gamepad2 },
  { title: 'សុខភាព & សម្រស់', detail: 'សេវាថែទាំសុខភាព និងសម្រស់', color: 'linear-gradient(145deg,#6197ff,#3b64d7)', icon: HeartPulse },
  { title: 'ទេសចរណ៍ & ដំណើរកម្សាន្ត', detail: 'សំបុត្រយន្តហោះ សណ្ឋាគារ និងទេសចរណ៍', color: 'linear-gradient(145deg,#8a75e7,#6054be)', icon: Plane },
  { title: 'សហគមន៍ & ការភ្ជាប់', detail: 'ភ្ជាប់ទំនាក់ទំនង និងជួយសហគមន៍', color: 'linear-gradient(145deg,#f34bba,#d52a91)', icon: HeartHandshake },
  { title: 'គ្រួសារ & កុមារ', detail: 'សេវាសម្រាប់កុមារ និងមនុស្សជាទីស្រឡាញ់', color: 'linear-gradient(145deg,#ff9b45,#ed7048)', icon: Baby },
  { title: 'សំបុត្រ & ព្រឹត្តិការណ៍', detail: 'ព្រឹត្តិការណ៍ក្នុងស្រុក និងសំបុត្រកម្សាន្ត', color: 'linear-gradient(145deg,#4eb8a3,#208b7e)', icon: Ticket },
];

const providerOptions = ['mak', '套餐', '自已'];

/* ─── Metfone red circle logo ───────────────────────────────────────────────── */
const MetfoneMark = () => (
  <span className="w-9 h-9 rounded-full bg-[#ed1728] flex items-center justify-center shrink-0">
    <span className="text-white font-bold text-[7px] tracking-tight">metfone</span>
  </span>
);

/* ─── Round icon ────────────────────────────────────────────────────────────── */
const RoundIcon = ({ color, icon: Icon }: { color: string; icon: ServiceItem['icon'] }) => (
  <span
    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
    style={{ background: color, boxShadow: '0 3px 7px rgba(27,42,46,.14), inset 0 1px 0 rgba(255,255,255,.27)' }}
  >
    <Icon size={23} strokeWidth={2.1} color="white" />
  </span>
);

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function Payments() {
  const [, navigate] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState('mak');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const visibleCategories = normalizedSearch
    ? categories.filter((c) =>
        `${c.title} ${c.detail}`.toLocaleLowerCase().includes(normalizedSearch),
      )
    : categories;

  const openService = (title: string) => {
    setNotice(`សេវា «${title}» នឹងបើកនៅទីនេះ`);
  };

  return (
    <main className="min-h-screen bg-[#f1f3f3] text-[#242a2d]" style={{ fontFamily: '"Noto Sans Khmer", "DM Sans", sans-serif' }}>
      <div
        className="w-full max-w-[440px] min-h-screen mx-auto overflow-hidden pb-10"
        style={{
          background: 'radial-gradient(ellipse at 92% 11%, rgba(220,228,229,.54), transparent 25%), #f1f3f3',
        }}
      >
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 pt-4">
          <button
            className="w-[42px] h-[42px] rounded-full bg-[rgba(222,227,228,.76)] flex items-center justify-center active:scale-95 transition-transform"
            aria-label="ត្រឡប់ក្រោយ"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={22} strokeWidth={2.1} color="#21292c" />
          </button>
          <div className="flex gap-2.5">
            <button
              className="w-[42px] h-[42px] rounded-full bg-[rgba(222,227,228,.76)] flex items-center justify-center active:scale-95 transition-transform"
              aria-label="កាលវិភាគ"
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarDays size={20} strokeWidth={1.9} color="#21292c" />
            </button>
            <button
              className="w-[42px] h-[42px] rounded-full bg-[rgba(222,227,228,.76)] flex items-center justify-center active:scale-95 transition-transform"
              aria-label="ស្វែងរក"
              onClick={() => setSearchOpen((o) => !o)}
            >
              {searchOpen ? <X size={20} color="#21292c" /> : <Search size={21} strokeWidth={2} color="#21292c" />}
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative min-h-[194px] px-6 pt-7 pb-6 flex items-center">
          <div className="relative z-10 max-w-[285px]">
            <h1 className="font-bold text-[25px] leading-[1.35] tracking-[-0.7px] text-[#20272a] mb-2">
              <span className="tracking-[-0.8px]">ABA<span className="text-[#d52232]">'</span></span> ទូទាត់ងាយ
            </h1>
            <p className="text-[#687276] text-[14px] leading-[1.85] font-normal max-w-[260px]">
              បង់វិក្កយបត្រ បញ្ចូលទឹកប្រាក់ និងស្វែងរកសេវាកម្មនៅជិតអ្នក
            </p>
          </div>
          <div className="absolute right-5 top-6 w-[115px] h-[126px] pointer-events-none" aria-hidden="true">
            <span
              className="absolute right-0 top-1 w-[78px] h-[78px] rounded-full flex items-center justify-center text-[#a8abad] font-medium text-[50px]"
              style={{ background: 'linear-gradient(145deg,#daddde,#c7cbcd)', boxShadow: '0 5px 11px rgba(62,71,72,.10), inset 0 1px 3px rgba(255,255,255,.8)', fontFamily: '"DM Sans",sans-serif' }}
            >
              $
            </span>
            <span
              className="absolute left-1 bottom-0 w-[74px] h-[74px] rounded-full flex items-center justify-center text-[#a99c7b] font-medium text-[39px]"
              style={{ background: 'linear-gradient(145deg,#e3dfd2,#cbc5b4)', boxShadow: '0 5px 11px rgba(62,71,72,.10), inset 0 1px 3px rgba(255,255,255,.8)', fontFamily: '"DM Sans",sans-serif' }}
            >
              ៛
            </span>
          </div>
        </section>

        {/* Content */}
        <div
          className="mt-px rounded-t-[28px] bg-[#f8f9f9] px-5 pt-6 pb-8"
          style={{ boxShadow: '0 -7px 24px rgba(43,53,56,.035)' }}
        >
          {/* Search panel */}
          {searchOpen && (
            <div className="mb-5 px-3 py-2.5 flex items-center gap-2 border border-[#e8eded] rounded-[15px] bg-white text-[#879194]">
              <Search size={18} />
              <input
                autoFocus
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកសេវាកម្ម..."
                aria-label="ស្វែងរកសេវាកម្ម"
                className="w-full border-0 outline-0 bg-transparent text-[#323a3d] text-[13px]"
              />
              {searchTerm && (
                <button
                  className="w-[30px] h-[30px] flex items-center justify-center"
                  aria-label="លុបពាក្យស្វែងរក"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Phone services */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2.5 mx-0.5 mb-3.5">
              <h2 className="text-[18px] leading-[1.5] font-bold tracking-[-0.2px]">សេវាទូរស័ព្ទ</h2>
              <button
                className="inline-flex items-center gap-1 text-[#16aabd] text-[13px] font-semibold"
                onClick={() => setNotice('ជ្រើសរើសកញ្ចប់ Metfone ដែលសមស្របសម្រាប់អ្នក')}
              >
                មើលទាំងអស់ <ChevronRight size={15} />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-1 hide-scrollbar">
              {providerOptions.map((provider) => (
                <button
                  key={provider}
                  className={`flex-shrink-0 min-w-[145px] h-[57px] flex items-center gap-2.5 px-3 py-2 border rounded-[18px] bg-white text-[#343a3d] text-[14px] active:scale-95 transition-all ${
                    selectedProvider === provider
                      ? 'border-[#14b8c4]'
                      : 'border-[#edf0f0]'
                  }`}
                  style={selectedProvider === provider ? { boxShadow: '0 0 0 2px rgba(20,184,196,.1)' } : { boxShadow: '0 3px 9px rgba(38,51,53,.045)' }}
                  onClick={() => {
                    setSelectedProvider(provider);
                    setNotice(`បានជ្រើសរើសកញ្ចប់ ${provider}`);
                  }}
                >
                  <MetfoneMark />
                  <span className="whitespace-nowrap">{provider}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Location card */}
          <section
            className="relative flex items-center gap-3 min-h-[102px] my-6 px-3.5 py-4 overflow-hidden rounded-[21px]"
            style={{ background: 'linear-gradient(112deg,#f5fbfc 0%,#e3f0f3 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)' }}
            aria-label="សេវាកម្មនៅជិតអ្នក"
          >
            <div className="w-[54px] h-[54px] flex items-center justify-center shrink-0 text-[#12a4ba]" style={{ filter: 'drop-shadow(0 4px 4px rgba(7,75,91,.15))' }}>
              <MapPin size={40} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-[14px] leading-[1.55] font-bold">
                {nearby ? 'សេវាកម្មនៅភ្នំពេញ' : 'ស្វែងរកសេវាកម្មនៅជិតអ្នក'}
              </strong>
              <span className="block text-[#839094] text-[11px] leading-[1.65] mt-1">
                {nearby ? 'បង្ហាញទីតាំងសេវាកម្មដែលនៅក្បែរអ្នក' : 'អនុញ្ញាតឲ្យយើងជួយស្វែងរកសេវាកម្មក្នុងតំបន់'}
              </span>
            </div>
            <button
              className="flex-shrink-0 inline-flex justify-center items-center gap-1.5 rounded-[24px] px-3.5 py-2.5 bg-[#0d4054] text-white text-[12px] font-bold active:scale-95 transition-transform"
              onClick={() => {
                setNearby((c) => !c);
                setNotice(nearby ? 'បានបិទការស្វែងរកទីតាំង' : 'កំពុងបង្ហាញសេវាកម្មក្បែរអ្នក');
              }}
            >
              <MapPin size={14} /> {nearby ? 'ទីតាំង' : 'ចាប់ផ្តើម'}
            </button>
          </section>

          {/* Featured services */}
          <section className="mb-6">
            <div className="flex items-center justify-between gap-2.5 mx-0.5 mb-3.5">
              <h2 className="text-[18px] leading-[1.5] font-bold tracking-[-0.2px]">ប្រើប្រាស់ញឹកញាប់</h2>
              <button
                className="inline-flex items-center gap-1 text-[#16aabd] text-[13px] font-semibold"
                onClick={() => setNotice('សេវាកម្មដែលអ្នកប្រើញឹកញាប់')}
              >
                មើលទាំងអស់ <ChevronRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {featuredServices.map(({ title, detail, color, icon: Icon }, index) => (
                <button
                  key={title}
                  className="min-h-[174px] flex flex-col items-start p-4 text-left border border-[#edf0f0] rounded-[21px] bg-white active:scale-95 transition-all"
                  style={{ boxShadow: '0 4px 10px rgba(35,46,49,.055)' }}
                  onClick={() => openService(title)}
                >
                  <RoundIcon color={color} icon={Icon} />
                  <strong className="block mt-2.5 text-[13px] leading-[1.5] font-bold">{title}</strong>
                  <small className="block mt-1 text-[#8a9295] text-[10px] leading-[1.6]">{detail}</small>
                  {index === 0 && (
                    <div className="flex gap-1 mt-auto pt-2">
                      <i className="min-w-[24px] px-1 py-0.5 rounded text-white text-[6px] font-semibold not-italic text-center" style={{ background: '#159a65' }}>smart</i>
                      <i className="min-w-[24px] px-1 py-0.5 rounded text-white text-[6px] font-semibold not-italic text-center" style={{ background: '#f3a725' }}>cellcard</i>
                      <i className="min-w-[24px] px-1 py-0.5 rounded text-white text-[6px] font-semibold not-italic text-center" style={{ background: '#ef2443' }}>metfone</i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between gap-2.5 mx-0.5 mb-3.5">
              <h2 className="text-[18px] leading-[1.5] font-bold tracking-[-0.2px]">
                {normalizedSearch ? 'លទ្ធផលស្វែងរក' : 'សេវាកម្មផ្សេងៗ'}
              </h2>
              <button
                className="inline-flex items-center gap-1 text-[#16aabd] text-[13px] font-semibold"
                onClick={() => setSearchOpen(true)}
              >
                ស្វែងរក <Search size={14} />
              </button>
            </div>
            {visibleCategories.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {visibleCategories.map(({ title, detail, color, icon: Icon }) => (
                  <button
                    key={title}
                    className="w-full min-h-[83px] flex items-center gap-3.5 px-3.5 py-3 border border-[#edf0f0] rounded-[20px] bg-white text-left active:scale-95 transition-all"
                    style={{ boxShadow: '0 4px 10px rgba(35,46,49,.05)' }}
                    onClick={() => openService(title)}
                  >
                    <span
                      className="w-[47px] h-[47px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: color, boxShadow: '0 3px 7px rgba(27,42,46,.14), inset 0 1px 0 rgba(255,255,255,.27)' }}
                    >
                      <Icon size={22} strokeWidth={2} color="white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[14px] leading-[1.55] font-bold">{title}</strong>
                      <small className="block mt-0.5 text-[#92999c] text-[10px] leading-[1.55]">{detail}</small>
                    </span>
                    <ChevronRight size={20} strokeWidth={2.2} className="flex-shrink-0 text-[#aab1b3]" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 rounded-[18px] bg-white text-[#858d91] text-center text-[13px]">
                រកមិនឃើញសេវាកម្មទេ។ សូមសាកល្បងពាក្យផ្សេង។
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="flex items-center justify-center gap-2 mt-7 text-[#9aa2a4]">
            <BadgeCheck size={15} />
            <span className="text-[11px]">សេវាកម្មងាយស្រួល និងមានសុវត្ថិភាព</span>
            <ArrowUpRight size={14} />
          </footer>
        </div>
      </div>

      {/* Notice toast */}
      {notice && (
        <div
          role="status"
          className="fixed z-50 left-1/2 bottom-5 w-max max-w-[calc(100%-36px)] -translate-x-1/2 px-4 py-2.5 border border-white/10 rounded-[30px] bg-[#183b48] text-white text-[12px] leading-[1.5]"
          style={{ boxShadow: '0 8px 24px rgba(16,43,53,.2)' }}
        >
          {notice}
        </div>
      )}

      {/* Calendar sheet */}
      {calendarOpen && (
        <div
          className="fixed inset-0 z-50 grid items-end bg-[rgba(25,37,41,.3)]"
          onClick={() => setCalendarOpen(false)}
          role="presentation"
        >
          <section
            className="w-full max-w-[440px] mx-auto px-6 pt-5 pb-8 rounded-t-[25px] bg-[#fbfcfc]"
            style={{ boxShadow: '0 -12px 32px rgba(21,44,50,.13)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aba-calendar-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2.5">
              <h3 id="aba-calendar-title" className="text-[18px] font-bold">កាលវិភាគទូទាត់</h3>
              <button
                className="w-[42px] h-[42px] rounded-full bg-[rgba(222,227,228,.76)] flex items-center justify-center"
                aria-label="បិទ"
                onClick={() => setCalendarOpen(false)}
              >
                <X size={19} color="#21292c" />
              </button>
            </div>
            <p className="text-[#7c878a] text-[13px] leading-[1.7] mb-4">
              រំលឹកខ្លួនអ្នកអំពីថ្ងៃបង់វិក្កយបត្រ និងសេវាកម្មប្រចាំខែ។
            </p>
            <div className="flex items-center gap-3 p-3 rounded-[15px] bg-[#f0f6f7] text-[#184255] text-[12px] leading-[1.6]">
              <CalendarDays size={22} />
              <span>
                <strong>មិនទាន់មានការរំលឹក</strong>
                <br />
                បន្ថែមការរំលឹកបង់ប្រាក់ ដើម្បីកុំឲ្យខកខាន
              </span>
              <ChevronDown size={17} className="ml-auto" />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
