import React, { useState } from 'react';
import { User, Site, OrkeitServiceOrder } from '../../types';
import { 
  FileCheck, 
  ShieldAlert, 
  BellRing, 
  Flame, 
  MapPin, 
  Calculator, 
  PhoneCall, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  X,
  Send,
  MessageCircle
} from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface AndroidServicesScreenProps {
  currentUser: User;
  sites: Site[];
  onOrderCreated: (order: OrkeitServiceOrder) => void;
  onOpenNewVisit?: () => void;
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
}

interface ServiceDefinition {
  id: string;
  name: string;
  category: 'contract' | 'civil_defense' | 'alarm' | 'fire_fighting' | 'visit' | 'quotation' | 'emergency';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  shortDesc: string;
  features: string[];
  badge?: string;
  badgeColor?: string;
  isEmergency?: boolean;
}

export const ORKEIT_SERVICES: ServiceDefinition[] = [
  {
    id: 'contract',
    name: 'عقد صيانة معتمد للدفاع المدني',
    category: 'contract',
    icon: FileCheck,
    iconBg: 'bg-[#20A9FF]/15',
    iconColor: 'text-[#20A9FF]',
    shortDesc: 'عقد صيانة سنوي إلكتروني معتمد لدى منصة سلامة والدفاع المدني لجميع الأنشطة والمنشآت التجارية والصناعية.',
    features: ['معتمد في منصة سلامة', 'تقارير فنية دورية', 'زيارات طوارئ مشمولة'],
    badge: 'الأكثر طلباً',
    badgeColor: 'bg-[#20A9FF]/20 text-[#20A9FF] border-[#20A9FF]/40',
  },
  {
    id: 'civil_defense',
    name: 'تمديد شهادة الدفاع المدني وتقرير سلامة',
    category: 'civil_defense',
    icon: ShieldAlert,
    iconBg: 'bg-[#19C7A0]/15',
    iconColor: 'text-[#19C7A0]',
    shortDesc: 'إصدار وتجديد تقرير السلامة المعتمد وتمديد تراخيص الدفاع المدني وبلدي لتفادي الغرامات وإغلاق النشاط.',
    features: ['إنجاز سريع خلال 48 ساعة', 'مطابقة لاشتراطات كود البناء', 'تسليم الشهادة إلكترونياً'],
    badge: 'إنجاز سريع',
    badgeColor: 'bg-[#19C7A0]/20 text-[#19C7A0] border-[#19C7A0]/40',
  },
  {
    id: 'alarm',
    name: 'فحص وبرمجة أنظمة الإنذار المبكر',
    category: 'alarm',
    icon: BellRing,
    iconBg: 'bg-[#FFB020]/15',
    iconColor: 'text-[#FFB020]',
    shortDesc: 'فحص وصيانة كواشف الدخان والحرارة، لوحات التحكم المعنونة والتقليدية، والكواسر وأجراس الإنذار.',
    features: ['فحص حساسات الدخان والحرارة', 'برمجة اللوحات الرئيسية', 'شهادة فحص كفاءة النظام'],
  },
  {
    id: 'fire_fighting',
    name: 'فحص شبكات ومضخات وخراطيم الإطفاء',
    category: 'fire_fighting',
    icon: Flame,
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    shortDesc: 'اختبار ضغط شبكات الرش الآلي، صيانة مضخات الحريق (ديزل/كهرباء/جوكي)، وتعبئة وفحص طفايات الحريق.',
    features: ['اختبار ضغط شبكة الرش', 'فحص وتعبئة الطفايات بموقعك', 'صيانة وتجربة المضخات'],
  },
  {
    id: 'visit',
    name: 'زيارة فنية ومعاينة ميدانية شاملة',
    category: 'visit',
    icon: MapPin,
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    shortDesc: 'حضور مهندس وفني مختص لمعاينة الموقع وتحديد متطلبات السلامة ومعالجة ملاحظات الدفاع المدني بدقة.',
    features: ['حضور مهندس فحص معتمد', 'تقرير فني فوري بالثغرات', 'توصيات هندسية معتمدة'],
  },
  {
    id: 'quotation',
    name: 'طلب عرض سعر رسمي للمشاريع',
    category: 'quotation',
    icon: Calculator,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    shortDesc: 'تقديم عروض أسعار تفصيلية ومنافسة لتوريد وتركيب وصيانة أنظمة السلامة ومكافحة الحريق.',
    features: ['عروض أسعار معتمدة', 'أسعار منافسة للمشاريع', 'خيارات دفع مرنة'],
  },
  {
    id: 'emergency',
    name: 'طوارئ وأعطال السلامة 24/7',
    category: 'emergency',
    icon: PhoneCall,
    iconBg: 'bg-[#EF3340]/20',
    iconColor: 'text-[#EF3340]',
    shortDesc: 'استجابة فورية على مدار الساعة لإنذارات الحريق الكاذبة، انقطاع مضخات الإطفاء، وتسريب شبكات الرش.',
    features: ['استجابة سريعة على مدار 24 ساعة', 'فريق طوارئ متأهب', 'معالجة الأعطال الحرجة'],
    badge: 'طوارئ 24/7',
    badgeColor: 'bg-[#EF3340] text-white border-[#EF3340] animate-pulse',
    isEmergency: true,
  },
];

