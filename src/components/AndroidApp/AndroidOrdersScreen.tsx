import React, { useState } from 'react';
import { User, OrkeitServiceOrder } from '../../types';
import { 
  ClipboardList, 
  Search, 
  Clock, 
  ArrowLeft, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { AndroidTrackingModal } from './AndroidTrackingModal';

interface AndroidOrdersScreenProps {
  currentUser: User;
  orders: OrkeitServiceOrder[];
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  onOpenTracking: (order: OrkeitServiceOrder) => void;
}

export const AndroidOrdersScreen: React.FC<AndroidOrdersScreenProps> = ({
  currentUser,
  orders,
  onNavigateTab,
  onOpenTracking,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrkeitServiceOrder | null>(null);

  const getStatusBadge = (status: OrkeitServiceOrder['status']) => {
    switch (status) {
      case 'received':
      case 'review':
        return {
          label: 'قيد المراجعة',
          bg: 'bg-amber-500/15 text-[#FFB020] border-amber-500/40',
          dot: 'bg-[#FFB020]',
        };
      case 'pricing':
      case 'quote_sent':
        return {
          label: 'بانتظار الاعتماد',
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
          dot: 'bg-purple-400',
        };
      case 'in_progress':
        return {
          label: 'قيد التنفيذ',
          bg: 'bg-[#20A9FF]/15 text-[#20A9FF] border-[#20A9FF]/40',
          dot: 'bg-[#20A9FF] animate-ping',
        };
      case 'completed':
        return {
          label: 'مكتمل',
          bg: 'bg-[#19C7A0]/15 text-[#19C7A0] border-[#19C7A0]/40',
          dot: 'bg-[#19C7A0]',
        };
      default:
        return {
          label: 'قيد المعالجة',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const filteredOrders = orders.filter((ord) => {
    // Tab filter
    if (selectedFilter === 'pending' && !['received', 'review'].includes(ord.status)) return false;
    if (selectedFilter === 'in_progress' && !['pricing', 'quote_sent', 'in_progress'].includes(ord.status)) return false;
    if (selectedFilter === 'completed' && ord.status !== 'completed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchType = ord.serviceType.toLowerCase().includes(q);
      const matchSite = ord.siteName.toLowerCase().includes(q);
      return matchNum || matchType || matchSite;
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-24 w-full animate-fadeIn">
      
      {/* Screen Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#F5F7FF]">
            سجل الطلبات وتتبع العمليات
          </h2>
          <p className="text-xs text-[#8992AA]">
            متابعة حالة زيارات السلامة والعقود وتراخيص الدفاع المدني
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('services')}
          className="py-2 px-3 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#20A9FF]/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>طلب جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8992AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث برقم الطلب (ORKEIT-2026-XXXX) أو الخدمة أو المنشأة..."
          className="w-full bg-[#10172B] border border-[#1E2945] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-[#F5F7FF] placeholder-[#8992AA] focus:outline-none focus:border-[#20A9FF]"
        />
      </div>

      {/* Filter Tabs (Horizontal Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: `الكل (${orders.length})` },
          { id: 'pending', label: 'قيد المراجعة' },
          { id: 'in_progress', label: 'قيد التنفيذ' },
          { id: 'completed', label: 'المكتملة' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-95 ${
              selectedFilter === tab.id
                ? 'bg-[#20A9FF] text-[#070B1C] font-bold shadow-sm shadow-[#20A9FF]/20'
                : 'bg-[#10172B] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Cards List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-[#10172B] rounded-3xl border border-[#1E2945] space-y-3">
            <ClipboardList className="w-12 h-12 text-[#8992AA]/50 mx-auto" />
            <h3 className="font-bold text-sm text-[#F5F7FF]">لا توجد طلبات في هذا القسم</h3>
            <p className="text-xs text-[#8992AA] max-w-sm mx-auto">
              يمكنك طلب خدمة سلامة جديدة أو استعراض جميع الخدمات المتاحة
            </p>
            <button
              onClick={() => onNavigateTab('services')}
              className="py-2 px-4 rounded-xl bg-[#20A9FF] text-[#070B1C] font-bold text-xs inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>استعراض الخدمات وطلب خدمة</span>
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);

            return (
              <div
                key={order.id}
                onClick={() => setActiveTrackingOrder(order)}
                className="bg-[#10172B] hover:bg-[#151F38] p-4 rounded-3xl border border-[#1E2945] shadow-md space-y-3 cursor-pointer transition active:scale-[0.99]"
              >
                {/* Order Card Top: Order Number & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#20A9FF] bg-[#20A9FF]/10 px-2.5 py-1 rounded-xl border border-[#20A9FF]/30">
                      {order.orderNumber}
                    </span>
                    {order.urgent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EF3340] text-white">
                        🚨 عاجل
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Service Type & Site Name */}
                <div>
                  <h3 className="font-bold text-sm text-[#F5F7FF] leading-snug">
                    {order.serviceType}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#8992AA] mt-1">
                    <Building2 className="w-3.5 h-3.5 text-[#20A9FF]" />
                    <span className="truncate">{order.siteName}</span>
                  </div>
                </div>

                {/* Details Row: Date & Estimated Time */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]/70">
                  <div className="flex items-center gap-1.5 text-[#8992AA]">
                    <Calendar className="w-3.5 h-3.5 text-[#8992AA]" />
                    <span>{order.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#19C7A0] justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.estimatedCompletion || 'قيد المتابعة'}</span>
                  </div>
                </div>

                {/* Card Action Button: عرض التفاصيل والتتبع */}
                <div className="pt-2 border-t border-[#1E2945]/70 flex items-center justify-between">
                  <span className="text-xs text-[#8992AA]">
                    انقر لتتبع مراحل الطلب
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTrackingOrder(order);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#20A9FF] font-bold text-xs flex items-center gap-1 transition active:scale-95"
                  >
                    <span>عرض التفاصيل والتتبع</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tracking Modal */}
      <AndroidTrackingModal
        order={activeTrackingOrder}
        isOpen={Boolean(activeTrackingOrder)}
        onClose={() => setActiveTrackingOrder(null)}
      />

    </div>
  );
};
