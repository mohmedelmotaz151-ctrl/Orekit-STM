import React from 'react';
import { Home, Wrench, ClipboardList, Bell, User } from 'lucide-react';

export type AndroidTabType = 'home' | 'services' | 'orders' | 'notifications' | 'profile';

interface AndroidBottomNavProps {
  activeTab: AndroidTabType;
  onSelectTab: (tab: AndroidTabType) => void;
  urgentAlertsCount?: number;
  activeOrdersCount?: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab,
  urgentAlertsCount = 0,
  activeOrdersCount = 0,
}) => {
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
      label: 'الطلبات', 
      icon: ClipboardList,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-[#20A9FF]'
    },
    { 
      id: 'notifications', 
      label: 'الإشعارات', 
      icon: Bell,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : undefined,
      badgeColor: 'bg-[#EF3340]'
    },
    { id: 'profile', label: 'حسابي', icon: User },
  ];

  return (
    <nav 
      aria-label="التنقل السفلي للتطبيق"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#070B1C]/95 backdrop-blur-xl border-t border-[#1E2945] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] select-none pb-safe"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] ${
                isActive
                  ? 'text-[#20A9FF]'
                  : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-[#20A9FF] shadow-[0_0_8px_#20A9FF] animate-fadeIn" />
              )}

              {/* Icon Container with Badge */}
              <div className={`relative p-1 rounded-xl transition-colors ${
                isActive ? 'bg-[#20A9FF]/15' : 'bg-transparent'
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
                isActive ? 'font-bold text-[#20A9FF]' : 'font-medium text-[#8992AA]'
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
