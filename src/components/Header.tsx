import React from 'react';
import { 
  Flame, 
  Bell, 
  LogOut,
  User as UserIcon,
  MessageCircle
} from 'lucide-react';
import { User, UserRole } from '../types';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../utils/whatsapp';
import { PWAInstallButton } from './Common/PWAInstallButton';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  alertsCount: number;
  onOpenAlerts?: () => void;
  onOpenHub?: () => void;
  isHubActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  alertsCount,
  onOpenAlerts,
  onOpenHub,
  isHubActive = false,
}) => {
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'الإدارة العامة', color: 'text-amber-400 bg-amber-950/60 border-amber-700/60' };
      case 'supervisor':
        return { label: 'مشرف ميداني', color: 'text-sky-400 bg-sky-950/60 border-sky-700/60' };
      case 'agent':
        return { label: 'مندوب مبيعات', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60' };
      case 'client':
        return { 
          label: currentUser.facilityName ? `عميل: ${currentUser.facilityName}` : 'عميل المنشأة', 
          color: 'text-orange-400 bg-orange-950/60 border-orange-700/60' 
        };
      default:
        return { label: 'مستخدم', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const currentRoleInfo = getRoleLabel(currentUser.role);

  return (
    <header className="sticky top-0 z-50 bg-[#070B1C]/95 backdrop-blur-md border-b border-[#1E2945] shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Company Name (Clickable to open Navigation Hub) */}
        <button
          type="button"
          onClick={onOpenHub}
          className={`flex items-center gap-2.5 sm:gap-3 text-right p-1 rounded-xl transition group focus:outline-none focus:ring-2 focus:ring-[#20A9FF]/40 shrink-0 ${
            isHubActive ? 'bg-[#10172B] ring-1 ring-[#20A9FF]/50 shadow-md' : 'hover:bg-[#10172B]/60'
          }`}
          title="اضغط هنا لفتح بوابة وتطبيقات وأقسام المنظومة (Hub)"
          aria-label="بوابة أقسام منظومة أوريكيت"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 group-active:scale-95 transition-transform shrink-0 border border-[#1E2945]">
            <img 
              src="/pwa-192x192.png" 
              alt="ORKEIT" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#F5F7FF] flex items-center gap-1.5 group-hover:text-[#20A9FF] transition-colors">
                ORKEIT <span className="text-xs text-[#8992AA] font-normal">أوريكيت للمقاولات</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#10172B] text-[#8992AA] border border-[#1E2945] font-medium group-hover:text-[#F5F7FF] transition">
                <span>أقسام المنظومة</span>
                <span className="text-[#20A9FF] text-xs">▾</span>
              </span>
            </div>
            <p className="text-[10px] text-[#8992AA] hidden md:block group-hover:text-[#F5F7FF]/80 transition-colors">
              منظومة أوريكيت الميدانية وإدارة العقود
            </p>
          </div>
        </button>

        {/* Right side: Alerts & User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* In-App PWA Install Prompt */}
          <div className="hidden xs:block">
            <PWAInstallButton />
          </div>

          {/* Quick WhatsApp to Oriket Administration */}
          <a
            href={createWhatsAppUrl(
              ORIKET_COMPANY_PHONE,
              `السلام عليكم ورحمة الله وبركاته،\nمعكم ${currentUser.name} (${currentUser.role === 'admin' ? 'الإدارة' : 'مندوب ميداني'})\nتحية طيبة لإدارة شركة أوريكيت للسلامة.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#10172B] hover:bg-[#151F38] text-[#19C7A0] border border-[#1E2945] transition flex items-center gap-1.5 text-xs font-medium"
            title={`واتساب إدارة شركة أوريكيت (${ORIKET_COMPANY_PHONE})`}
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span className="hidden md:inline font-mono text-[11px]">0555334577</span>
            <span className="hidden lg:inline text-[11px] text-[#8992AA]">(الدعم)</span>
          </a>

          {/* Alerts notification icon */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-xl bg-[#10172B] hover:bg-[#151F38] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] transition"
              title="التنبيهات والإشعارات"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-[#EF3340] text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow">
                  {alertsCount}
                </span>
              )}
            </button>
          )}

          {/* User profile info badge */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#10172B] border border-[#1E2945] text-right" title={`${currentUser.name} (${currentRoleInfo.label})`}>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#20A9FF]/15 text-[#20A9FF] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-[#F5F7FF] flex items-center gap-1.5">
                <span className="truncate max-w-[110px]">{currentUser.name}</span>
                <span className="text-[10px] text-[#8992AA]">
                  {currentUser.role === 'admin' ? 'المدير' : currentUser.role === 'agent' ? 'مندوب' : 'عميل'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#10172B] hover:bg-[#151F38] text-[#8992AA] hover:text-[#EF3340] border border-[#1E2945] text-xs font-medium transition"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>

      </div>
    </header>
  );
};
