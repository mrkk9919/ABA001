import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, User, MoreVertical, Plus, Bot, ChevronRight, Signal, Wifi, BatteryFull } from 'lucide-react';
import { useLocation } from 'wouter';

/* ─── Chat contact data ─────────────────────────────────────────────────────── */
type Contact = {
  id: string;
  name: string;
  subtitle: string;
  time?: string;
  unread?: number;
  avatarBg: string;
  avatarText?: string;
  isBot?: boolean;
  hasGlobe?: boolean;
  online?: boolean;
};

const contacts: Contact[] = [
  {
    id: 'navi',
    name: 'Navi+ បេតា',
    subtitle: 'ជំនួយការរបស់អ្នក',
    avatarBg: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
    isBot: true,
    online: true,
  },
  {
    id: '1',
    name: 'D',
    subtitle: 'ចាប់ផ្តើមឆាតថ្មី',
    avatarBg: 'linear-gradient(135deg, #52B788 0%, #40916C 100%)',
    avatarText: 'D',
  },
  {
    id: '2',
    name: 'Soeun Vichheka',
    subtitle: 'ចាប់ផ្តើមឆាតថ្មី',
    avatarBg: 'linear-gradient(135deg, #40916C 0%, #2D6A4F 100%)',
    avatarText: 'SV',
    online: true,
  },
  {
    id: '3',
    name: 'TANG HOLOEUVY',
    subtitle: 'ចាប់ផ្តើមឆាតថ្មី',
    avatarBg: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
    avatarText: 'TH',
  },
  {
    id: '4',
    name: '赵青',
    subtitle: 'ចាប់ផ្តើមឆាតថ្មី',
    avatarBg: 'linear-gradient(135deg, #8B5E3C 0%, #6B4423 100%)',
    avatarText: '赵青',
  },
  {
    id: '5',
    name: '',
    subtitle: 'ចាប់ផ្តើមឆាតថ្មី',
    avatarBg: 'linear-gradient(135deg, #1E3A5F 0%, #0F1F3A 100%)',
    hasGlobe: true,
  },
];

/* ─── Status Bar ────────────────────────────────────────────────────────────── */
const StatusBar = () => (
  <div className="flex items-center justify-between px-6 pt-3 pb-1 text-gray-900">
    <span className="text-[14px] font-semibold">3:55</span>
    <div className="flex items-center gap-1.5">
      <Signal className="w-[16px] h-[16px]" strokeWidth={2.5} />
      <Wifi className="w-[16px] h-[16px]" strokeWidth={2.5} />
      <BatteryFull className="w-[20px] h-[20px]" strokeWidth={2} />
    </div>
  </div>
);

/* ─── Avatar component ──────────────────────────────────────────────────────── */
const Avatar = ({ contact }: { contact: Contact }) => {
  const baseClass = "w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 relative shadow-md";

  if (contact.isBot) {
    return (
      <div className={baseClass} style={{ background: contact.avatarBg }}>
        <Bot className="w-6 h-6 text-white" strokeWidth={1.8} />
        {contact.online && (
          <div className="absolute bottom-0 right-0 w-[14px] h-[14px] bg-green-500 rounded-full border-[2.5px] border-white" />
        )}
      </div>
    );
  }
  if (contact.hasGlobe) {
    return (
      <div className={baseClass} style={{ background: contact.avatarBg }}>
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
    );
  }
  return (
    <div className={baseClass} style={{ background: contact.avatarBg }}>
      <span className="text-white text-[17px] font-bold tracking-wide">{contact.avatarText}</span>
      {contact.online && (
        <div className="absolute bottom-0 right-0 w-[14px] h-[14px] bg-green-500 rounded-full border-[2.5px] border-white" />
      )}
    </div>
  );
};

/* ─── Chat item ─────────────────────────────────────────────────────────────── */
const ChatItem = ({ contact, index }: { contact: Contact; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100 border-b border-gray-50"
  >
    <Avatar contact={contact} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[15.5px] font-bold text-gray-900 truncate">
          {contact.name || '\u00A0'}
        </p>
        {contact.time && (
          <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-2">{contact.time}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[12.5px] text-gray-400 font-medium truncate">
          {contact.subtitle}
        </p>
        {contact.unread && (
          <span className="ml-2 bg-[#E8002D] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5">
            {contact.unread}
          </span>
        )}
      </div>
    </div>
    <ChevronRight className="w-[18px] h-[18px] text-gray-300 shrink-0" strokeWidth={2.5} />
  </motion.div>
);

/* ─── Main Page (full screen, refined) ──────────────────────────────────────── */
export default function Chat() {
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-200 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* Status Bar */}
        <StatusBar />

        {/* Header */}
        <div className="relative z-20 px-5 pt-2 pb-4 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              aria-label="Back"
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-[24px] h-[24px] text-gray-900" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-[22px] h-[22px] text-gray-900" strokeWidth={2} />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Profile"
              >
                <User className="w-[22px] h-[22px] text-gray-900" strokeWidth={2} />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="More"
              >
                <MoreVertical className="w-[22px] h-[22px] text-gray-900" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Search bar (expandable) */}
          <motion.div
            initial={false}
            animate={{ height: searchOpen ? 'auto' : 0, opacity: searchOpen ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type="text"
                placeholder="ស្វែងរក..."
                className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8002D]/20 transition-all"
              />
            </div>
          </motion.div>

          {/* Title */}
          <div className="mt-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">
                ABA<span className="text-[#E8002D] text-[32px] font-black">'</span>{' '}
                <span className="font-semibold">ឆាត</span>
              </h1>
              <p className="text-[13px] text-gray-500 font-medium mt-2.5 leading-relaxed">
                ផ្ញើសារ និងផ្ទេរប្រាក់ទៅកាន់ បុគ្គលនៅក្នុង
                <br />
                គំរូទូទាត់ប្រចាំ និងបញ្ជីទំនាក់ទំនង
              </p>
            </div>
            {/* Chat bubble decoration */}
            <div className="relative ml-4 mt-1 shrink-0">
              <div className="w-[75px] h-[58px] bg-[#E8E8ED] rounded-2xl rounded-bl-sm flex items-center justify-center shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#B0B0B8] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-[#B0B0B8] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-[#B0B0B8] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-[65px] h-[50px] bg-[#F0F0F3] rounded-2xl rounded-bl-sm -z-10" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gray-100 mx-5" />

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white">
          {contacts.map((contact, index) => (
            <ChatItem key={contact.id} contact={contact} index={index} />
          ))}
          <div className="h-24" />
        </div>

        {/* FAB - New chat */}
        <div className="absolute bottom-6 right-5 z-30">
          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-2 bg-[#E8002D] hover:bg-[#D00028] text-white px-5 py-3.5 rounded-2xl shadow-[0_6px_20px_rgba(232,0,45,0.4)] transition-all"
            aria-label="New chat"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-[18px] h-[18px] text-white" strokeWidth={3} />
            </div>
            <span className="text-[14px] font-extrabold tracking-wide">ឆាតថ្មី</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
