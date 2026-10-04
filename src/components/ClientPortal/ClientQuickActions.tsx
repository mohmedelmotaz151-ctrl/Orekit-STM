import React, { useState } from 'react';
import { User, Site, OrkeitServiceOrder, ClientIncident, ContractRenewalRequest } from '../../types';
import { 
  Flame, 
  ShieldAlert, 
  FileCheck, 
  Wrench, 
  PhoneCall, 
  BellRing, 
  MapPin, 
  Calculator, 
  CheckCircle2, 
  Send, 
  X, 
  Clock, 
  MessageCircle,
  Sparkles,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface ClientQuickActionsProps {
  currentUser: User;
  linkedSite?: Site | null;
  onOrderCreated: (order: OrkeitServiceOrder) => void;
  onSaveIncident?: (incident: ClientIncident) => void;
  onSaveRenewal?: (renewal: ContractRenewalRequest) => void;
  onOpenTracking?: (order: OrkeitServiceOrder) => void;
}

interface ClientQuickActionItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeBg?: string;
  category: OrkeitServiceOrder['serviceCategory'];
  isUrgent?: boolean;
}

const CLIENT_QUICK_SERVICES: ClientQuickActionItem[] = [
  {
    id: 'emergency',
    title: 'طلب طوارئ صيانة فوري 24/7',
    desc: 'استجابة فورية لإنذارات الحريق الكاذبة، انقطاع مضخات الإطفاء، وتسريب شبكات الرش',
    icon: PhoneCall,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    badge: '🚨 استجابة طوارئ',
    badgeBg: 'bg-red-600 text-white animate-pulse',
    category: 'emergency',
    isUrgent: true,
  },
  {
    id: 'contract',
    title: 'طلب عقد صيانة معتمد للدفاع المدني',
    desc: 'عقد صيانة سنوي إلكتروني معتمد لدى منصة سلامة وبلدي لتفادي الغرامات وإغلاق النشاط',
    icon: FileCheck,
    iconBg: 'bg-[#20A9FF]/20',
    iconColor: 'text-[#20A9FF]',
    badge: 'معتمد بسلامة',
    badgeBg: 'bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/40',
    category: 'contract',
  },
  {
    id: 'extinguishers',
    title: 'طلب فحص وتعبئة طفايات الحريق',
    desc: 'فحص واختبار ضغط وتعبئة الطفايات بموقع منشأتك مع كروت الصيانة والملصق المعتمد',
    icon: Flame,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'خدمة سريعة بالموقع',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    category: 'fire_fighting',
  },
  {
    id: 'visit',
    title: 'طلب زيارة فنية ومعاينة مهندس مختص',
    desc: 'حضور مهندس فحص معتمد لمعاينة الموقع وتحديد متطلبات السلامة ومعالجة ملاحظات التفتيش',
    icon: MapPin,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badge: 'معاينة شاملة',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    category: 'visit',
  },
  {
    id: 'alarm_systems',
    title: 'فحص وبرمجة أجهزة الإنذار والمضخات',
    desc: 'اختبار كواشف الدخان والحرارة، لوحة التحكم الرئيسية، مضخات الإطفاء وشبكة الرشاشات',
    icon: BellRing,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'شهادة كفاءة',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    category: 'alarm',
  },
  {
    id: 'quotation_consult',
    title: 'طلب استشارة سلامة وعرض سعر رسمي',
    desc: 'دراسة هندسية متكاملة لمتطلبات المنشأة وتقديم عرض سعر رسمي ومنافس لمشاريعك',
    icon: Calculator,
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    badge: 'عرض رسمي معتمد',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    category: 'quotation',
  },
];

