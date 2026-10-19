import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Clock, CheckCircle, AlertCircle, Gift, Car, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';

/* ─── Notification types ────────────────────────────────────────────────────── */
type Notification = {
  id: string;
  type: 'transaction' | 'verification' | 'invite' | 'promo';
  title: string;
  subtitle?: string;
  time: string;
  icon?: React.ReactNode;
  image?: string;
};

type NotificationGroup = {
  date: string;
  items: Notification[];
};

/* ─── Important notifications data ──────────────────────────────────────────── */
const importantNotifications: NotificationGroup[] = [
  {
    date: '08 OCT 2026',
    items: [
      {
        id: '1',
        type: 'transaction',
        title: 'Received from FinRoute Solutions Online',
        subtitle: '40.00 USD was credited to account 088710222 with value date Oct 08, 2026. Entry# 62773437161 created on Oct 08, 2026 4:52 PM',
        time: '4:57 PM',
      },
      {
        id: '2',
        type: 'verification',
        title: 'ផ្ទៀងផ្ទាត់ការទូទាត់នៅលើ VERPEX-COM',
        subtitle: 'អ្នកកំពុងបង់ប្រាក់ 0.60 USD ដល់ VERPEX-COM ជាមួយ Visa Card **** 3075។ ចុច បញ្ជាក់ ដើម្បីបញ្ជាក់ថាអ្នកកំពុងធ្វើការទូទាត់ប្រតិបត្តិការនេះ។',
        time: '12:35 AM',
        icon: (
          <div className="w-10 h-10 rounded-full bg-[#0D3B66] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
        ),
      },
    ],
  },
  {
    date: '07 OCT 2026',
    items: [
      {
        id: '3',
        type: 'transaction',
        title: 'Received from PHAN, YANGKUON',
        subtitle: '40.00 USD was credited to account 088710222 with value date Oct 07, 2026. Entry# 62696416641 created on Oct 07, 2026 4:34 PM',
        time: '4:45 PM',
      },
      {
        id: '4',
        type: 'invite',
        title: 'ការអញ្ជើញ ត្រូវបានទទួលយក',
        subtitle: 'សំណើសុំបិទគណនីរួច ត្រូវបានទទួលយក។',
        time: '2:16 PM',
        icon: (
          <div className="w-10 h-10 rounded-full bg-[#1B5496] flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
        ),
      },
    ],
  },
];

/* ─── Promo notifications data ──────────────────────────────────────────────── */
const promoNotifications: NotificationGroup[] = [
  {
    date: '21 AUG 2026',
    items: [
      {
        id: 'p1',
        type: 'promo',
        title: 'DEEPAL S05 EV ឡានអគ្គិសនី',
        subtitle: 'លុយ និងឡាន កំពុងរង់ចាំអ្នក! មានឱកាសឈ្នះឡាន DEEPAL S05 EV ឬលុយ 5,000,000...',
        time: '',
        image: 'car',
      },
    ],
  },
  {
    date: '31 JUL 2026',
    items: [
      {
        id: 'p2',
        type: 'promo',
        title: 'DEEPAL S05 EV ឡានអគ្គិសនី',
        subtitle: 'លុយ និងឡាន កំពុងរង់ចាំអ្នក! មានឱកាសឈ្នះឡាន DEEPAL S05 EV ឬលុយ 5,000,000...',
        time: '',
        image: 'car',
      },
    ],
  },
  {
    date: '21 JUL 2026',
    items: [
      {
        id: 'p3',
        type: 'promo',
        title: 'សន្សំជាប្រាក់បៀវត្សអាចឈ្នះលុយយ៉ាងច្រើន',
        subtitle: 'ទុកលុយក្នុងគណនីប្រាក់រៀល ចាប់ពី 400,000រៀល អាចមាន...',
        time: '',
        image: 'loan',
      },
    ],
  },
  {
    date: '24 NOV 2025',
    items: [
      {
        id: 'p4',
        type: 'promo',
        title: 'គណនី KHR Account',
        subtitle: '23 456 789 | Mobile Savings\n柬埔寨瑞尔账户开户规定/免费开户',
        time: '',
        image: 'account',
      },
    ],
  },
];

