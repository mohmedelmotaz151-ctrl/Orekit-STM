import React from 'react';
import { OrkeitServiceOrder, OrderTrackingStep } from '../../types';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Phone, 
  ShieldCheck, 
  ChevronLeft,
  FileText
} from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface AndroidTrackingModalProps {
  order: OrkeitServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIMELINE_STEPS: Array<{
  key: OrderTrackingStep;
  title: string;
  desc: string;
}> = [
  { key: 'received', title: 'تم استلام الطلب', desc: 'تم قيد الطلب في النظام وتعيين فريق المتابعة الفني' },
  { key: 'review', title: 'المراجعة والتدقيق', desc: 'مراجعة متطلبات المنشأة ورخص الدفاع المدني' },
  { key: 'pricing', title: 'المعاينة والتسعير', desc: 'فحص المواصفات وإعداد التسعير المعتمد' },
  { key: 'quote_sent', title: 'إرسال العرض والاعتماد', desc: 'إرسال عرض السعر وبانتظار توقيع العميل' },
  { key: 'in_progress', title: 'قيد التنفيذ والتركيب', desc: 'تنفيذ أعمال الصيانة والفحص وإصدار التقرير' },
  { key: 'completed', title: 'مكتمل وتسليم التقرير', desc: 'تم إنهاء الطلب وتسليم شهادة وتقرير السلامة' },
];

export const AndroidTrackingModal: React.FC<AndroidTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === order.status);
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Sheet Top Drag Handle (Mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-[#1E2945]" />
        </div>

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1E2945] flex items-center justify-between gap-3 bg-[#070B1C]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#20A9FF]/15 text-[#20A9FF] border border-[#20A9FF]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#8992AA] block font-mono">
                {order.orderNumber}
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#F5F7FF]">
                تتبع حالة الطلب
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center transition active:scale-95"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Order Summary Card */}
          <div className="p-4 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-[#F5F7FF]">{order.serviceType}</h4>
                <p className="text-xs text-[#8992AA] mt-0.5">{order.siteName}</p>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/40 shrink-0">
                {order.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#1E2945]/70 text-[#8992AA]">
              <div>
                <span className="text-[10px] block">تاريخ الإنشاء</span>
                <span className="text-[#F5F7FF] font-medium font-mono">{order.date}</span>
              </div>
              <div>
                <span className="text-[10px] block">الموعد المتوقع</span>
                <span className="text-[#19C7A0] font-medium">{order.estimatedCompletion || 'خلال 24-48 ساعة'}</span>
              </div>
            </div>

            {order.notes && (
              <div className="p-2.5 rounded-xl bg-[#10172B] border border-[#1E2945] text-xs text-[#F5F7FF]/90">
                <span className="text-[10px] text-[#8992AA] block mb-0.5 font-bold">ملاحظات الطلب:</span>
                <p className="text-[11px]">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Interactive Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#8992AA] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#20A9FF]" />
              <span>مراحل معالجة الطلب (Timeline)</span>
            </h4>

            <div className="p-4 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-4">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                const isUpcoming = idx > activeIndex;

                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    {/* Vertical Connector Line */}
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div 
                        className={`absolute right-4 top-8 bottom-0 w-0.5 -mb-4 transition-colors ${
                          isPassed ? 'bg-[#19C7A0]' : isCurrent ? 'bg-gradient-to-b from-[#20A9FF] to-[#1E2945]' : 'bg-[#1E2945]'
                        }`}
                      />
                    )}

                    {/* Step Icon Indicator */}
                    <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isPassed
                        ? 'bg-[#19C7A0]/20 text-[#19C7A0] border border-[#19C7A0]'
                        : isCurrent
                        ? 'bg-[#20A9FF] text-[#070B1C] shadow-[0_0_12px_#20A9FF] ring-4 ring-[#20A9FF]/20 animate-pulse'
                        : 'bg-[#10172B] text-[#8992AA] border border-[#1E2945]'
                    }`}>
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isCurrent ? 'text-[#20A9FF]' : isPassed ? 'text-[#F5F7FF]' : 'text-[#8992AA]'
                        }`}>
                          {step.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/30">
                            الحالة الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8992AA] mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Direct Actions on this Order */}
          <div className="pt-2 flex items-center gap-2">
            <a
              href={createWhatsAppUrl(
                ORIKET_COMPANY_PHONE,
                `السلام عليكم ورحمة الله،\nأود الاستفسار ومتابعة طلبي رقم: ${order.orderNumber}\nالخدمة: ${order.serviceType}\nالمنشأة: ${order.siteName}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-3 rounded-2xl bg-[#19C7A0] hover:bg-[#16B591] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-[#19C7A0]/20 active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>متابعة الطلب عبر واتساب</span>
            </a>

            <a
              href={`tel:${ORIKET_COMPANY_PHONE}`}
              className="py-3 px-4 rounded-2xl bg-[#10172B] hover:bg-[#151F38] text-[#F5F7FF] text-xs font-medium border border-[#1E2945] transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Phone className="w-4 h-4 text-[#20A9FF]" />
              <span>اتصال</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
