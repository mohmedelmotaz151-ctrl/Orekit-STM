import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Phone, 
  Building2, 
  Copy, 
  Check, 
  Send, 
  MapPin, 
  Flame, 
  ShieldCheck, 
  ExternalLink,
  Share2,
  FileText
} from 'lucide-react';
import { Site } from '../../types';
import { 
  ORIKET_COMPANY_PHONE, 
  ORIKET_COMPANY_NAME, 
  createWhatsAppUrl, 
  generateSiteWhatsAppMessage, 
  generateCompanyReportWhatsAppMessage,
  SiteWhatsAppTemplate,
  formatSaudiWhatsAppNumber
} from '../../utils/whatsapp';

interface WhatsAppContactModalProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string;
}

export const WhatsAppContactModal: React.FC<WhatsAppContactModalProps> = ({
  site,
  isOpen,
  onClose,
  currentUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'site' | 'company'>('site');
  const [template, setTemplate] = useState<SiteWhatsAppTemplate>('general');
  const [siteCustomMessage, setSiteCustomMessage] = useState('');
  const [companyCustomMessage, setCompanyCustomMessage] = useState('');
  const [copiedSite, setCopiedSite] = useState(false);
  const [copiedCompany, setCopiedCompany] = useState(false);

  // Update messages whenever the site or template changes
  useEffect(() => {
    if (site) {
      setSiteCustomMessage(generateSiteWhatsAppMessage(site, template, currentUserName));
      setCompanyCustomMessage(generateCompanyReportWhatsAppMessage(site, currentUserName));
    }
  }, [site, template, currentUserName]);

  if (!isOpen || !site) return null;

  const siteCleanPhone = formatSaudiWhatsAppNumber(site.phone);
  const companyCleanPhone = formatSaudiWhatsAppNumber(ORIKET_COMPANY_PHONE);

  const siteWhatsAppUrl = createWhatsAppUrl(site.phone, siteCustomMessage);
  const companyWhatsAppUrl = createWhatsAppUrl(ORIKET_COMPANY_PHONE, companyCustomMessage);

  const handleCopySite = async () => {
    try {
      await navigator.clipboard.writeText(siteCustomMessage);
      setCopiedSite(true);
      setTimeout(() => setCopiedSite(false), 2000);
    } catch {}
  };

  const handleCopyCompany = async () => {
    try {
      await navigator.clipboard.writeText(companyCustomMessage);
      setCopiedCompany(true);
      setTimeout(() => setCopiedCompany(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-800/40 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50">
              <MessageCircle className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">تواصل عبر واتساب</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  محادثة جاهزة فورية
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تواصل مباشر مع <span className="text-emerald-400 font-bold">رقم الموقع</span> أو مشاركة التقرير مع <span className="text-amber-400 font-bold">رقم إدارة أوريكيت</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Site Summary Strip */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="font-bold text-white line-clamp-1">{site.name}</span>
            <span className="text-[11px] text-slate-400">({site.city} - {site.district})</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">
              المسؤول: <span className="text-slate-200 font-medium">{site.managerName}</span>
            </span>
            <span className="text-slate-400 font-mono" dir="ltr">
              📞 {site.phone}
            </span>
          </div>
        </div>

        {/* Destination Tabs: Site vs Company */}
        <div className="px-4 pt-3 bg-slate-900 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('site')}
            className={`flex-1 py-3 px-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-t-2 border-x-2 transition ${
              activeTab === 'site'
                ? 'bg-slate-850 text-emerald-400 border-emerald-500 shadow-md'
                : 'bg-slate-950/50 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>1. واتساب مسؤول الموقع</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hidden sm:inline" dir="ltr">
              {site.phone}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-3 px-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-t-2 border-x-2 transition ${
              activeTab === 'company'
                ? 'bg-slate-850 text-amber-400 border-amber-500 shadow-md'
                : 'bg-slate-950/50 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. واتساب إدارة أوريكيت</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/40 hidden sm:inline" dir="ltr">
              {ORIKET_COMPANY_PHONE}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-850/60">

          {/* TAB 1: SITE MANAGER WHATSAPP */}
          {activeTab === 'site' && (
            <div className="space-y-4">
              
              {/* Site Phone Details Card */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400">وجهة المحادثة:</span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{site.managerName}</span>
                    <span className="text-xs text-slate-400 font-normal">({site.name})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${site.phone}`}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition"
                    title="اتصال هاتفي سريع"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{site.phone}</span>
                  </a>

                  {site.altPhone && (
                    <span className="text-xs text-slate-400 font-mono" dir="ltr">
                      بديل: {site.altPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>📑 اختر نموذج الرسالة المناسب:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'general', label: '🛡️ تعريف وعرض أسعار' },
                    { id: 'extinguishers', label: '🧯 صيانة الطفايات والتعبئة' },
                    { id: 'contract', label: '📜 تجديد عقد الصيانة' },
                    { id: 'civil_defense', label: '🚨 اشتراطات الدفاع المدني' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplate(tpl.id as SiteWhatsAppTemplate)}
                      className={`p-2 rounded-xl text-xs font-bold text-center border transition ${
                        template === tpl.id
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>نص الرسالة الجاهزة (يمكنك التعديل عليها):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySite}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                  >
                    {copiedSite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">تم نسخ النص!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ النص</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={siteCustomMessage}
                  onChange={(e) => setSiteCustomMessage(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  dir="rtl"
                />
              </div>

              {/* Big Action Button for Site Manager */}
              <a
                href={siteWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/60 border border-emerald-400/30 transition transform active:scale-99"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>فتح محادثة واتساب مع مسؤول الموقع الآن</span>
                <span className="text-xs font-mono opacity-90" dir="ltr">({siteCleanPhone})</span>
              </a>

            </div>
          )}

          {/* TAB 2: ORIKET COMPANY MANAGEMENT WHATSAPP (0555334577) */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              
              {/* Company Contact Card */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-amber-800/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-400">{ORIKET_COMPANY_NAME}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      الإدارة المركزية
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    مشاركة بيانات الموقع الكاملة مع الإدارة لجدولة الزيارات الفنية أو المتابعة
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${ORIKET_COMPANY_PHONE}`}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700 transition"
                    title="اتصال بهاتف الإدارة"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{ORIKET_COMPANY_PHONE}</span>
                  </a>
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>تقرير الموقع المرسل للإدارة (جاهز ويتضمن الإحداثيات):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCompany}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                  >
                    {copiedCompany ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400 font-bold">تم نسخ التقرير!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ التقرير</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={companyCustomMessage}
                  onChange={(e) => setCompanyCustomMessage(e.target.value)}
                  rows={9}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                  dir="rtl"
                />
              </div>

              {/* Big Action Button for Company Management */}
              <a
                href={companyWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-orange-950/60 border border-amber-400/30 transition transform active:scale-99"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>إرسال تقرير الموقع لواتساب إدارة الشركة ({ORIKET_COMPANY_PHONE})</span>
              </a>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>الرابط يفتح تطبيق WhatsApp مباشرة أو WhatsApp Web</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition font-medium"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
