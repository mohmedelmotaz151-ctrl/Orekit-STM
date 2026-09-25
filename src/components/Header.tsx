import React from 'react';
import { 
  Flame, 
  Bell, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  alertsCount: number;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  alertsCount,
  onOpenAlerts,
}) => {
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'الإدارة العامة', color: 'text-amber-400 bg-amber-950/60 border-amber-700/60' };
      case 'supervisor':
        return { label: 'مشرف ميداني', color: 'text-sky-400 bg-sky-950/60 border-sky-700/60' };
      case 'agent':
        return { label: 'مندوب مبيعات', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60' };
    }
  };

  const currentRoleInfo = getRoleLabel(currentUser.role);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Company Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/50">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                أوريكيت <span className="text-orange-500 font-bold text-sm sm:text-base">ORIKET</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                أنظمة السلامة ومكافحة الحريق
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              المنظومة الميدانية لإدارة المواقع وعقود الصيانة
            </p>
          </div>
        </div>

        {/* Right side: Alerts & User Profile & Logout */}
        <div className="flex items-center gap-2.5">
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
