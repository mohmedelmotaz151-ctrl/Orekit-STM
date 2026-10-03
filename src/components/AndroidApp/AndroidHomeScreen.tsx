import React, { useState } from 'react';
import { User, Site, Visit, OrkeitServiceOrder, ClientIncident } from '../../types';
import { 
  Building2, 
  FileCheck, 
  Flame, 
  MapPin, 
  PlusCircle, 
  ClipboardList, 
  Clock, 
  ChevronLeft, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  PhoneCall,
  Search,
  Wrench,
  FileText,
  Calculator
} from 'lucide-react';
import { ORKEIT_SERVICES } from './AndroidServicesScreen';
import { AndroidTrackingModal } from './AndroidTrackingModal';

interface AndroidHomeScreenProps {
  currentUser: User;
  sites: Site[];
  visits: Visit[];
  orders: OrkeitServiceOrder[];
  incidents: ClientIncident[];
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  onOpenNewVisit: () => void;
  onOpenTracking: (order: OrkeitServiceOrder) => void;
}

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  currentUser,
  sites,
  visits,
  orders,
  incidents,
  onNavigateTab,
  onOpenNewVisit,
  onOpenTracking,
}) => {
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrkeitServiceOrder | null>(null);

  // Key stats calculations
  const approvedSitesCount = sites.filter((s) => s.approvalStatus === 'approved').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed').length;
  const extinguishersTotalCount = sites.reduce(
    (sum, s) => sum + (s.equipment?.extinguishers?.totalCount || 0),
    0
  );
  const urgentIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');

  // Top active order for tracking preview
  const topActiveOrder = orders.find((o) => o.status !== 'completed') || orders[0];

  return (
    <div className="space-y-4 pb-24 w-full animate-fadeIn">
      
      {/* ==================================================== */}
      {/* 1. USER WELCOME BANNER                                */}
      {/* ==================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#10172B] via-[#0D1C3D] to-[#070B1C] border border-[#1E2945] shadow-xl relative overflow-hidden space-y-3">
        {/* Glow Element */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-[#20A9FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#20A9FF] font-bold block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#19C7A0] animate-pulse" />
              منظومة أوريكيت للسلامة والوقاية
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#F5F7FF]">
              أهلاً بك، {currentUser.name} 👋
            </h2>
            <p className="text-xs text-[#8992AA]">
              {currentUser.facilityName || currentUser.assignedCity || 'إدارة عقود الصيانة وتراخيص الدفاع المدني'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#070B1C] border border-[#1E2945] p-1 shadow-md shrink-0 flex items-center justify-center">
            <img 
              src="/pwa-192x192.png" 
              alt="ORKEIT" 
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Date & Location Pill */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-[#1E2945]/70 text-[11px] text-[#8992AA]">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#20A9FF]" />
            <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </span>

          <span className="px-2 py-0.5 rounded-lg bg-[#070B1C] text-[#8992AA] border border-[#1E2945] font-medium">
            المملكة العربية السعودية 🇸🇦
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. IMPORTANT STATS (2-column Android Grid)           */}
      {/* ==================================================== */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#8992AA] px-1">
          نظرة سريعة على مؤشرات السلامة
        </h3>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          
          {/* Stat 1: Contracts / Sites */}
          <div 
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] cursor-pointer transition active:scale-[0.98] shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[#8992AA]">
              <span className="text-[11px] font-medium">المنشآت والعقود</span>
              <Building2 className="w-4 h-4 text-[#20A9FF]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F7FF] font-mono">
              {sites.length}
            </div>
            <span className="text-[10px] text-[#19C7A0] font-medium block">
              {approvedSitesCount} معتمد في سلامة
            </span>
          </div>

          {/* Stat 2: Active Orders */}
          <div 
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] cursor-pointer transition active:scale-[0.98] shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[#8992AA]">
              <span className="text-[11px] font-medium">الطلبات النشطة</span>
              <ClipboardList className="w-4 h-4 text-[#FFB020]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F7FF] font-mono">
              {activeOrdersCount}
            </div>
            <span className="text-[10px] text-[#20A9FF] font-medium block">
              {orders.length} إجمالي الطلبات
            </span>
          </div>

          {/* Stat 3: Extinguishers Serviced */}
          <div 
            onClick={() => onNavigateTab('services')}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] cursor-pointer transition active:scale-[0.98] shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[#8992AA]">
              <span className="text-[11px] font-medium">طفايات الحريق</span>
              <Flame className="w-4 h-4 text-[#EF3340]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F7FF] font-mono">
              {extinguishersTotalCount}
            </div>
            <span className="text-[10px] text-[#19C7A0] font-medium block">
              مفحوصة ومعتمدة
            </span>
          </div>

          {/* Stat 4: Field Visits */}
          <div 
            onClick={() => {
              if (currentUser.role === 'agent' || currentUser.role === 'admin') {
                onOpenNewVisit();
              } else {
                onNavigateTab('services');
              }
            }}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] cursor-pointer transition active:scale-[0.98] shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[#8992AA]">
              <span className="text-[11px] font-medium">الزيارات الميدانية</span>
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F7FF] font-mono">
              {visits.length}
            </div>
            <span className="text-[10px] text-purple-400 font-medium block">
              موثقة بتقنية GPS
            </span>
          </div>

        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. QUICK ACTIONS (الخدمات السريعة)                    */}
      {/* ==================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#F5F7FF] flex items-center gap-1.5">
            <span className="text-[#20A9FF]">⚡</span>
            <span>الخدمات السريعة</span>
          </h3>
          <button 
            onClick={() => onNavigateTab('services')}
            className="text-[11px] text-[#20A9FF] hover:underline font-medium"
          >
            عرض جميع الخدمات
          </button>
        </div>

        {/* 4 Large Touch Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          
          {/* Quick Action 1: طلب خدمة */}
          <button
            type="button"
            onClick={() => onNavigateTab('services')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#20A9FF] to-[#1E9BEB] text-[#070B1C] text-right font-bold transition-all shadow-md shadow-[#20A9FF]/20 active:scale-[0.97] flex flex-col justify-between min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#070B1C]/20 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-[#070B1C]" />
            </div>
            <div>
              <span className="text-xs font-black block">طلب خدمة</span>
              <span className="text-[10px] text-[#070B1C]/80 font-normal">إنذار، إطفاء، وتراخيص</span>
            </div>
          </button>

          {/* Quick Action 2: طلب زيارة ميدانية */}
          <button
            type="button"
            onClick={() => {
              if (currentUser.role === 'agent') {
                onOpenNewVisit();
              } else {
                onNavigateTab('services');
              }
            }}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-right font-bold border border-[#1E2945] transition-all shadow-md active:scale-[0.97] flex flex-col justify-between min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#F5F7FF] block">طلب زيارة</span>
              <span className="text-[10px] text-[#8992AA] font-normal">معاينة مهندس مختص</span>
            </div>
          </button>

          {/* Quick Action 3: طلب عقد صيانة */}
          <button
            type="button"
            onClick={() => onNavigateTab('services')}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-right font-bold border border-[#1E2945] transition-all shadow-md active:scale-[0.97] flex flex-col justify-between min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#19C7A0]/15 text-[#19C7A0] border border-[#19C7A0]/30 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#F5F7FF] block">طلب عقد صيانة</span>
              <span className="text-[10px] text-[#8992AA] font-normal">معتمد في سلامة وبلدي</span>
            </div>
          </button>

          {/* Quick Action 4: تتبع الطلب */}
          <button
            type="button"
            onClick={() => {
              if (topActiveOrder) {
                setActiveTrackingOrder(topActiveOrder);
              } else {
                onNavigateTab('orders');
              }
            }}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-right font-bold border border-[#1E2945] transition-all shadow-md active:scale-[0.97] flex flex-col justify-between min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#F5F7FF] block">تتبع الطلب</span>
              <span className="text-[10px] text-[#8992AA] font-normal">مراحل التنفيذ الحية</span>
            </div>
          </button>

        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. ACTIVE ORDER TRACKING PREVIEW (تتبع الطلب الحقيقي) */}
      {/* ==================================================== */}
      {topActiveOrder && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#F5F7FF] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#20A9FF]" />
              <span>متابعة حالة الطلب الحالي (Timeline)</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-[11px] text-[#20A9FF] hover:underline font-medium"
            >
              جميع الطلبات ({orders.length})
            </button>
          </div>

          <div 
            onClick={() => setActiveTrackingOrder(topActiveOrder)}
            className="p-4 rounded-3xl bg-[#10172B] border border-[#1E2945] shadow-lg space-y-3 cursor-pointer hover:border-[#20A9FF]/50 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-[#20A9FF] bg-[#20A9FF]/10 px-2 py-0.5 rounded-lg border border-[#20A9FF]/30 inline-block mb-1">
                  {topActiveOrder.orderNumber}
                </span>
                <h4 className="font-bold text-sm text-[#F5F7FF]">{topActiveOrder.serviceType}</h4>
                <p className="text-xs text-[#8992AA]">{topActiveOrder.siteName}</p>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#20A9FF]/15 text-[#20A9FF] border border-[#20A9FF]/30">
                {topActiveOrder.statusLabel}
              </span>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[#8992AA]">
                <span>المرحلة الحالية: <strong className="text-[#F5F7FF]">{topActiveOrder.statusLabel}</strong></span>
                <span className="text-[#19C7A0] font-medium">{topActiveOrder.estimatedCompletion || 'قيد المعالجة'}</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-[#070B1C] overflow-hidden p-0.5 border border-[#1E2945]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#20A9FF] to-[#19C7A0] transition-all duration-500"
                  style={{
                    width: topActiveOrder.status === 'received' ? '20%' :
                           topActiveOrder.status === 'review' ? '40%' :
                           topActiveOrder.status === 'pricing' ? '60%' :
                           topActiveOrder.status === 'quote_sent' ? '75%' :
                           topActiveOrder.status === 'in_progress' ? '85%' : '100%'
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E2945]/70 flex items-center justify-between text-xs text-[#20A9FF] font-bold">
              <span>عرض تفاصيل ومراحل الطلب كاملة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SERVICES CAROUSEL HIGHLIGHTS                       */}
      {/* ==================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#F5F7FF]">
            باقات وخدمات أوريكيت للسلامة
          </h3>
          <button
            onClick={() => onNavigateTab('services')}
            className="text-[11px] text-[#20A9FF] hover:underline font-medium"
          >
            عرض الكل
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ORKEIT_SERVICES.slice(0, 4).map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                onClick={() => onNavigateTab('services')}
                className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] cursor-pointer transition active:scale-[0.98] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl ${service.iconBg} ${service.iconColor} flex items-center justify-center shrink-0 border border-[#1E2945]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#F5F7FF] leading-tight">{service.name}</h4>
                    <span className="text-[10px] text-[#8992AA] block line-clamp-1">{service.features[0]}</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#8992AA] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. URGENT EMERGENCY NOTIFICATION (if any active)      */}
      {/* ==================================================== */}
      {urgentIncidents.length > 0 && (
        <div 
          onClick={() => onNavigateTab('notifications')}
          className="p-4 rounded-3xl bg-gradient-to-r from-red-950/80 to-[#10172B] border-2 border-[#EF3340] shadow-xl shadow-red-950/30 cursor-pointer transition active:scale-[0.99] space-y-2 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <span className="bg-[#EF3340] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              🚨 بلاغ طوارئ صيانة نشط
            </span>
            <span className="text-xs text-red-300 font-bold">
              {urgentIncidents.length} بلاغ
            </span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#F5F7FF]">{urgentIncidents[0].siteName}</h4>
            <p className="text-xs text-red-200/80 line-clamp-1">{urgentIncidents[0].title}: {urgentIncidents[0].description}</p>
          </div>
          <span className="text-[11px] text-[#20A9FF] font-bold block pt-1 border-t border-red-900/60">
            فتح البلاغ وإجراءات الطوارئ ➔
          </span>
        </div>
      )}

      {/* Tracking Modal */}
      <AndroidTrackingModal
        order={activeTrackingOrder}
        isOpen={Boolean(activeTrackingOrder)}
        onClose={() => setActiveTrackingOrder(null)}
      />

    </div>
  );
};
