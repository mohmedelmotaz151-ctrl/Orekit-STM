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
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Company Name (Clickable to open Navigation Hub) */}
        <button
          type="button"
          onClick={onOpenHub}
          className={`flex items-center gap-3 text-right p-1.5 -m-1.5 rounded-2xl transition group focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
            isHubActive ? 'bg-orange-950/50 ring-1 ring-orange-500/60 shadow-lg shadow-orange-950/40' : 'hover:bg-slate-800/70'
          }`}
          title="اضغط هنا لفتح بوابة وتطبيقات وأقسام المنظومة (Hub)"
          aria-label="بوابة أقسام منظومة أوريكيت"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/50 group-hover:scale-105 group-active:scale-95 transition-transform shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5 group-hover:text-orange-400 transition-colors">
                أوريكيت <span className="text-orange-500 font-bold text-sm sm:text-base">ORIKET</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium group-hover:border-orange-500/50 group-hover:text-white transition">
                <span>أقسام المنظومة</span>
                <span className="text-orange-400 text-xs">▾</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block group-hover:text-slate-300 transition-colors">
              المنظومة الميدانية لإدارة المواقع وعقود الصيانة
            </p>
          </div>
        </button>

        {/* Right side: Alerts & User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* In-App PWA Install Prompt */}
          <PWAInstallButton />

          {/* Quick WhatsApp to Oriket Administration */}
          <a
            href={createWhatsAppUrl(
              ORIKET_COMPANY_PHONE,
              `السلام عليكم ورحمة الله وبركاته،\nمعكم ${currentUser.name} (${currentUser.role === 'admin' ? 'الإدارة' : 'مندوب ميداني'})\nتحية طيبة لإدارة شركة أوريكيت للسلامة.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
            title={`واتساب إدارة شركة أوريكيت (${ORIKET_COMPANY_PHONE})`}
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span className="hidden md:inline font-mono text-[11px]">0555334577</span>
            <span className="hidden lg:inline text-[11px] text-emerald-300 font-normal">(واتساب الإدارة)</span>
          </a>

          {/* Alerts notification icon */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
              title="التنبيهات والتذكيرات الذكية"
            >
              <Bell className="w-5 h-5" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 shadow">
                  {alertsCount}
                </span>
              )}
            </button>
          )}

          {/* User profile info badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700/80 text-right">
            <div className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                {currentUser.name}
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${currentRoleInfo.color}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{currentUser.phone}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 text-xs font-bold transition"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">خروج</span>
          </button>
        </div>

      </div>
    </header>
  );
};