/* ─── Promo image component (SVG placeholder) ───────────────────────────────── */
const PromoImage = ({ type }: { type: string }) => {
  if (type === 'car') {
    return (
      <div className="w-full h-[120px] rounded-xl overflow-hidden relative bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div className="text-white">
            <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full inline-block mb-1">DEEPAL</div>
            <div className="text-[14px] font-extrabold">S05 EV ឡានអគ្គិសនី</div>
            <div className="text-[10px] text-gray-300 mt-1">លុយ និងឡាន កំពុងរង់ចាំអ្នក!</div>
          </div>
          <Car className="w-16 h-16 text-blue-400 opacity-60" strokeWidth={1} />
        </div>
      </div>
    );
  }
  if (type === 'loan') {
    return (
      <div className="w-full h-[120px] rounded-xl overflow-hidden relative bg-gradient-to-r from-[#0a2540] to-[#1a5f8a]">
        <div className="absolute inset-0 flex items-center px-4">
          <div className="text-white">
            <div className="text-[14px] font-extrabold">សន្សំជាប្រាក់បៀវត្ស</div>
            <div className="text-[10px] text-gray-300 mt-1">អាចឈ្នះលុយយ៉ាងច្រើន</div>
            <div className="text-[24px] font-black text-yellow-400 mt-1">50%</div>
          </div>
          <Gift className="w-12 h-12 text-yellow-400 opacity-50 ml-auto" strokeWidth={1} />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-[120px] rounded-xl overflow-hidden relative bg-gradient-to-r from-[#f5f5f5] to-[#e0e0e0]">
      <div className="absolute inset-0 flex items-center px-4">
        <div>
          <div className="text-[14px] font-extrabold text-gray-800">KHR Account</div>
          <div className="text-[10px] text-gray-500 mt-1">23 456 789 | Mobile Savings</div>
          <div className="text-[10px] text-gray-600 mt-1">柬埔寨瑞尔账户开户规定/免费开户</div>
        </div>
      </div>
    </div>
  );
};

/* ─── Notification item ─────────────────────────────────────────────────────── */
const NotificationItem = ({ item }: { item: Notification }) => {
  const isTransaction = item.type === 'transaction';

  if (item.type === 'promo' && item.image) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3"
      >
        <PromoImage type={item.image} />
        <p className="text-[12px] text-gray-600 mt-2 px-1 leading-snug">{item.subtitle}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
    >
      <div className="flex gap-3">
        {item.icon ? (
          item.icon
        ) : isTransaction ? (
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#2E7D32]" strokeWidth={1.8} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[#E65100]" strokeWidth={1.8} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-bold text-gray-900 leading-snug">{item.title}</p>
            {item.time && (
              <span className="text-[11px] text-gray-400 font-medium shrink-0">{item.time}</span>
            )}
          </div>
          {item.subtitle && (
            <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">{item.subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Tabs ──────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'important', label: 'ដំណឹងសំខាន់' },
  { id: 'transactions', label: 'ប្រតិបត្តិការ' },
  { id: 'promo', label: 'សារជូនដំណឹង' },
];

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function Notifications() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('important');

  const renderContent = () => {
    if (activeTab === 'important') {
      return importantNotifications.map((group) => (
        <div key={group.date} className="mb-5">
          <p className="text-[13px] font-bold text-gray-500 mb-2.5 px-1">{group.date}</p>
          {group.items.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      ));
    }
    if (activeTab === 'transactions') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Clock className="w-12 h-12 text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-[14px] text-gray-400 font-medium">មិនមានប្រតិបត្តិការ</p>
        </div>
      );
    }
    return promoNotifications.map((group) => (
      <div key={group.date} className="mb-5">
        <p className="text-[13px] font-bold text-gray-500 mb-2.5 px-1">{group.date}</p>
        {group.items.map((item) => (
          <NotificationItem key={item.id} item={item} />
        ))}
      </div>
    ));
  };

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-300 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-[#F3F2F7] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* Header */}
        <div className="relative z-20 px-5 pt-12 pb-3 flex items-center gap-3 bg-[#F3F2F7]">
          <button
            onClick={() => setLocation('/')}
            aria-label="Back"
            className="text-gray-900 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
            ABA<span className="text-[#E8002D] text-2xl font-black">'</span>{' '}
            <span className="font-semibold">សារជូនដំណឹង</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-full text-[12px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00B4D8] text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 hide-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
