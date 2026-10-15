import React, { useMemo, useState, type CSSProperties } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Search, X,
} from 'lucide-react';

type Channel = {
  name: string;
  subtitle?: string;
  mark: string;
  tone: string;
  textTone?: string;
};

const nearbyBanks: Channel[] = [
  { name: 'ACLEDA', mark: 'A', tone: '#3c3028' },
  { name: 'ICBC', mark: '✦', tone: '#ed1734' },
  { name: 'Canadia', mark: 'C', tone: '#4b685d' },
];

const localChannels: Channel[] = [
  { name: 'ផ្ទេរប្រាក់ទៅធនាគារក្នុងស្រុក', subtitle: 'ផ្ទេរទៅធនាគារក្នុងប្រទេសកម្ពុជា', mark: '↔', tone: '#08a4d5' },
  { name: 'ផ្ទេរប្រាក់ ABA', subtitle: 'ផ្ទេរប្រាក់ទៅគណនី ABA', mark: 'ABA', tone: '#175374' },
  { name: 'ផ្ទេរទៅកាន់ Wallet', subtitle: 'ផ្ទេរទៅកាន់កាបូប Wallet ក្នុងស្រុក', mark: '▥', tone: '#ed4a7d' },
  { name: 'ផ្ទេរតាមលេខទូរស័ព្ទ', subtitle: 'ផ្ញើប្រាក់បានងាយស្រួល', mark: 'e', tone: '#00a98c' },
];

const abroadChannels: Channel[] = [
  { name: 'Ria', subtitle: 'សេវាផ្ទេរប្រាក់', mark: 'ria', tone: '#f56a00' },
  { name: 'DBP Remit', subtitle: 'ផ្ទេរប្រាក់អន្តរជាតិ', mark: 'DBP', tone: '#1119dc' },
  { name: 'MoneyGram', subtitle: 'ផ្ទេរប្រាក់អន្តរជាតិ', mark: 'M', tone: '#fff', textTone: '#e93437' },
  { name: 'Western Union', subtitle: 'ផ្ញើប្រាក់ទៅក្រៅប្រទេស', mark: 'W', tone: '#ffda00', textTone: '#111' },
  { name: 'SWIFT', subtitle: 'សេវាផ្ទេរប្រាក់អន្តរជាតិ', mark: '◎', tone: '#f5a39d' },
];

const cardChannels: Channel[] = [
  { name: 'Visa Direct', mark: 'VISA', tone: '#205a9d' },
  { name: 'UnionPay MoneyExpress', mark: 'UP', tone: '#057e82', textTone: '#fff' },
  { name: 'Mastercard Send', mark: '●●', tone: '#191919', textTone: '#f74339' },
];

function BrandMark({ channel, small = false }: { channel: Channel; small?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        background: channel.tone,
        color: channel.textTone || '#fff',
        width: small ? 35 : 48,
        height: small ? 35 : 48,
        fontSize: small ? 12 : 15,
        fontWeight: 700,
        letterSpacing: '-0.3px',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 3px 8px rgba(36,40,40,.13), inset 0 0 0 1px rgba(255,255,255,.22)',
        whiteSpace: 'nowrap',
      } as CSSProperties}
      aria-hidden="true"
    >
      {channel.mark}
    </span>
  );
}