export const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({
  currentUser,
  linkedSite,
  onOrderCreated,
  onSaveIncident,
  onSaveRenewal,
  onOpenTracking,
}) => {
  const [selectedService, setSelectedService] = useState<ClientQuickActionItem | null>(null);
  const [notes, setNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<OrkeitServiceOrder | null>(null);

  const facilityName = currentUser.facilityName || linkedSite?.name || 'منشأة معتمدة';
  const clientPhone = currentUser.phone || currentUser.username || '0555334577';

  const handleOpenAction = (service: ClientQuickActionItem) => {
    setSelectedService(service);
    setNotes('');
    setPreferredDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);

    const now = new Date();
    const orderNumber = `ORKEIT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: OrkeitServiceOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      serviceType: selectedService.title,
      serviceCategory: selectedService.category,
      siteName: facilityName,
      clientName: currentUser.name,
      clientPhone,
      clientUserId: currentUser.id,
      date: now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
      createdAt: now.toISOString(),
      status: selectedService.isUrgent ? 'in_progress' : 'received',
      statusLabel: selectedService.isUrgent ? 'قيد المعالجة الفورية (طوارئ)' : 'تم استلام الطلب',
      notes: notes.trim() || (selectedService.isUrgent ? 'طلب صيانة طارئ من العميل' : 'طلب خدمة سريع من العميل'),
      estimatedCompletion: selectedService.isUrgent ? 'استجابة طوارئ فورية' : (preferredDate ? `موعد مفضل: ${preferredDate}` : 'خلال 24 ساعة'),
      urgent: selectedService.isUrgent,
      isReadByAdmin: false,
    };

    // 1. Register unified service order
    onOrderCreated(newOrder);

    // 2. If it's emergency or maintenance, also register incident for alarm dispatching
    if (selectedService.isUrgent && onSaveIncident) {
      const newInc: ClientIncident = {
        id: `inc_${Date.now()}`,
        siteId: linkedSite?.id || `site_${Date.now()}`,
        siteName: facilityName,
        clientUserId: currentUser.id,
        clientName: currentUser.name,
        clientPhone,
        title: `🚨 بلاغ طوارئ سريع: ${selectedService.title}`,
        category: 'extinguisher',
        priority: 'urgent',
        description: notes.trim() || 'بلاغ طوارئ سريع مقدم عبر الخدمات السريعة بحساب العميل',
        locationDetails: 'المنشأة الرئيسية',
        status: 'pending',
        createdAt: now.toISOString(),
        statusHistory: [
          {
            changedAt: now.toISOString(),
            status: 'pending',
            changedBy: currentUser.name,
            notes: 'تم استلام بلاغ الطوارئ السريع وإشعار فريق الإدارة فوراً.',
          },
        ],
      };
      onSaveIncident(newInc);
    }

    // 3. If contract renewal, also create renewal request
    if (selectedService.id === 'contract' && onSaveRenewal) {
      const newRenewal: ContractRenewalRequest = {
        id: `rn_${Date.now()}`,
        siteId: linkedSite?.id || `site_${Date.now()}`,
        siteName: facilityName,
        clientUserId: currentUser.id,
        clientName: currentUser.name,
        clientPhone,
        requestedDurationYears: 1,
        notes: notes.trim() || 'طلب عقد صيانة سريع عبر حساب العميل',
        status: 'pending',
        createdAt: now.toISOString(),
      };
      onSaveRenewal(newRenewal);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedService(null);
      setSuccessOrder(newOrder);
    }, 450);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Header section with pulsating badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#20A9FF]/20 text-[#20A9FF] flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F5F7FF] flex items-center gap-1.5">
              <span>الخدمات السريعة لحسابك</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#19C7A0]/20 text-[#19C7A0] border border-[#19C7A0]/40">
                مباشر للإدارة
              </span>
            </h3>
            <p className="text-[11px] text-[#8992AA]">
              اختر الخدمة المطلوبة ليتم إشعار إدارة أوريكيت فورياً ومعالجة طلبك
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Quick Services (Mobile-friendly 2-column or 1-column layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {CLIENT_QUICK_SERVICES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleOpenAction(item)}
              className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 shadow-md active:scale-[0.98] ${
                item.isUrgent
                  ? 'bg-gradient-to-r from-red-950/70 via-[#10172B] to-[#10172B] border-red-600/80 hover:border-red-500'
                  : 'bg-[#10172B] hover:bg-[#151F38] border-[#1E2945] hover:border-[#20A9FF]/60'
              }`}
            >
              {/* Top: Icon + Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 border border-[#1E2945]`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${item.badgeBg}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#F5F7FF] leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#8992AA] mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Action trigger button */}
              <div className="pt-2 border-t border-[#1E2945]/70 flex items-center justify-between text-[11px]">
                <span className={`font-bold flex items-center gap-1 ${
                  item.isUrgent ? 'text-red-400' : 'text-[#20A9FF]'
                }`}>
                  <span>{item.isUrgent ? 'طلب طوارئ فوري ➔' : 'طلب الخدمة الآن ➔'}</span>
                </span>
                <span className="text-[10px] text-[#8992AA] font-mono">
                  ORKEIT
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal for requesting the service */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-4 sm:p-5 border-b border-[#1E2945] flex items-center justify-between gap-3 bg-[#070B1C]/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${selectedService.iconBg} ${selectedService.iconColor} border border-[#1E2945] flex items-center justify-center shrink-0`}>
                  <selectedService.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-[#8992AA] font-bold block">
                    طلب خدمة سريعة للإدارة
                  </span>
                  <h3 className="font-bold text-sm text-[#F5F7FF] leading-tight">
                    {selectedService.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              
              {/* Facility name preview */}
              <div className="bg-[#070B1C] p-3 rounded-2xl border border-[#1E2945] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#8992AA] block">المنشأة المستفيدة:</span>
                  <span className="font-bold text-[#F5F7FF]">{facilityName}</span>
                </div>
                <div className="text-left font-mono" dir="ltr">
                  <span className="text-[10px] text-[#8992AA] block">رقم التواصل:</span>
                  <span className="font-bold text-[#19C7A0]">{clientPhone}</span>
                </div>
              </div>

              {/* Specific notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#F5F7FF] block">
                  ملاحظات وتفاصيل طلبك:
                </label>
                <textarea
                  rows={3}
                  required={selectedService.isUrgent}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    selectedService.isUrgent
                      ? 'وضح تفاصيل العطل الطارئ أو مكان المشكلة بالمنشأة...'
                      : 'وضح أي تفاصيل أو عدد الطفايات أو متطلبات الدفاع المدني المراد إنجازها...'
                  }
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl p-3 text-xs text-[#F5F7FF] placeholder-[#8992AA] focus:outline-none focus:border-[#20A9FF]"
                />
              </div>

              {/* Preferred visit time if not emergency */}
              {!selectedService.isUrgent && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F5F7FF] block">
                    الموعد المفضل لزيارة الفريق الفني (اختياري):
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7FF] focus:outline-none focus:border-[#20A9FF]"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                    selectedService.isUrgent
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                      : 'bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] shadow-[#20A9FF]/25'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جارٍ إرسال الطلب وإشعار الإدارة...' : 'إرسال الطلب للإدارة فوراً'}</span>
                </button>

                <a
                  href={createWhatsAppUrl(
                    ORIKET_COMPANY_PHONE,
                    `السلام عليكم ورحمة الله،\nمعكم العميل: ${currentUser.name}\nمنشأة: ${facilityName}\nأود طلب خدمة سريعة: ${selectedService.title}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#19C7A0] text-[#070B1C] flex items-center justify-center transition active:scale-95"
                  title="مراسلة واتساب فورية"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal / Toast */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B1C]/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#10172B] border border-[#1E2945] rounded-3xl p-5 max-w-sm w-full text-center space-y-3.5 shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-[#19C7A0]/20 text-[#19C7A0] border border-[#19C7A0]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] text-[#20A9FF] font-mono font-bold block mb-1">
                {successOrder.orderNumber}
              </span>
              <h3 className="text-base font-black text-[#F5F7FF]">
                تم إرسال طلبك بنجاح!
              </h3>
              <p className="text-xs text-[#8992AA] mt-1 leading-relaxed">
                تم قيد الطلب وإشعار إدارة شركة أوريكيت فوراً كإشعار جديد، وسيتواصل معك الفريق الفني لمتابعة التنفيذ.
              </p>
            </div>

            <div className="p-3 bg-[#070B1C] rounded-2xl border border-[#1E2945] text-xs text-right space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8992AA]">الخدمة:</span>
                <span className="font-bold text-[#F5F7FF]">{successOrder.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8992AA]">المنشأة:</span>
                <span className="font-bold text-[#20A9FF]">{successOrder.siteName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8992AA]">الحالة:</span>
                <span className="font-bold text-[#19C7A0]">{successOrder.statusLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onOpenTracking && (
                <button
                  type="button"
                  onClick={() => {
                    const ord = successOrder;
                    setSuccessOrder(null);
                    onOpenTracking(ord);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#20A9FF] text-[#070B1C] font-bold text-xs transition active:scale-95"
                >
                  تتبع مراحل الطلب
                </button>
              )}

              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] font-bold text-xs border border-[#1E2945] transition active:scale-95"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
