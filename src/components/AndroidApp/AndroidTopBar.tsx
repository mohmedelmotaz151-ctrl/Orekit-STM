import React from 'react';
import { User } from '../../types';
import { Bell, User as UserIcon, MessageCircle } from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface AndroidTopBarProps {
  currentUser: User;
  activeTab: 'home' | 'services' | 'orders' | 'notifications' | 'profile';
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  unreadNotificationsCount: number;
  onOpenHub?: () => void;
}

export const AndroidTopBar: React.FC<AndroidTopBarProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  unreadNotificationsCount,
  onOpenHub,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'home':
        return `مرحباً، ${currentUser.name.split(' ')[0]}`;
      case 'services':
        return 'خدمات السلامة';
      case 'orders':
        return 'سجل الطلبات والتتبع';
      case 'notifications':
        return 'التنبيهات والإشعارات';
      case 'profile':
        return 'الملف الشخصي';
      default:
        return 'أوريكيت للسلامة';
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return { label: 'الإدارة', bg: 'bg-[#20A9FF]/20 text-[#20A9FF] border-[#20A9FF]/40' };
      case 'supervisor':
        return { label: 'مشرف', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'client':
        return { label: 'عميل', bg: 'bg-[#19C7A0]/20 text-[#19C7A0] border-[#19C7A0]/40' };
      default:
        return { label: 'مندوب', bg: 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-[#0b1220]/98 backdrop-blur-xl border-b border-[#2b3a50] shadow-sm transition-all w-full select-none">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-2">
        
        {/* Right side (RTL Start): ORKEIT Logo & Brand */}
        <button
          type="button"
          onClick={() => {
            if (onOpenHub) onOpenHub();
            else onNavigateTab('home');
          }}
          className="flex items-center gap-2 text-right p-1 -mr-1 rounded-xl transition active:scale-95 shrink-0"
          title="بوابة المنظومة"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-[#1E2945] bg-[#10172B]">
            <img 
              src="/pwa-192x192.png" 
              alt="ORKEIT" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-right">
            <span className="font-bold text-xs tracking-tight text-[#F5F7FF] block leading-tight">
              ORKEIT <span className="text-[10px] text-[#8992AA] font-normal">أوريكيت</span>
            </span>
            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-medium border ${roleBadge.bg}`}>
              {roleBadge.label}
            </span>
          </div>
        </button>

        {/* Center: Current Screen Title or Greeting */}
        <div className="flex-1 text-center px-1 truncate">
          <h1 className="text-xs sm:text-sm font-bold text-[#F5F7FF] truncate">
            {getTabTitle()}
          </h1>
          <span className="text-[9px] text-[#8992AA] block truncate font-medium">
            شركة أوريكيت لأنظمة السلامة
          </span>
        </div>

        {/* Left side (RTL End): WhatsApp Support + Notifications + Profile Icon */}
        <div className="flex items-center gap-1.5 shrink-0 -ml-1">
          {/* WhatsApp Support Direct Button */}
          <a
            href={createWhatsAppUrl(
              ORIKET_COMPANY_PHONE,
              `السلام عليكم ورحمة الله وبركاته،\nمعكم ${currentUser.name} (${roleBadge.label})\nأود الاستفسار بخصوص خدمات السلامة في شركة أوريكيت.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-[11px] bg-[#101a2b] hover:bg-[#151F38] text-[#19C7A0] border border-[#1E2945] transition flex items-center justify-center active:scale-95"
            title="واتساب الدعم الفني"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
          </a>

          {/* Notifications Icon with Badge */}
          <button
            type="button"
            onClick={() => onNavigateTab('notifications')}
            className={`relative w-9 h-9 rounded-[11px] flex items-center justify-center transition border active:scale-95 ${
              activeTab === 'notifications'
                ? 'bg-[#20A9FF]/20 text-[#20A9FF] border-[#20A9FF]/50'
                : 'bg-[#10172B] text-[#8992AA] hover:text-[#F5F7FF] border-[#1E2945]'
            }`}
            title="الإشعارات"
            aria-label="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#EF3340] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#070B1C] animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Profile Icon */}
          <button
            type="button"
            onClick={() => onNavigateTab('profile')}
            className={`w-9 h-9 rounded-[11px] flex items-center justify-center transition border active:scale-95 ${
              activeTab === 'profile'
                ? 'bg-[#20A9FF] text-[#070B1C] border-[#20A9FF] font-bold shadow-sm'
                : 'bg-[#10172B] text-[#8992AA] hover:text-[#F5F7FF] border-[#1E2945]'
            }`}
            title="حسابي"
            aria-label="حسابي"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