export const AndroidServicesScreen: React.FC<AndroidServicesScreenProps> = ({
  currentUser,
  sites,
  onOrderCreated,
  onOpenNewVisit,
  onNavigateTab,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [facilityName, setFacilityName] = useState(currentUser.facilityName || (sites[0]?.name || ''));
  const [phone, setPhone] = useState(currentUser.username || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleOpenRequest = (service: ServiceDefinition) => {
    setSelectedService(service);
    setIsRequestModalOpen(true);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);

    const newOrder: OrkeitServiceOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: `ORKEIT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceType: selectedService.name,
      serviceCategory: selectedService.category,
      siteName: facilityName.trim() || 'منشأة معتمدة',
      clientName: currentUser.name,
      clientPhone: phone.trim() || '0555334577',
      clientUserId: currentUser.id,
      date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
      createdAt: new Date().toISOString(),
      status: selectedService.isEmergency ? 'in_progress' : 'received',
      statusLabel: selectedService.isEmergency ? 'قيد المعالجة الفورية' : 'تم استلام الطلب',
      notes: notes.trim() || (selectedService.isEmergency ? 'طلب طوارئ عاجل' : 'طلب خدمة معتمد'),
      estimatedCompletion: selectedService.isEmergency ? 'استجابة فورية' : 'خلال 24-48 ساعة',
      urgent: selectedService.isEmergency,
      isReadByAdmin: false,
    };

    onOrderCreated(newOrder);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsRequestModalOpen(false);
      setNotes('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
      onNavigateTab('orders');
    }, 600);
  };

  return (
    <div className="space-y-4 pb-24 w-full animate-fadeIn">
      
      {/* Top Banner Card: Services Overview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#10172B] via-[#0D1B36] to-[#070B1C] border border-[#1E2945] shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="text-[11px] font-bold text-[#20A9FF]">
              بوابة خدمات السلامة والوقاية
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#F5F7FF]">
            خدمات أوريكيت المعتمدة
          </h2>
          <p className="text-xs text-[#8992AA] leading-relaxed max-w-xl">
            خدمات متكاملة لأنظمة الإنذار والإطفاء وعقود الصيانة السنوية المعتمدة لدى الدفاع المدني ومنصة سلامة.
          </p>
        </div>
      </div>

      {/* Services List / Cards (Mobile-first vertical stack) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {ORKEIT_SERVICES.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.id}
              onClick={() => handleOpenRequest(service)}
              className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md active:scale-[0.98] ${
                service.isEmergency
                  ? 'bg-gradient-to-r from-red-950/60 via-[#10172B] to-[#10172B] border-[#EF3340]/60 hover:border-[#EF3340]'
                  : 'bg-[#10172B] hover:bg-[#151F38] border-[#1E2945] hover:border-[#20A9FF]/50'
              }`}
            >
              {/* Card Top: Icon & Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${service.iconBg} ${service.iconColor} border border-[#1E2945] flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#F5F7FF] leading-snug">
                      {service.name}
                    </h3>
                    <span className="text-[11px] text-[#8992AA] block font-medium mt-0.5">
                      خدمة معتمدة لدى الدفاع المدني
                    </span>
                  </div>
                </div>

                {service.badge && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${service.badgeColor}`}>
                    {service.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-[#8992AA] leading-relaxed line-clamp-2">
                {service.shortDesc}
              </p>

              {/* Features Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {service.features.map((feat, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-[#070B1C] text-[#8992AA] border border-[#1E2945] flex items-center gap-1 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#19C7A0]" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>

              {/* Card Action Button */}
              <div className="pt-2 border-t border-[#1E2945]/70 flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  service.isEmergency ? 'text-[#EF3340]' : 'text-[#20A9FF]'
                }`}>
                  <span>{service.isEmergency ? 'طلب اتصال طوارئ فوري' : 'طلب هذه الخدمة الآن'}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>

                <span className="text-[11px] text-[#8992AA] font-mono">
                  ORKEIT
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Request Modal */}
      {isRequestModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-[#1E2945]" />
            </div>

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2945] flex items-center justify-between gap-3 bg-[#070B1C]/50">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${selectedService.iconBg} ${selectedService.iconColor} border border-[#1E2945] flex items-center justify-center`}>
                  <selectedService.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-[#8992AA] block font-bold">
                    طلب خدمة جديدة
                  </span>
                  <h3 className="font-bold text-sm text-[#F5F7FF]">
                    {selectedService.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmitOrder} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F7FF] block">
                  اسم المنشأة أو الموقع:
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="مثال: مطعم شواية الرياض / مستودع السلي..."
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7FF] placeholder-[#8992AA] focus:outline-none focus:border-[#20A9FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F7FF] block">
                  رقم هاتف التواصل:
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7FF] placeholder-[#8992AA] focus:outline-none focus:border-[#20A9FF] font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F7FF] block">
                  تفاصيل وملاحظات إضافية (اختياري):
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظات أو مواعيد تفضلها لمعاينة الموقع..."
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl p-3 text-xs text-[#F5F7FF] placeholder-[#8992AA] focus:outline-none focus:border-[#20A9FF]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                    selectedService.isEmergency
                      ? 'bg-[#EF3340] hover:bg-[#D92532] text-white shadow-[#EF3340]/25'
                      : 'bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] shadow-[#20A9FF]/25'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جارٍ إرسال الطلب...' : 'تأكيد وإرسال الطلب'}</span>
                </button>

                <a
                  href={createWhatsAppUrl(
                    ORIKET_COMPANY_PHONE,
                    `السلام عليكم ورحمة الله،\nأود طلب خدمة (${selectedService.name})\nالمنشأة: ${facilityName}\nرقم التواصل: ${phone}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-[#19C7A0] text-[#070B1C] font-bold text-xs flex items-center justify-center transition active:scale-95"
                  title="طلب مباشر عبر واتساب"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl bg-[#19C7A0] text-[#070B1C] font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>تم إرسال طلبك بنجاح! تم قيده وتوليد رقم الطلب في سجل الطلبات.</span>
        </div>
      )}

    </div>
  );
};
