import React, { useState } from 'react';
import { User, ClientIncident, CivilDefenseInspectionAlert, ContractRenewalRequest, OrkeitServiceOrder } from '../../types';
import { 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Phone, 
  FileText,
  Calendar,
  X,
  MessageCircle,
  Wrench,
  ArrowLeft,
  Building2,
  Check
} from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface AndroidNotificationsScreenProps {
  currentUser: User;
  incidents: ClientIncident[];
  civilDefenseAlerts: CivilDefenseInspectionAlert[];
  renewals: ContractRenewalRequest[];
  orders?: OrkeitServiceOrder[];
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  onOpenTracking?: (order: OrkeitServiceOrder) => void;
  onUpdateOrder?: (orderId: string, updates: Partial<OrkeitServiceOrder>) => void;
}

interface NotificationItem {
  id: string;
  type: 'emergency' | 'civil_defense' | 'renewal' | 'service_order' | 'general';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  priority: 'urgent' | 'high' | 'normal';
  siteName?: string;
  phone?: string;
  order?: OrkeitServiceOrder;
}

export const AndroidNotificationsScreen: React.FC<AndroidNotificationsScreenProps> = ({
  currentUser,
  incidents,
  civilDefenseAlerts,
  renewals,
  orders = [],
  onNavigateTab,
  onOpenTracking,
  onUpdateOrder,
}) => {
  const [filter, setFilter] = useState<'all' | 'orders' | 'urgent' | 'cd' | 'contracts'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  // Synthesize notifications from orders, incidents, renewals, and civil defense alerts
  const items: NotificationItem[] = [
    ...orders.map((ord) => ({
      id: `ord_${ord.id}`,
      type: 'service_order' as const,
      title: `⚡ طلب خدمة سريعة: ${ord.serviceType}`,
      description: `${ord.siteName} — العميل: ${ord.clientName} (${ord.clientPhone}). الحالة: ${ord.statusLabel}.${ord.notes ? ' ملاحظات: ' + ord.notes : ''}`,
      timestamp: ord.createdAt || ord.date || 'الآن',
      isRead: Boolean(ord.isReadByAdmin) || readIds.has(`ord_${ord.id}`),
      priority: ord.urgent ? ('urgent' as const) : ('high' as const),
      siteName: ord.siteName,
      phone: ord.clientPhone,
      order: ord,
    })),
    ...incidents.map((inc) => ({
      id: `inc_${inc.id}`,
      type: 'emergency' as const,
      title: `🚨 بلاغ صيانة طوارئ: ${inc.title}`,
      description: `${inc.siteName} — ${inc.description}. المسؤول: ${inc.clientName} (${inc.clientPhone})`,
      timestamp: inc.createdAt || 'الآن',
      isRead: readIds.has(`inc_${inc.id}`),
      priority: 'urgent' as const,
      siteName: inc.siteName,
      phone: inc.clientPhone,
    })),
    ...civilDefenseAlerts.map((cd) => ({
      id: `cd_${cd.id}`,
      type: 'civil_defense' as const,
      title: `🚒 موعد تفتيش دفاع مدني: ${cd.siteName}`,
      description: `زيارة تفتيش مجدولة بتاريخ ${cd.scheduledDate} لسلامة المنشأة ومطابقة اشتراطات السلامة.`,
      timestamp: cd.updatedAt || 'مؤخراً',
      isRead: readIds.has(`cd_${cd.id}`),
      priority: 'high' as const,
      siteName: cd.siteName,
    })),
    ...renewals.map((rn) => ({
      id: `rn_${rn.id}`,
      type: 'renewal' as const,
      title: `📄 طلب تجديد عقد صيانة: ${rn.siteName}`,
      description: `طلب تجديد العقد لمدة ${rn.requestedDurationYears} سنة. العميل: ${rn.clientName} (${rn.clientPhone})`,
      timestamp: rn.createdAt || 'مؤخراً',
      isRead: readIds.has(`rn_${rn.id}`),
      priority: 'normal' as const,
      siteName: rn.siteName,
      phone: rn.clientPhone,
    })),
  ];

  // If no items, provide default onboarding / system notifications
  if (items.length === 0) {
    items.push({
      id: 'welcome_1',
      type: 'general',
      title: 'أهلاً بك في تطبيق أوريكيت لأنظمة السلامة',
      description: 'تم تسجيل دخولك بنجاح. يمكنك استعراض خدمات السلامة وإدارة العقود وتتبع الطلبات الميدانية بكل سهولة.',
      timestamp: 'اليوم',
      isRead: true,
      priority: 'normal',
    });
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'orders') return item.type === 'service_order';
    if (filter === 'urgent') return item.priority === 'urgent';
    if (filter === 'cd') return item.type === 'civil_defense';
    if (filter === 'contracts') return item.type === 'renewal';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
    if (id.startsWith('ord_') && onUpdateOrder) {
      const actualOrderId = id.replace('ord_', '');
      onUpdateOrder(actualOrderId, { isReadByAdmin: true });
    }
  };

  const getNotificationIcon = (type: NotificationItem['type'], priority: NotificationItem['priority']) => {
    if (priority === 'urgent') {
      return {
        icon: AlertTriangle,
        bg: 'bg-[#EF3340]/20 text-[#EF3340] border-[#EF3340]/50',
      };
    }
    if (type === 'service_order') {
      return {
        icon: Wrench,
        bg: 'bg-[#20A9FF]/20 text-[#20A9FF] border-[#20A9FF]/50',
      };
    }
    if (type === 'civil_defense') {
      return {
        icon: ShieldCheck,
        bg: 'bg-[#19C7A0]/20 text-[#19C7A0] border-[#19C7A0]/50',
      };
    }
    if (type === 'renewal') {
      return {
        icon: FileText,
        bg: 'bg-[#20A9FF]/20 text-[#20A9FF] border-[#20A9FF]/50',
      };
    }
    return {
      icon: Bell,
      bg: 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/50',
    };
  };

  return (
    <div className="space-y-4 pb-24 w-full animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#F5F7FF]">
            مركز التنبيهات والإشعارات
          </h2>
          <p className="text-xs text-[#8992AA]">
            إشعارات الطوارئ الحية، تجديد العقود، ومواعيد الدفاع المدني
          </p>
        </div>

        {items.some((i) => !i.isRead) && (
          <button
            onClick={() => {
              setReadIds(new Set(items.map((i) => i.id)));
            }}
            className="text-[11px] font-bold text-[#20A9FF] hover:underline"
          >
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: `الكل (${items.length})` },
          { id: 'orders', label: `⚡ طلبات الخدمات (${items.filter(i => i.type === 'service_order').length})` },
          { id: 'urgent', label: `🚨 الطوارئ (${items.filter(i => i.priority === 'urgent').length})` },
          { id: 'cd', label: `الدفاع المدني (${items.filter(i => i.type === 'civil_defense').length})` },
          { id: 'contracts', label: `العقود (${items.filter(i => i.type === 'renewal').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-95 ${
              filter === tab.id
                ? 'bg-[#20A9FF] text-[#070B1C] font-bold shadow-sm shadow-[#20A9FF]/20'
                : 'bg-[#10172B] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-[#10172B] rounded-3xl border border-[#1E2945] space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#19C7A0] mx-auto" />
            <h3 className="font-bold text-sm text-[#F5F7FF]">لا توجد إشعارات جديدة</h3>
            <p className="text-xs text-[#8992AA]">
              جميع المنشآت والعقود بحالة آمنة ومحدثة
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const iconConfig = getNotificationIcon(item.type, item.priority);
            const Icon = iconConfig.icon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  handleMarkAsRead(item.id);
                  setSelectedNotif(item);
                }}
                className={`p-3.5 sm:p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex items-start gap-3 active:scale-[0.99] ${
                  !item.isRead
                    ? 'bg-[#10172B] border-[#20A9FF]/40 shadow-md'
                    : 'bg-[#0A1024] border-[#1E2945]/70 opacity-90'
                }`}
              >
                {/* Icon Container */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${iconConfig.bg}`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-[#F5F7FF] leading-snug">
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#20A9FF] shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-[#8992AA] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#8992AA]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-[#8992AA]" />
                      <span>{item.timestamp}</span>
                    </span>

                    <span className="text-[#20A9FF] font-medium text-[11px]">
                      عرض التفاصيل ➔
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Sheet Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2945]">
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <h3 className="font-bold text-sm text-[#F5F7FF]">تفاصيل الإشعار</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-sm text-[#F5F7FF]">{selectedNotif.title}</h4>
              <p className="text-xs text-[#8992AA] leading-relaxed bg-[#070B1C] p-3 rounded-2xl border border-[#1E2945]">
                {selectedNotif.description}
              </p>
            </div>

            {/* Order specific details and action buttons */}
            {selectedNotif.order && (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-[#070B1C] rounded-2xl border border-[#1E2945] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8992AA]">رقم الطلب:</span>
                    <span className="font-mono font-bold text-[#20A9FF]">{selectedNotif.order.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8992AA]">حالة الطلب:</span>
                    <span className="font-bold text-[#19C7A0]">{selectedNotif.order.statusLabel}</span>
                  </div>
                </div>

                {onOpenTracking && (
                  <button
                    onClick={() => {
                      const ord = selectedNotif.order!;
                      setSelectedNotif(null);
                      onOpenTracking(ord);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-[#20A9FF]/20"
                  >
                    <span>متابعة مراحل التنفيذ (Timeline)</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Direct Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {selectedNotif.phone && (
                <a
                  href={`tel:${selectedNotif.phone}`}
                  className="flex-1 py-3 px-3 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-[#19C7A0] border border-[#1E2945] text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>اتصال بالمسؤول</span>
                </a>
              )}

              <a
                href={createWhatsAppUrl(
                  ORIKET_COMPANY_PHONE,
                  `السلام عليكم، بخصوص الإشعار:\n${selectedNotif.title}\n${selectedNotif.description}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-3 rounded-2xl bg-[#19C7A0] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>واتساب الدعم الفني</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
