import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  MessageCircle, 
  User, 
  Building2, 
  Calendar, 
  MapPin, 
  FileText,
  Radio,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ClientIncident, ContractRenewalRequest, ClientInquiry, Site } from '../../types';
import { formatDateArabic } from '../../utils/date';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface ClientRequestTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident?: ClientIncident | null;
  renewal?: ContractRenewalRequest | null;
  inquiry?: ClientInquiry | null;
  site?: Site | null;
}

export const ClientRequestTimelineModal: React.FC<ClientRequestTimelineModalProps> = ({
  isOpen,
  onClose,
  incident,
  renewal,
  inquiry,
  site,
}) => {
  if (!isOpen) return null;

  // Determine which type of request is being inspected
  const isIncident = !!incident;
  const isRenewal = !isIncident && !!renewal;
  const isInquiry = !isIncident && !isRenewal && !!inquiry;

  if (!isIncident && !isRenewal && !isInquiry) return null;

  // Incident lifecycle steps calculation
  const getIncidentSteps = (inc: ClientIncident) => {
    const isPending = inc.status === 'pending';
    const isInProgress = inc.status === 'in_progress';
    const isResolved = inc.status === 'resolved' || inc.status === 'closed';

    const steps = [
      {
        id: 1,
        title: 'تم استلام وتسجيل الطلب',
        description: 'تم توثيق البلاغ في نظام شركة أوريكيت بنجاح وإرسال التنبيه لإدارة العمليات.',
        date: formatDateArabic(inc.createdAt.split('T')[0]),
        done: true,
        current: isPending && !inc.assignedTechnician,
        icon: Clock,
      },
      {
        id: 2,
        title: 'مراجعة وتدقيق إدارة العمليات',
        description: inc.assignedTechnician || inc.adminNotes || isInProgress || isResolved
          ? 'تم الاطلاع على البلاغ من قِبل مدير النظام وجاري اتخاذ الإجراء المناسب.'
          : 'قيد المراجعة وتحديد فريق الطوارئ المناسب.',
        date: inc.updatedAt ? formatDateArabic(inc.updatedAt.split('T')[0]) : undefined,
        done: !!inc.assignedTechnician || !!inc.adminNotes || isInProgress || isResolved,
        current: isPending && (!!inc.assignedTechnician || !!inc.adminNotes),
        icon: ShieldCheck,
      },
      {
        id: 3,
        title: 'تكليف وتوجيه فني الصيانة الميداني',
        description: inc.assignedTechnician
          ? `تم تكليف الفني: (${inc.assignedTechnician}) للتوجه إلى المنشأة ومباشرة الفحص.`
          : 'سيتم تحديد وتكليف فني الطوارئ الميداني قريباً.',
        date: inc.updatedAt ? formatDateArabic(inc.updatedAt.split('T')[0]) : undefined,
        done: !!inc.assignedTechnician || isInProgress || isResolved,
        current: isInProgress && !!inc.assignedTechnician,
        icon: Wrench,
      },
      {
        id: 4,
        title: 'مباشرة العمل والفحص الميداني',
        description: isResolved
          ? 'تم فحص الموقع والأنظمة ومعالجة العطل بالكامل.'
          : isInProgress
          ? 'فني الصيانة متواجد بالموقع أو في طريقه إليكم لإجراء الاختبارات اللازمة.'
          : 'بانتظار وصول الفني للموقع.',
        done: isInProgress || isResolved,
        current: isInProgress,
        icon: Wrench,
      },
      {
        id: 5,
        title: 'اكتمال الصيانة واعتماد المعالجة',
        description: isResolved
          ? `تم إنجاز الصيانة بنجاح والتأكد من مطابقة شروط السلامة.${inc.adminNotes ? ` إفادة الإدارة: ${inc.adminNotes}` : ''}`
          : 'يتم إغلاق البلاغ بعد التأكد من سلامة وجاهزية كافة الأنظمة.',
        date: inc.resolvedAt ? formatDateArabic(inc.resolvedAt.split('T')[0]) : undefined,
        done: isResolved,
        current: isResolved,
        icon: CheckCircle2,
      },
    ];

    return steps;
  };

  // Renewal lifecycle steps
  const getRenewalSteps = (ren: ContractRenewalRequest) => {
    const isPending = ren.status === 'pending';
    const isReviewed = ren.status === 'reviewed';
    const isQuoteSent = ren.status === 'quote_sent';
    const isApproved = ren.status === 'approved' || ren.status === 'completed';

    return [
      {
        id: 1,
        title: 'تم إرسال طلب التجديد',
        description: `طلب تجديد العقد لمدة ${ren.requestedDurationYears} سنة مسجل بالنظام.`,
        date: formatDateArabic(ren.createdAt.split('T')[0]),
        done: true,
        current: isPending,
        icon: FileText,
      },
      {
        id: 2,
        title: 'مراجعة وتدقيق الإدارة الفنية',
        description: isReviewed || isQuoteSent || isApproved
          ? 'تم تدقيق بيانات المنشأة ومعدات السلامة لإعداد العرض.'
          : 'قيد مراجعة بيانات الموقع وسجل الصيانة السابق.',
        done: isReviewed || isQuoteSent || isApproved,
        current: isReviewed,
        icon: ShieldCheck,
      },
      {
        id: 3,
        title: 'تقديم عرض السعر المالي',
        description: ren.quotedPriceSAR
          ? `تم تحديد قيمة التجديد: ${ren.quotedPriceSAR.toLocaleString('ar-SA')} ريال سعودي.`
          : 'جاري احتساب التكلفة وتجهيز عرض الصيانة المعتمد.',
        done: isQuoteSent || isApproved,
        current: isQuoteSent,
        icon: Sparkles,
      },
      {
        id: 4,
        title: 'اعتماد وتجديد العقد رسمياً',
        description: isApproved
          ? 'تم اعتماد العقد وتحديث شهادة الصيانة ورخصة الدفاع المدني بنجاح.'
          : 'بانتظار الاعتماد النهائي وتوقيع العقد الجديد.',
        done: isApproved,
        current: isApproved,
        icon: CheckCircle2,
      },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/40 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-xs font-bold text-orange-400 bg-orange-950/80 border border-orange-700/60 px-2.5 py-0.5 rounded-full">
                نظام التتبع المباشر للطلبات
              </span>
              <span className="text-xs text-slate-400">· شركة أوريكيت</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {isIncident && incident?.title}
              {isRenewal && `طلب تجديد عقد صيانة (${renewal?.siteName})`}
              {isInquiry && `استفسار فني: ${inquiry?.subject}`}
            </h3>
            <p className="text-xs text-slate-300">
              متابعة حية لتفاعل مدير النظام وتكليف فنيي الصيانة خطوة بخطوة
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Status & Summary Highlight Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400">المنشأة: <strong className="text-white">{incident?.siteName || renewal?.siteName || inquiry?.siteName}</strong></span>
              
              {isIncident && (
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    incident?.status === 'resolved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : incident?.status === 'in_progress'
                      ? 'bg-blue-950 text-blue-300 border border-blue-700 animate-pulse'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {incident?.status === 'resolved' ? '✓ تم إنجاز الصيانة' : incident?.status === 'in_progress' ? '🛠️ جاري المعالجة الميدانية' : '⏳ قيد المراجعة والتكليف'}
                </span>
              )}

              {isRenewal && (
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    renewal?.status === 'approved' || renewal?.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : renewal?.status === 'quote_sent'
                      ? 'bg-orange-950 text-orange-300 border border-orange-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {renewal?.status === 'approved' || renewal?.status === 'completed'
                    ? '✓ تم اعتماد العقد'
                    : renewal?.status === 'quote_sent'
                    ? '📋 تم تقديم عرض السعر'
                    : '⏳ قيد دراسة العقد'}
                </span>
              )}
            </div>

            {/* Admin Response / Notes Callout */}
            {((isIncident && incident?.adminNotes) || (isRenewal && renewal?.adminResponse) || (isInquiry && inquiry?.answer)) && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-700/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>إفادة وتوجيهات إدارة شركة أوريكيت:</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {isIncident && incident?.adminNotes}
                  {isRenewal && renewal?.adminResponse}
                  {isInquiry && inquiry?.answer}
                </p>
                {isInquiry && inquiry?.answeredBy && (
                  <span className="text-[10px] text-slate-400 block pt-1">
                    أجاب بواسطة: {inquiry.answeredBy} • {inquiry.answeredAt ? formatDateArabic(inquiry.answeredAt.split('T')[0]) : ''}
                  </span>
                )}
              </div>
            )}

            {/* Assigned Technician Callout */}
            {isIncident && incident?.assignedTechnician && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">فني الصيانة المباشر للطلب:</span>
                    <strong className="text-blue-300 text-xs">{incident.assignedTechnician}</strong>
                  </div>
                </div>

                <a
                  href={createWhatsAppUrl(
                    ORIKET_COMPANY_PHONE,
                    `السلام عليكم بخصوص متابعة الفني (${incident.assignedTechnician}) للبلاغ "${incident.title}" في منشأة (${incident.siteName}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>تواصل مع الإدارة</span>
                </a>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              المراحل التنفيذية للطلب (التسلسل الزمني):
            </h4>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {(isIncident ? getIncidentSteps(incident!) : isRenewal ? getRenewalSteps(renewal!) : []).map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative flex items-start gap-4">
                    {/* Step Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs border transition ${
                        step.done
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                          : step.current
                          ? 'bg-orange-600 text-white border-orange-400 ring-4 ring-orange-500/20 animate-pulse'
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>

                    {/* Step Content */}
                    <div
                      className={`flex-1 p-3.5 rounded-2xl border transition ${
                        step.current
                          ? 'bg-slate-950 border-orange-500/60 shadow-lg shadow-orange-950/20'
                          : step.done
                          ? 'bg-slate-950/60 border-emerald-900/40'
                          : 'bg-slate-950/30 border-slate-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h5 className={`font-bold text-xs ${step.done || step.current ? 'text-white' : 'text-slate-400'}`}>
                          {step.title}
                        </h5>
                        {step.date && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {step.date}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Status History Logs (if available) */}
          {isIncident && incident?.statusHistory && incident.statusHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h5 className="text-xs font-bold text-slate-400">سجل التفاعلات والتحديثات الإدارية:</h5>
              <div className="space-y-2">
                {incident.statusHistory.map((hist, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-orange-400 font-bold block">
                        {hist.status === 'resolved' ? '✓ تم إنجاز الصيانة' : hist.status === 'in_progress' ? '🛠️ تم توجيه الفني وبدء المعالجة' : 'قيد المراجعة'}
                      </span>
                      {hist.technicianName && (
                        <span className="text-slate-300 text-[11px] block">الفني: {hist.technicianName}</span>
                      )}
                      {hist.notes && (
                        <span className="text-slate-400 text-[11px] block">{hist.notes}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {formatDateArabic(hist.changedAt.split('T')[0])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${ORIKET_COMPANY_PHONE}`}
              className="py-2 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold transition flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-orange-400" />
              <span>اتصال بالطوارئ</span>
            </a>

            <a
              href={createWhatsAppUrl(
                ORIKET_COMPANY_PHONE,
                `السلام عليكم ورحمة الله، أود الاستفسار عن حالة البلاغ/الطلب "${incident?.title || renewal?.siteName || inquiry?.subject}".`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب الدعم الفني</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold transition"
          >
            إغلاق المتابعة
          </button>
        </div>

      </div>
    </div>
  );
};
