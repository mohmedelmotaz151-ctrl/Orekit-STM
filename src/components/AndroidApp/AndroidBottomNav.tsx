import React from 'react';
import { Home, Wrench, ClipboardList, Bell, User, MoreHorizontal } from 'lucide-react';
import { User as AppUser } from '../../types';

export type AndroidTabType = 'home' | 'services' | 'orders' | 'notifications' | 'profile';

interface AndroidBottomNavProps {
  currentUser: AppUser;
  activeTab: AndroidTabType;
  onSelectTab: (tab: AndroidTabType) => void;
  urgentAlertsCount?: number;
  activeOrdersCount?: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  urgentAlertsCount = 0,
  activeOrdersCount = 0,
}) => {
  const [moreOpen, setMoreOpen] = React.useState(false);

  const navItems: Array<{
    id: AndroidTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'services', label: 'الخدمات', icon: Wrench },
    {
      id: 'orders',
      label: 'المتابعة',
      icon: MoreHorizontal,
      badge: (activeOrdersCount + urgentAlertsCount) > 0 ? activeOrdersCount + urgentAlertsCount : undefined,
      badgeColor: 'bg-[#B08D57]'
    },
    { id: 'profile', label: 'حسابي', icon: User },
  ].filter((item) => currentUser.role === 'client' || item.id !== 'services');

  const isTrackingTab = activeTab === 'orders' || activeTab === 'notifications';

  return (
    <nav 
      aria-label="التنقل السفلي للتطبيق"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#070B1C]/95 backdrop-blur-xl border-t border-[#1E2945] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] select-none pb-safe"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {moreOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(92vw,360px)] bg-[#101a2b] border border-[#2b3a50] rounded-2xl shadow-2xl p-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setMoreOpen(false); onSelectTab('orders'); }} className="relative min-h-12 rounded-xl bg-[#162235] border border-[#2b3a50] text-[#d7dde7] flex items-center justify-center gap-2 text-xs font-bold">
            <ClipboardList className="w-4 h-4 text-[#B08D57]" /> الطلبات
            {activeOrdersCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#B08D57] text-[#0b1220]">{activeOrdersCount}</span>}
          </button>
          <button type="button" onClick={() => { setMoreOpen(false); onSelectTab('notifications'); }} className="relative min-h-12 rounded-xl bg-[#162235] border border-[#2b3a50] text-[#d7dde7] flex items-center justify-center gap-2 text-xs font-bold">
            <Bell className="w-4 h-4 text-[#B23A48]" /> التنبيهات
            {urgentAlertsCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#B23A48] text-white">{urgentAlertsCount}</span>}
          </button>
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 h-16 flex items-center justify-around gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'orders' ? isTrackingTab : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'orders') setMoreOpen((prev) => !prev);
                else { setMoreOpen(false); onSelectTab(item.id); }
              }
              }}
                isActive
                  ? 'text-[#B08D57]'
                  : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-[#B08D57] shadow-[0_0_8px_#B08D57] animate-fadeIn" />
              )}

              {/* Icon Container with Badge */}
              <div className={`relative p-1 rounded-xl transition-colors ${
                isActive ? 'bg-[#B08D57]/15' : 'bg-transparent'
              }`}>
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#070B1C] shadow ${item.badgeColor || 'bg-[#20A9FF]'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[11px] mt-0.5 tracking-tight ${
                isActive ? 'font-bold text-[#B08D57]' : 'font-medium text-[#8992AA]'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