export default function InternationalTransfer() {
  const [, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filterChannels = (items: Channel[]) =>
    items.filter((item) =>
      `${item.name} ${item.subtitle || ''}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  const filtered = useMemo(
    () => ({
      local: filterChannels(localChannels),
      abroad: filterChannels(abroadChannels),
      cards: filterChannels(cardChannels),
    }),
    [normalizedQuery],
  );
  const hasResults = filtered.local.length + filtered.abroad.length + filtered.cards.length > 0;

  const selectChannel = (name: string) => {
    setSelected(name);
    setNotice(false);
  };

  const handleContinue = () => {
    if (selected === 'ផ្ទេរប្រាក់ ABA') {
      navigate('/transfer');
    } else {
      setNotice(true);
    }
  };

  return (
    <main
      className="w-full max-w-[390px] min-h-screen mx-auto relative overflow-hidden bg-[#f2f2f1] text-[#252728]"
      style={{ fontFamily: '"Noto Sans Khmer", "Khmer OS System", system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}
    >
      <div className="h-screen overflow-auto scrollbar-none pb-[calc(48px+env(safe-area-inset-bottom))]">
        {/* Top bar */}
        <header className="flex items-center justify-between px-[22px] pt-[14px] pb-[6px] min-h-[52px]">
          <button
            className="appearance-none border-0 text-[#202324] bg-transparent inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-[#e7e8e7] active:scale-95 transition-all"
            aria-label="ត្រឡប់ក្រោយ"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={25} strokeWidth={2.2} />
          </button>
          <div className="flex gap-2">
            <button
              className="appearance-none border-0 text-[#202324] bg-transparent inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-[#e7e8e7] active:scale-95 transition-all"
              aria-label="ប្រតិទិន"
              onClick={() => setNotice((v) => !v)}
            >
              <CalendarDays size={21} strokeWidth={1.9} />
            </button>
            <button
              className="appearance-none border-0 text-[#202324] bg-transparent inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-[#e7e8e7] active:scale-95 transition-all"
              aria-label={searchOpen ? 'បិទការស្វែងរក' : 'ស្វែងរក'}
              onClick={() => { setSearchOpen((o) => !o); setQuery(''); }}
            >
              {searchOpen ? <X size={22} /> : <Search size={22} strokeWidth={2} />}
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 pt-[39px] pb-[29px] flex items-center justify-between gap-2 min-h-[180px]">
          <div className="min-w-0">
            <h1 className="m-0 mb-[7px] text-[24px] font-bold tracking-[-0.8px] leading-[1.18] text-[#202324]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              ABA<span className="text-[#df2537]">'</span> ផ្ទេរប្រាក់
            </h1>
            <p className="m-0 max-w-[245px] text-[#4e5253] text-[16px] leading-[1.58] font-medium">
              ផ្ទេរប្រាក់ទៅក្នុងស្រុក និងគ្រប់ទីកន្លែងជុំវិញពិភពលោក
            </p>
          </div>
          <div className="flex-shrink-0 w-[91px] h-[100px] relative mr-px" aria-hidden="true">
            <span
              className="absolute w-[78px] h-[78px] right-0 top-[2px] rounded-full"
              style={{ background: '#d4d0c0', transform: 'rotate(-24deg)' }}
            />
            <span
              className="absolute w-[77px] h-[77px] left-0 top-[19px] flex flex-col items-center justify-center gap-px text-[#c4bb9c]"
              style={{
                border: '1px solid rgba(255,255,255,.72)',
                borderRadius: '23px',
                background: 'linear-gradient(145deg, #eeefee, #d7d9d8)',
                boxShadow: '0 8px 17px rgba(61,65,65,.13), inset 1px 2px 4px #fff',
              }}
            >
              <ArrowRight size={31} strokeWidth={2.7} />
              <ArrowLeft size={29} strokeWidth={2.7} />
            </span>
          </div>
        </section>

        {/* Search */}
        {searchOpen && (
          <label className="mx-5 mb-3 h-[47px] border border-[#e0e2e1] rounded-[15px] flex items-center gap-2.5 px-[13px] bg-white" style={{ boxShadow: '0 2px 8px rgba(40,46,46,.035)' }}>
            <Search size={18} color="#898e8d" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ស្វែងរកវិធីផ្ទេរប្រាក់"
              aria-label="ស្វែងរកវិធីផ្ទេរប្រាក់"
              className="min-w-0 flex-1 border-0 outline-none text-[#333738] bg-transparent text-[14px]"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            />
            {query && (
              <button
                className="appearance-none border-0 text-[#202324] bg-transparent inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                aria-label="សម្អាត"
                onClick={() => setQuery('')}
              >
                <X size={17} />
              </button>
            )}
          </label>
        )}

        {/* Content */}
        <div className="px-5 pt-[27px] pb-[26px] rounded-t-[25px] bg-[#f8f8f7]" style={{ boxShadow: '0 -1px 10px rgba(36,40,40,.04)' }}>
          {/* Nearby banks */}
          {!normalizedQuery && (
            <section className="mb-[29px]">
              <h2 className="m-0 mb-[18px] ml-0.5 text-[#414545] text-[19px] leading-[1.45] font-bold tracking-[-0.3px]">
                គណនីដែលប្រើញឹកញាប់
              </h2>
              <div className="flex gap-[11px] overflow-x-auto scrollbar-none pb-0.5 -mr-5">
                {nearbyBanks.map((bank) => (
                  <button
                    key={bank.name}
                    className="flex-shrink-0 w-[144px] h-[61px] border border-[#f0f0ef] bg-white rounded-[19px] flex items-center gap-2.5 px-[13px] text-[#414545] text-[14px] font-semibold whitespace-nowrap cursor-pointer hover:bg-[#fbfcfb] active:scale-95 transition-all"
                    style={{ fontFamily: 'system-ui, sans-serif', boxShadow: '0 3px 9px rgba(46,50,50,.07)' }}
                    onClick={() => selectChannel(bank.name)}
                  >
                    <BrandMark channel={bank} small />
                    <span>{bank.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Local transfers */}
          <section className="mb-[29px]">
            <h2 className="m-0 mb-[18px] ml-0.5 text-[#414545] text-[19px] leading-[1.45] font-bold tracking-[-0.3px]">
              ផ្ទេរប្រាក់ក្នុងស្រុក
            </h2>
            {filtered.local.length ? (
              <div className="grid grid-cols-2 gap-[11px]">
                {filtered.local.map((channel) => (
                  <button
                    key={channel.name}
                    className={`appearance-none min-w-0 border bg-white text-[#252728] text-left rounded-[19px] cursor-pointer min-h-[164px] p-[15px] flex flex-col items-start relative active:scale-[0.985] transition-all ${selected === channel.name ? 'border-[#789c8b]' : 'border-[#efefee]'}`}
                    style={{ boxShadow: selected === channel.name ? '0 0 0 2px rgba(75,128,103,.12), 0 4px 12px rgba(44,49,49,.07)' : '0 3px 10px rgba(44,49,49,.065)' }}
                    onClick={() => selectChannel(channel.name)}
                  >
                    {selected === channel.name && (
                      <span className="absolute right-3 top-[11px] w-[21px] h-[21px] rounded-full flex items-center justify-center text-white bg-[#477c63]">
                        <Check size={13} />
                      </span>
                    )}
                    <span className="mb-2.5"><BrandMark channel={channel} /></span>
                    <span className="text-[14px] leading-[1.45] font-bold text-[#3f4445] mb-1.5">{channel.name}</span>
                    <span className="text-[#929596] text-[12px] leading-[1.5] font-normal">{channel.subtitle}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* International transfers */}
          <section className="mb-[29px]">
            <h2 className="m-0 mb-[18px] ml-0.5 text-[#414545] text-[19px] leading-[1.45] font-bold tracking-[-0.3px]">
              ផ្ទេរប្រាក់ទៅក្រៅប្រទេស
            </h2>
            {filtered.abroad.length ? (
              <div className="flex flex-col gap-2.5">
                {filtered.abroad.map((channel) => (
                  <button
                    key={channel.name}
                    className={`appearance-none min-h-[76px] w-full p-[11px] flex items-center gap-3.5 relative rounded-[20px] border bg-white text-left cursor-pointer active:scale-[0.985] transition-all ${selected === channel.name ? 'border-[#789c8b]' : 'border-[#efefee]'}`}
                    style={{ boxShadow: selected === channel.name ? '0 0 0 2px rgba(75,128,103,.12), 0 4px 12px rgba(44,49,49,.07)' : '0 3px 10px rgba(44,49,49,.065)' }}
                    onClick={() => selectChannel(channel.name)}
                  >
                    <BrandMark channel={channel} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[#45494a] text-[16px] font-semibold leading-[1.3]" style={{ fontFamily: 'system-ui, "Noto Sans Khmer", sans-serif' }}>
                        {channel.name === 'Ria' ? 'Ria · ផ្ទេរប្រាក់' : channel.name}
                      </span>
                      <span className="block text-[#999d9d] text-[12px] leading-[1.45] mt-0.5">{channel.subtitle}</span>
                    </span>
                    {selected === channel.name ? (
                      <span className="absolute right-3 top-[11px] w-[21px] h-[21px] rounded-full flex items-center justify-center text-white bg-[#477c63]">
                        <Check size={13} />
                      </span>
                    ) : (
                      <ChevronRight size={18} color="#b5b9b8" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* Card transfers */}
          <section className="mb-[29px]">
            <h2 className="m-0 mb-[18px] ml-0.5 text-[#414545] text-[19px] leading-[1.45] font-bold tracking-[-0.3px]">
              ផ្ទេរទៅកាន់កាត
            </h2>
            {filtered.cards.length ? (
              <div className="flex flex-col gap-2.5">
                {filtered.cards.map((channel) => (
                  <button
                    key={channel.name}
                    className={`appearance-none min-h-[76px] w-full p-[11px] flex items-center gap-3.5 relative rounded-[20px] border bg-white text-left cursor-pointer active:scale-[0.985] transition-all ${selected === channel.name ? 'border-[#789c8b]' : 'border-[#efefee]'}`}
                    style={{ boxShadow: selected === channel.name ? '0 0 0 2px rgba(75,128,103,.12), 0 4px 12px rgba(44,49,49,.07)' : '0 3px 10px rgba(44,49,49,.065)' }}
                    onClick={() => selectChannel(channel.name)}
                  >
                    <BrandMark channel={channel} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[#45494a] text-[16px] font-semibold leading-[1.3]" style={{ fontFamily: 'system-ui, "Noto Sans Khmer", sans-serif' }}>
                        {channel.name}
                      </span>
                      <span className="block text-[#999d9d] text-[12px] leading-[1.45] mt-0.5">ផ្ទេរប្រាក់ទៅកាតអន្តរជាតិ</span>
                    </span>
                    {selected === channel.name ? (
                      <span className="absolute right-3 top-[11px] w-[21px] h-[21px] rounded-full flex items-center justify-center text-white bg-[#477c63]">
                        <Check size={13} />
                      </span>
                    ) : (
                      <ChevronRight size={18} color="#b5b9b8" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* No results */}
          {normalizedQuery && !hasResults && (
            <div className="border border-dashed border-[#d9ddda] text-[#7d8381] rounded-[18px] p-[22px] text-center text-[14px]">
              <Search className="text-[#9b9f9d] mb-1.5 mx-auto" size={22} />
              <div>រកមិនឃើញវិធីផ្ទេរប្រាក់</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>សាកល្បងស្វែងរកម្ដងទៀត</div>
            </div>
          )}

          {/* Notice */}
          {notice && !selected && (
            <div className="border border-dashed border-[#d9ddda] text-[#7d8381] rounded-[18px] p-[22px] text-center text-[14px]" style={{ marginTop: 5 }}>
              គំរូបង្ហាញប៉ុណ្ណោះ · មិនភ្ជាប់ទៅសេវាធនាគារពិតប្រាកដទេ
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {selected && (
        <div
          className="sticky bottom-0 z-10 -mx-5 px-5 pt-3 pb-[calc(13px+env(safe-area-inset-bottom))] bg-[rgba(248,248,247,.96)] border-t border-[rgba(224,226,224,.75)]"
          style={{ backdropFilter: 'blur(14px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[#969b99] text-[11px]">បានជ្រើសរើស</span>
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[#343939] text-[13px] font-bold">{selected}</span>
            </div>
            <button
              className="border-0 rounded-[13px] px-[15px] py-3 flex items-center gap-1.5 text-white bg-[#315f4e] text-[13px] font-semibold cursor-pointer hover:bg-[#264f40] active:scale-95 transition-all"
              style={{ fontFamily: 'system-ui, sans-serif' }}
              onClick={handleContinue}
            >
              បន្ត <ArrowUpRight size={16} />
            </button>
          </div>
          {notice && (
            <div className="mt-2 text-[#477c63] text-[11px] text-right">
              នេះជាគំរូបង្ហាញប៉ុណ្ណោះ · មិនមានការផ្ទេរប្រាក់ពិតប្រាកដទេ
            </div>
          )}
        </div>
      )}
    </main>
  );
}
