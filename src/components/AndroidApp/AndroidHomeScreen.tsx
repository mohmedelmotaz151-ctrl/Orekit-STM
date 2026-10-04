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
  Calculator,
  Bell,
  Send,
  X,
  Sparkles,
  Phone,
  MessageCircle,
  Check
} from 'lucide-react';
import { ORKEIT_SERVICES } from './AndroidServicesScreen';
import { AndroidTrackingModal } from './AndroidTrackingModal';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';
import { soundNotifier } from '../../utils/soundNotifications';

interface AndroidHomeScreenProps {
  currentUser: User;
  sites: Site[];
  visits: Visit[];
  orders: OrkeitServiceOrder[];
  incidents: ClientIncident[];
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  onOpenNewVisit: () => void;
  onOpenTracking: (order: OrkeitServiceOrder) => void;
  onOrderCreated?: (order: OrkeitServiceOrder) => void;
  onUpdateOrder?: (orderId: string, updates: Partial<OrkeitServiceOrder>) => void;
  onOpenAdminCRM?: () => void;
}

interface QuickServiceItem {
  id: string;
  title: string;
  subtitle: string;
  category: OrkeitServiceOrder['serviceCategory'];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
  isUrgent?: boolean;
}

const QUICK_SERVICES: QuickServiceItem[] = [
  {
    id: 'emergency',
    title: 'طلب طوارئ صيانة فوري 24/7',
    subtitle: 'إنذارات، مضخات، وتسريب شبكات',
    category: 'emergency',
    icon: PhoneCall,
    accentColor: 'text-[#EF3340] bg-[#EF3340]/15 border-[#EF3340]/40',
    badge: '🚨 طوارئ 24/7',
    isUrgent: true,
  },
  {
    id: 'contract',
    title: 'طلب عقد صيانة معتمد',
    subtitle: 'معتمد في منصة سلامة وبلدي',
    category: 'contract',
    icon: FileCheck,
    accentColor: 'text-[#20A9FF] bg-[#20A9FF]/15 border-[#20A9FF]/40',
    badge: 'الأكثر طلباً',
  },
  {
    id: 'extinguishers',
    title: 'صيانة الكفاية وتعبئة الطفايات',
    subtitle: 'حصر الكفايات وتزكير قبل 10 أيام',
    category: 'fire_fighting',
    icon: Flame,
    accentColor: 'text-[#FFB020] bg-[#FFB020]/15 border-[#FFB020]/40',
    badge: 'تزكير ١٠ أيام',
  },
  {
    id: 'visit',
    title: 'طلب زيارة فنية ومعاينة مهندس',
    subtitle: 'معاينة شاملة وتحديد المتطلبات',
    category: 'visit',
    icon: MapPin,
    accentColor: 'text-purple-400 bg-purple-500/15 border-purple-500/40',
    badge: 'معاينة فنية',
  },
  {
    id: 'alarm',
    title: 'فحص أجهزة الإنذار والمضخات',
    subtitle: 'اختبار الكواشف واللوحات الرئيسية',
    category: 'alarm',
    icon: Wrench,
    accentColor: 'text-[#19C7A0] bg-[#19C7A0]/15 border-[#19C7A0]/40',
    badge: 'شهادة كفاءة',
  },
  {
    id: 'civil_defense',
    title: 'تمديد شهادة الدفاع المدني',
    subtitle: 'تقرير سلامة وتمديد الترخيص',
    category: 'civil_defense',
    icon: ShieldAlert,
    accentColor: 'text-teal-400 bg-teal-500/15 border-teal-500/40',
    badge: 'إنجاز 48 ساعة',
  },
  {
    id: 'quotation',
    title: 'طلب استشارة وعرض سعر رسمي',
    subtitle: 'عروض أسعار منافسة للمشاريع',
    category: 'quotation',
    icon: Calculator,
    accentColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
    badge: 'عرض رسمي',
  },
];

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  currentUser,
  sites,
  visits,
  orders,
  incidents,
  onNavigateTab,
  onOpenNewVisit,
  onOpenTracking,
  onOrderCreated,
  onUpdateOrder,
  onOpenAdminCRM,
}) => {
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrkeitServiceOrder | null>(null);

  // Quick Service Modal States (for Client Account instant ordering)
  const [selectedQuickService, setSelectedQuickService] = useState<QuickServiceItem | null>(null);
  const [facilityName, setFacilityName] = useState(
    currentUser.facilityName || sites[0]?.name || (currentUser.role === 'client' ? currentUser.name : 'منشأة معتمدة')
  );
  const [clientPhone, setClientPhone] = useState(currentUser.phone || currentUser.username || '0555334577');
  const [orderNotes, setOrderNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<OrkeitServiceOrder | null>(null);

  // Key stats calculations
  const approvedSitesCount = sites.filter((s) => s.approvalStatus === 'approved').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed').length;
  const extinguishersTotalCount = sites.reduce(
    (sum, s) => sum + (s.equipment?.extinguishers?.totalCount || 0),
    0
  );
  const urgentIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');

  // Admin notification: new unread quick service orders
  const unreadOrders = orders.filter((o) => !o.isReadByAdmin || o.status === 'received');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  // Top active order for tracking preview
  const topActiveOrder = orders.find((o) => o.status !== 'completed') || orders[0];

  const handleOpenQuickService = (service: QuickServiceItem) => {
    setSelectedQuickService(service);
    setOrderNotes('');
    setPreferredDate('');
  };

  const handleSubmitQuickOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickService) return;

    setIsSubmitting(true);
    const now = new Date();
    const orderNumber = `ORKEIT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: OrkeitServiceOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      serviceType: selectedQuickService.title,
      serviceCategory: selectedQuickService.category,
      siteName: facilityName.trim() || 'منشأة معتمدة',
      clientName: currentUser.name,
      clientPhone: clientPhone.trim() || '0555334577',
      clientUserId: currentUser.id,
      date: now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
      createdAt: now.toISOString(),
      status: selectedQuickService.isUrgent ? 'in_progress' : 'received',
      statusLabel: selectedQuickService.isUrgent ? 'قيد المعالجة الفورية (طوارئ)' : 'تم استلام الطلب',
      notes: orderNotes.trim() || (selectedQuickService.isUrgent ? 'طلب صيانة طارئ 24/7 من العميل' : 'طلب خدمة سريع من حساب العميل'),
      estimatedCompletion: selectedQuickService.isUrgent ? 'استجابة طوارئ فورية' : (preferredDate ? `موعد مفضل: ${preferredDate}` : 'خلال 24-48 ساعة'),
      urgent: selectedQuickService.isUrgent,
      isReadByAdmin: false,
    };

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }

    try {
      soundNotifier.playChime();
    } catch (err) {
      console.log('Audio chime error', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedQuickService(null);
      setSuccessOrder(newOrder);
    }, 450);
  };

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
      {/* 1.5 ADMIN NOTIFICATION ALERT: Quick Service Requests */}
      {/* ==================================================== */}
      {isAdmin && unreadOrders.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#10172B] via-[#0B2144] to-[#10172B] border-2 border-[#20A9FF] shadow-xl shadow-[#20A9FF]/15 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#20A9FF] animate-ping shrink-0" />
              <h3 className="text-xs sm:text-sm font-black text-[#F5F7FF] flex items-center gap-1.5 flex-wrap">
                <Bell className="w-4 h-4 text-[#20A9FF]" />
                <span>إشعار للإدارة: طلبات خدمات سريعة جديدة</span>
                <span className="px-2 py-0.5 rounded-full bg-[#20A9FF] text-[#070B1C] font-mono text-xs font-black">
                  {unreadOrders.length} جديد
                </span>
              </h3>
            </div>
            {onOpenAdminCRM && (
              <button
                onClick={onOpenAdminCRM}
                className="text-[11px] text-[#20A9FF] hover:underline font-bold shrink-0 bg-[#20A9FF]/10 px-2.5 py-1 rounded-xl border border-[#20A9FF]/30"
              >
                لوحة الإدارة CRM ↗
              </button>
            )}
          </div>

          {/* Top Unread Order Preview Card */}
          {(() => {
            const topOrder = unreadOrders[0];
            return (
              <div className="p-3 bg-[#070B1C]/95 rounded-2xl border border-[#1E2945] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#20A9FF] bg-[#20A9FF]/10 px-2 py-0.5 rounded-md border border-[#20A9FF]/20 inline-block mb-1">
                      {topOrder.orderNumber}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[#F5F7FF]">
                      {topOrder.serviceType}
                    </h4>
                    <p className="text-[11px] text-[#8992AA]">
                      {topOrder.siteName} • العميل: {topOrder.clientName} ({topOrder.clientPhone})
                    </p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                    topOrder.urgent 
                      ? 'bg-[#EF3340]/20 text-[#EF3340] border border-[#EF3340]/40 animate-pulse' 
                      : 'bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/40'
                  }`}>
                    {topOrder.statusLabel}
                  </span>
                </div>

                {topOrder.notes && (
                  <p className="text-[11px] text-[#F5F7FF]/90 bg-[#10172B] p-2.5 rounded-xl border border-[#1E2945]/70">
                    <span className="text-[#8992AA] font-bold block mb-0.5">تفاصيل الطلب:</span>
                    "{topOrder.notes}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => setActiveTrackingOrder(topOrder)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span>معاينة وتتبع الطلب</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`tel:${topOrder.clientPhone}`}
                    className="py-2 px-3 rounded-xl bg-[#10172B] hover:bg-[#151F38] text-[#F5F7FF] text-xs font-medium transition flex items-center gap-1 border border-[#1E2945]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19C7A0]" />
                    <span>اتصال</span>
                  </a>

                  <a
                    href={createWhatsAppUrl(topOrder.clientPhone, `مرحباً ${topOrder.clientName}، بخصوص طلبكم رقم ${topOrder.orderNumber} (${topOrder.serviceType}) لدى شركة أوريكيت للسلامة.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#19C7A0]/15 hover:bg-[#19C7A0]/25 text-[#19C7A0] text-xs font-medium transition flex items-center gap-1 border border-[#19C7A0]/30"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>

                  {onUpdateOrder && (
                    <button
                      onClick={() => onUpdateOrder(topOrder.id, { isReadByAdmin: true })}
                      className="py-2 px-3 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-xs font-medium transition flex items-center gap-1"
                      title="تأكيد واستلام الإشعار"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>استلام</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
            onClick={() => {
              if (onOpenAdminCRM) {
                onOpenAdminCRM();
              } else {
                onNavigateTab('services');
              }
            }}
            className="p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] border border-[#1E2945] hover:border-amber-500/40 cursor-pointer transition active:scale-[0.98] shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[#8992AA]">
              <span className="text-[11px] font-medium text-amber-300">صيانة الكفاية</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {extinguishersTotalCount}
            </div>
            <span className="text-[10px] text-amber-400 font-medium block">
              تزكير ١٠ أيام مفعّل
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
      {/* 3. QUICK ACTIONS (الخدمات السريعة في حساب العميل)   */}
      {/* ==================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20A9FF] animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-[#F5F7FF] flex items-center gap-1.5">
              <span>الخدمات السريعة</span>
              <span className="text-[10px] text-[#20A9FF] bg-[#20A9FF]/10 px-2 py-0.5 rounded-full border border-[#20A9FF]/20 font-normal">
                طلب فوري ومباشر
              </span>
            </h3>
          </div>
          <button 
            onClick={() => onNavigateTab('services')}
            className="text-[11px] text-[#20A9FF] hover:underline font-bold"
          >
            عرض الدليل الكامل ({QUICK_SERVICES.length})
          </button>
        </div>

        {/* Highlighted Emergency Banner Button if not in emergency */}
        <button
          type="button"
          onClick={() => handleOpenQuickService(QUICK_SERVICES[0])}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-[#EF3340]/20 to-red-950 border-2 border-[#EF3340] text-right font-bold transition shadow-lg shadow-red-950/40 active:scale-[0.98] flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF3340] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#EF3340]/40 group-hover:scale-105 transition">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">طلب طوارئ صيانة فوري 24/7</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EF3340] text-white font-bold animate-pulse">
                  استجابة فورية
                </span>
              </div>
              <span className="text-[11px] text-red-200/80 font-normal block mt-0.5">
                إنذارات كاذبة، انقطاع مضخات الإطفاء، وتسريب شبكات الرش
              </span>
            </div>
          </div>
          <span className="text-xs text-red-400 font-bold shrink-0 hidden sm:inline-block">
            إرسال طلب طوارئ ➔
          </span>
        </button>

        {/* 6 Quick Action Touch Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {QUICK_SERVICES.slice(1).map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleOpenQuickService(service)}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-right border border-[#1E2945] hover:border-[#20A9FF]/50 transition-all shadow-md active:scale-[0.97] flex flex-col justify-between min-h-[96px] group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl ${service.accentColor} flex items-center justify-center border group-hover:scale-110 transition`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {service.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#070B1C] text-[#8992AA] border border-[#1E2945] font-medium">
                      {service.badge}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-xs font-black text-[#F5F7FF] block leading-tight group-hover:text-[#20A9FF] transition">
                    {service.title}
                  </span>
                  <span className="text-[10px] text-[#8992AA] font-normal block mt-0.5 line-clamp-1">
                    {service.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
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

      {/* ==================================================== */}
      {/* 7. QUICK SERVICE REQUEST MODAL (In-place submission) */}
      {/* ==================================================== */}
      {selectedQuickService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0D152A] border border-[#1E2945] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#10172B] to-[#0D1C3D] border-b border-[#1E2945] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${selectedQuickService.accentColor} flex items-center justify-center border shrink-0`}>
                  <selectedQuickService.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-[#F5F7FF]">
                      {selectedQuickService.title}
                    </h3>
                    {selectedQuickService.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#20A9FF]/20 text-[#20A9FF] font-bold">
                        {selectedQuickService.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#8992AA]">
                    {selectedQuickService.subtitle}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedQuickService(null)}
                className="w-8 h-8 rounded-full bg-[#1E2945] text-[#8992AA] hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmitQuickOrder} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Notice Banner */}
              <div className="p-3 rounded-2xl bg-[#20A9FF]/10 border border-[#20A9FF]/20 text-xs text-[#20A9FF] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  سيتم تسجيل طلبك فوراً وتوجيهه كإشعار مباشر لفريق الإدارة الفنية لمباشرته دون تأخير.
                </span>
              </div>

              {/* Field 1: Facility / Site */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8992AA] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#20A9FF]" />
                  <span>اسم المنشأة / الموقع:</span>
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="مثال: مطعم شواية الرياض، مجمع تجاري..."
                  className="w-full py-2.5 px-3.5 bg-[#070B1C] border border-[#1E2945] rounded-xl text-sm text-[#F5F7FF] focus:outline-none focus:border-[#20A9FF] transition"
                />
              </div>

              {/* Field 2: Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8992AA] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#19C7A0]" />
                  <span>رقم الجوال للتواصل والمتابعة:</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full py-2.5 px-3.5 bg-[#070B1C] border border-[#1E2945] rounded-xl text-sm text-[#F5F7FF] focus:outline-none focus:border-[#20A9FF] transition text-right"
                />
              </div>

              {/* Field 3: Preferred Date / Timing */}
              {!selectedQuickService.isUrgent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8992AA] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFB020]" />
                    <span>الموعد أو التوقيت المفضل (اختياري):</span>
                  </label>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    placeholder="مثال: غداً صباحاً بين 9 - 12، أو بعد صلاة العصر"
                    className="w-full py-2.5 px-3.5 bg-[#070B1C] border border-[#1E2945] rounded-xl text-sm text-[#F5F7FF] focus:outline-none focus:border-[#20A9FF] transition"
                  />
                </div>
              )}

              {/* Field 4: Notes / Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8992AA] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>تفاصيل الطلب أو الملاحظات:</span>
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={
                    selectedQuickService.isUrgent
                      ? "اشرح العطل الطارئ باختصار (مثال: جرس الإنذار يعمل باستمرار، تسريب شبكة الإطفاء...)"
                      : "أضف أي تفاصيل أو استفسارات محددة ترغب بإبلاغ المهندس بها..."
                  }
                  className="w-full p-3 bg-[#070B1C] border border-[#1E2945] rounded-xl text-sm text-[#F5F7FF] focus:outline-none focus:border-[#20A9FF] transition resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    selectedQuickService.isUrgent
                      ? 'bg-[#EF3340] hover:bg-[#D92532] text-white shadow-[#EF3340]/30'
                      : 'bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] shadow-[#20A9FF]/30'
                  }`}
                >
                  {isSubmitting ? (
                    <span>جاري إرسال الطلب وإشعار الإدارة...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال طلب الخدمة الآن 🚀</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuickService(null)}
                  className="py-3 px-4 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#8992AA] hover:text-white text-sm font-medium transition"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. INSTANT SUCCESS CONFIRMATION MODAL               */}
      {/* ==================================================== */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0D152A] border-2 border-[#19C7A0] rounded-3xl p-5 shadow-2xl text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-[#19C7A0]/20 text-[#19C7A0] border border-[#19C7A0]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#F5F7FF]">
                تم إرسال طلبك بنجاح!
              </h3>
              <p className="text-xs text-[#8992AA]">
                تم تسجيل الطلب وإرسال إشعار فوري لصفحة إدارة أوريكيت لمباشرة الخدمة.
              </p>
            </div>

            {/* Order Details Badge */}
            <div className="p-3 bg-[#070B1C] rounded-2xl border border-[#1E2945] text-right space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8992AA]">رقم الطلب المعتمد:</span>
                <span className="font-mono font-bold text-[#20A9FF]">{successOrder.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8992AA]">الخدمة المطلوبة:</span>
                <span className="font-bold text-[#F5F7FF]">{successOrder.serviceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8992AA]">حالة الطلب:</span>
                <span className="font-bold text-[#19C7A0]">{successOrder.statusLabel}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const ord = successOrder;
                  setSuccessOrder(null);
                  setActiveTrackingOrder(ord);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-[#20A9FF]/20"
              >
                <span>متابعة مراحل الطلب (Timeline)</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <a
                href={createWhatsAppUrl(ORIKET_COMPANY_PHONE, `مرحباً، قمت بإرسال طلب خدمة رقم ${successOrder.orderNumber} (${successOrder.serviceType}) وأود المتابعة معكم.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#19C7A0]/15 hover:bg-[#19C7A0]/25 text-[#19C7A0] text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#19C7A0]/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب مع فريق الدعم</span>
              </a>

              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full py-2 px-4 rounded-xl bg-[#10172B] hover:bg-[#151F38] text-[#8992AA] hover:text-white text-xs font-medium transition border border-[#1E2945]"
              >
                إغلاق والعودة للرئيسية
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
