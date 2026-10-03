import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Building2, 
  Shield, 
  Flame, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User as UserIcon, 
  Plus, 
  FileText, 
  Camera, 
  Send,
  Calendar,
  ExternalLink,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { Site, Visit, FollowUpLog, User, SiteStatus, SiteApprovalStatus, ExtinguisherMaintenanceInfo } from '../../types';
import { LeafletMap } from '../Common/LeafletMap';
import { SITE_STATUS_MAP, getContractExpiryBadge, getExtinguisherExpiryBadge, formatDateArabic } from '../../utils/date';
import { ExtinguisherMaintenanceTab } from './ExtinguisherMaintenanceTab';
import { WhatsAppContactModal } from '../Common/WhatsAppContactModal';
import { ORIKET_COMPANY_PHONE } from '../../utils/whatsapp';

interface SiteDetailModalProps {
  site: Site | null;
  currentUser: User;
  onClose: () => void;
  onUpdateStatus: (siteId: string, newStatus: SiteStatus) => void;
  onApproveSite: (siteId: string, approved: boolean, reason?: string) => void;
  onAddFollowUp: (siteId: string, note: string, action: 'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note') => void;
  onOpenNewVisitForSite: (site: Site) => void;
  onUpdateMaintenance?: (siteId: string, maintenance: ExtinguisherMaintenanceInfo) => void;
  followups: FollowUpLog[];
  visits: Visit[];
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  site,
  currentUser,
  onClose,
  onUpdateStatus,
  onApproveSite,
  onAddFollowUp,
  onOpenNewVisitForSite,
  onUpdateMaintenance,
  followups,
  visits,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'extinguishers_maintenance' | 'equipment' | 'contract' | 'visits' | 'followup'>(
    site?.approvalStatus === 'approved' ? 'extinguishers_maintenance' : 'profile'
  );
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAction, setNewNoteAction] = useState<'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note'>('call');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!site) return null;

  // Security check: Sites added by agents can only be viewed by the agent who added them or by system admins
  if (currentUser.role === 'agent') {
    const isMine = site.createdByAgentId === currentUser.id ||
      (site.createdByAgentName && currentUser.name && site.createdByAgentName.trim() === currentUser.name.trim());
    if (!isMine) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">غير مصرح بعرض هذا الموقع</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              مواقع المناديب مخصصة وتظهر فقط للمندوب الذي قام بإضافتها أو لمدراء النظام.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      );
    }
  }

  const siteFollowups = followups.filter((f) => f.siteId === site.id);
  const siteVisits = visits.filter((v) => v.siteId === site.id);
  const statusInfo = SITE_STATUS_MAP[site.status] || SITE_STATUS_MAP.new_opportunity;
  const expiryBadge = site.contract?.endDate ? getContractExpiryBadge(site.contract.endDate) : null;
  const extExpiryBadge = site.extinguisherMaintenance?.expiryDate ? getExtinguisherExpiryBadge(site.extinguisherMaintenance.expiryDate) : null;

  const canApprove = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddFollowUp(site.id, newNoteText.trim(), newNoteAction);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#070B1C]/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0B1224] border border-[#1E2945] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92dvh] animate-slideUp">
        
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-[#10172B] via-[#0D1C3D] to-[#070B1C] border-b border-[#1E2945] space-y-3 relative">
          
          {/* Top Row: Photo, Name, Badges & Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#070B1C] border-2 border-[#1E2945] shrink-0 shadow-lg">
                <img
                  src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                  alt={site.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-base sm:text-xl font-black text-[#F5F7FF] leading-snug">{site.name}</h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusInfo.bgClass}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    site.approvalStatus === 'approved'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : site.approvalStatus === 'pending'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700'
                  }`}>
                    {site.approvalStatus === 'approved' ? '✓ معتمد (+1.50 ر.س)' : site.approvalStatus === 'pending' ? '⏳ قيد المراجعة الإدارية' : 'مرفوض'}
                  </span>
                  {site.extinguisherMaintenance?.expiryDate && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${extExpiryBadge?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
                      🧯 طفايات: {site.extinguisherMaintenance.expiryDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pinned Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center transition active:scale-95 shrink-0"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle / Metadata */}
          <div className="text-xs text-[#8992AA] flex items-center gap-2 flex-wrap pt-0.5">
            <span className="flex items-center gap-1 text-[#F5F7FF] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#20A9FF]" />
              {site.city} - {site.district}
            </span>
            <span>•</span>
            <span>النشاط: <strong className="text-slate-200">{site.type}</strong></span>
            <span>•</span>
            <span>المندوب: <strong className="text-[#20A9FF]">{site.createdByAgentName}</strong></span>
          </div>

          {/* Two prominent action buttons: WhatsApp & Google Maps */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="w-full bg-[#19C7A0] hover:bg-[#16B591] text-[#070B1C] font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#19C7A0]/20 transition active:scale-[0.98] min-h-[42px]"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>تواصل عبر واتساب</span>
            </button>

            {site.latitude && site.longitude ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#10172B] hover:bg-[#151F38] text-[#20A9FF] font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-[#1E2945] hover:border-[#20A9FF]/50 shadow-md transition active:scale-[0.98] min-h-[42px]"
              >
                <MapPin className="w-4 h-4 text-[#20A9FF] shrink-0" />
                <span>خرائط جوجل</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : (
              <div className="w-full bg-[#10172B] text-slate-500 py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 border border-[#1E2945]">
                <span>الموقع غير محدد</span>
              </div>
            )}
          </div>

        </div>

        {/* Tab Navigation (Pill buttons that never collapse) */}
        <div className="px-3 py-2.5 bg-[#070B1C] border-b border-[#1E2945] flex items-center gap-2 text-xs overflow-x-auto no-scrollbar shrink-0 select-none">
          {[
            { id: 'profile', label: 'ملف المنشأة والمسؤول', icon: '👤' },
            { 
              id: 'extinguishers_maintenance', 
              label: site.approvalStatus === 'approved' 
                ? 'صيانة الطفايات وتاريخ الانتهاء' 
                : 'صيانة الطفايات',
              icon: '🧯',
              isSpecial: true,
            },
            { id: 'equipment', label: 'حصر أجهزة السلامة', icon: '🛡️' },
            { id: 'contract', label: 'العقد والتراخيص', icon: '📄' },
            { id: 'visits', label: `سجل الزيارات (${siteVisits.length})`, icon: '📍' },
            { id: 'followup', label: `سجل المتابعات CRM (${siteFollowups.length})`, icon: '💬' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 text-xs active:scale-95 ${
                activeTab === t.id
                  ? 'bg-[#20A9FF] text-[#070B1C] shadow-md shadow-[#20A9FF]/20 font-black'
                  : 'bg-[#10172B] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945]'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB: FIRE EXTINGUISHERS MAINTENANCE & EXPIRY */}
          {activeTab === 'extinguishers_maintenance' && (
            <ExtinguisherMaintenanceTab
              site={site}
              currentUser={currentUser}
              onUpdateMaintenance={(newMaint) => {
                if (onUpdateMaintenance) {
                  onUpdateMaintenance(site.id, newMaint);
                }
              }}
              onOpenNewVisit={onOpenNewVisitForSite}
            />
          )}
          
          {/* TAB 1: PROFILE & CONTACT */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Section 1: Quick Contacts & Manager */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FF] px-1">
                  <span className="text-[#20A9FF]">👤</span>
                  <span>مسؤول المنشأة وبيانات الاتصال</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-1">
                    <span className="text-[11px] text-[#8992AA] font-bold block">اسم المسؤول</span>
                    <div className="text-sm sm:text-base font-black text-[#F5F7FF] flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#FFB020] shrink-0" />
                      <span className="truncate">{site.managerName || 'غير مسجل'}</span>
                    </div>
                  </div>

                  <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-1">
                    <span className="text-[11px] text-[#8992AA] font-bold block">رقم هاتف التواصل</span>
                    <div className="flex items-center justify-between">
                      <a
                        href={`tel:${site.phone}`}
                        className="text-sm sm:text-base font-black text-[#19C7A0] flex items-center gap-2 hover:underline font-mono"
                        dir="ltr"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{site.phone}</span>
                      </a>
                      <a
                        href={`tel:${site.phone}`}
                        className="p-1.5 rounded-lg bg-[#19C7A0]/15 text-[#19C7A0] hover:bg-[#19C7A0] hover:text-[#070B1C] transition text-[11px] font-bold"
                        title="اتصال هاتفي"
                      >
                        اتصال
                      </a>
                    </div>
                  </div>

                  <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-1">
                    <span className="text-[11px] text-[#8992AA] font-bold block">رقم إضافي / بديل</span>
                    <div className="text-sm font-medium text-slate-300 font-mono pt-0.5" dir="ltr">
                      {site.altPhone || 'لا يوجد رقم بديل'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Ready WhatsApp Contact Action Row */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-[#10172B] to-[#10172B] rounded-2xl border border-emerald-700/60 shadow-md space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#19C7A0]/20 text-[#19C7A0] flex items-center justify-center border border-[#19C7A0]/30 shrink-0">
                      <MessageCircle className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">تواصل فوري عبر WhatsApp</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        محادثة جاهزة مع <span className="text-emerald-400 font-bold font-mono" dir="ltr">{site.phone}</span> أو إرسال تقرير المعاينة لإدارة أوريكيت
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWhatsAppOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#19C7A0] hover:bg-[#16B591] text-[#070B1C] font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#19C7A0]/20 transition active:scale-95 shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>مراسلة واتساب</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Address & GPS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FF] px-1">
                  <span className="text-[#20A9FF]">📍</span>
                  <span>العنوان والموقع الجغرافي</span>
                </div>

                <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] space-y-3">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="font-bold text-slate-200">
                      {site.address || `${site.city} - ${site.district}`}
                    </span>
                    {site.latitude && site.longitude && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]" dir="ltr">{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح في الخرائط</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Interactive Map */}
                  <LeafletMap
                    center={[site.latitude, site.longitude]}
                    zoom={16}
                    pickedLocation={{ lat: site.latitude, lon: site.longitude }}
                    highlightProximityRadius={{ lat: site.latitude, lon: site.longitude, meters: 50 }}
                    className="w-full h-52 rounded-xl border border-[#1E2945] mt-1"
                  />
                </div>
              </div>

              {/* Section 4: Status Update Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FF] px-1">
                  <span className="text-[#20A9FF]">🏷️</span>
                  <span>تصنيف وحالة العميل في المنظومة (CRM)</span>
                </div>

                <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="block text-xs font-bold text-white mb-0.5">تحديث تصنيف العميل الحالي:</span>
                    <p className="text-[11px] text-[#8992AA]">يساعد التحديث الفوري على توجيه مسؤولي المبيعات والزيارات</p>
                  </div>
                  <select
                    value={site.status}
                    onChange={(e) => onUpdateStatus(site.id, e.target.value as SiteStatus)}
                    className="bg-[#070B1C] border border-[#1E2945] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#20A9FF] font-bold"
                  >
                    <option value="new_opportunity">🟢 فرصة جديدة</option>
                    <option value="needs_followup">🟡 يحتاج متابعة</option>
                    <option value="competitor_contract">🔵 لديه عقد مع شركة أخرى</option>
                    <option value="expiring_soon">🟠 العقد قريب الانتهاء</option>
                    <option value="urgent_maintenance">🔴 يحتاج صيانة عاجلة</option>
                    <option value="no_opportunity">⚫ لا توجد فرصة حاليًا</option>
                  </select>
                </div>
              </div>

              {/* Section 5: Notes */}
              {site.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FF] px-1">
                    <span className="text-[#20A9FF]">📝</span>
                    <span>ملاحظات وتفاصيل المنشأة</span>
                  </div>
                  <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] text-xs text-slate-300 leading-relaxed">
                    {site.notes}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SAFETY EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              
              {/* 1. Extinguishers */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2945] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-sm text-white">طفايات الحريق اليدوية</h4>
                  </div>
                  <span className="text-base font-black text-[#FFB020] font-mono">
                    {site.equipment?.extinguishers?.totalCount || 0} طفاية
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2">
                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                    <span className="text-[#8992AA] block text-[11px] mb-0.5">الأنواع المتوفرة:</span>
                    <strong className="text-white text-xs">
                      {site.equipment?.extinguishers?.types?.length
                        ? site.equipment.extinguishers.types.map((t) => (t === 'powder' ? 'بودرة جافة' : t === 'co2' ? 'CO2' : t === 'foam' ? 'رغوة' : 'مائية/رطبة')).join('، ')
                        : 'غير محدد'}
                    </strong>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-1">
                    {site.equipment?.extinguishers?.needsMaintenance && (
                      <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                        ⚠️ بحاجة صيانة وتعبئة
                      </span>
                    )}
                    {site.equipment?.extinguishers?.needsReplacement && (
                      <span className="bg-red-950/80 text-red-300 border border-red-800 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                        🔴 بحاجة استبدال تالف
                      </span>
                    )}
                    {site.equipment?.extinguishers?.needsNewInstall && (
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                        🟢 فرصة تركيب جديد
                      </span>
                    )}
                  </div>

                  {site.equipment?.extinguishers?.notes && (
                    <p className="text-[11px] text-slate-400 pt-1 bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                      ملاحظة: {site.equipment.extinguishers.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Alarm System */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2945] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm text-white">نظام الإنذار المبكر</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    site.equipment?.alarmSystem?.exists && site.equipment?.alarmSystem?.working
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : site.equipment?.alarmSystem?.exists
                      ? 'bg-red-950/80 text-red-300 border-red-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {site.equipment?.alarmSystem?.exists
                      ? site.equipment?.alarmSystem?.working ? '✓ يعمل بسلاسة' : '⚠️ معطل بحاجة إصلاح'
                      : 'غير متوفر (فرصة توريد)'}
                  </span>
                </div>

                {site.equipment?.alarmSystem?.exists && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                      <span className="text-[10px] text-slate-400 block mb-0.5">نوع اللوحة</span>
                      <strong className="text-white text-xs">{site.equipment.alarmSystem.panelType || 'معنون Addressable'}</strong>
                    </div>
                    <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                      <span className="text-[10px] text-slate-400 block mb-0.5">عدد الكواشف</span>
                      <strong className="text-amber-400 text-sm font-mono">{site.equipment.alarmSystem.detectorCount || 0}</strong>
                    </div>
                    <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                      <span className="text-[10px] text-slate-400 block mb-0.5">كواسر الإنذار</span>
                      <strong className="text-amber-400 text-sm font-mono">{site.equipment.alarmSystem.callPointCount || 0}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Water & Special Systems */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-[#1E2945] pb-2.5">
                  <Shield className="w-5 h-5 text-sky-400" />
                  <h4 className="font-bold text-sm text-white">الرشاشات والمضخات والأنظمة الخاصة</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                    <span className="text-[11px] text-[#8992AA] block">شبكة الرشاشات (Sprinklers):</span>
                    <strong className="text-white block">
                      {site.equipment?.waterAndPumps?.sprinklersExist
                        ? `متوفرة (${site.equipment.waterAndPumps.sprinklersCount || 0} رأس رشاش)`
                        : 'غير متوفرة'}
                    </strong>
                  </div>

                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                    <span className="text-[11px] text-[#8992AA] block">محطة مضخات الحريق:</span>
                    <strong className="text-white block">
                      {site.equipment?.waterAndPumps?.pumpsExist
                        ? site.equipment.waterAndPumps.pumpsType || 'متوفرة'
                        : 'لا توجد مضخات'}
                    </strong>
                  </div>

                  <div className="sm:col-span-2 bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                    <span className="text-[11px] text-[#8992AA] block">أنظمة الإخماد الخاصة (كيتشن هود / FM200):</span>
                    <strong className="text-amber-300 block">
                      {site.equipment?.waterAndPumps?.specialSuppressionSystem || 'لا يوجد'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CONTRACT & LICENSES */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              
              {/* Contract Status Card */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2945] pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-400" />
                    <h4 className="font-bold text-sm text-white">عقد الصيانة السنوي</h4>
                  </div>
                  {expiryBadge && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${expiryBadge.badgeClass}`}>
                      {expiryBadge.text}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                    <span className="text-[#8992AA] block text-[11px]">هل يوجد عقد صيانة حالي؟</span>
                    <strong className="text-white block mt-0.5">
                      {site.contract?.hasContract === 'yes' ? 'نعم مرتبط بعقد' : site.contract?.hasContract === 'no' ? 'لا يوجد عقد حالي' : 'غير معروف'}
                    </strong>
                  </div>

                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                    <span className="text-[#8992AA] block text-[11px]">اسم شركة الصيانة:</span>
                    <strong className="text-amber-300 block mt-0.5">{site.contract?.companyName || 'لا يوجد'}</strong>
                  </div>

                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                    <span className="text-[#8992AA] block text-[11px]">تاريخ بداية العقد:</span>
                    <strong className="text-white font-mono block mt-0.5">{site.contract?.startDate || 'غير مسجل'}</strong>
                  </div>

                  <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                    <span className="text-[#8992AA] block text-[11px]">تاريخ انتهاء العقد:</span>
                    <strong className="text-rose-400 font-bold font-mono block mt-0.5">{site.contract?.endDate || 'غير مسجل'}</strong>
                  </div>

                  {site.contract?.annualValue && (
                    <div className="sm:col-span-2 bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                      <span className="text-[#8992AA] block text-[11px]">قيمة العقد التقريبية:</span>
                      <strong className="text-emerald-400 font-bold font-mono block mt-0.5">{site.contract.annualValue} ر.س / سنوياً</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Civil Defense Inspection */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] space-y-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#1E2945] pb-2 font-bold text-white">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>سجل الدفاع المدني ومنصة سلامة</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">آخر زيارة: {site.civilDefense?.lastVisitDate || 'غير مسجلة'}</div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">الزيارة القادمة: <strong className="text-amber-400">{site.civilDefense?.nextVisitDate || 'غير محددة'}</strong></div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">رقم المحضر: {site.civilDefense?.reportNumber || 'لا يوجد'}</div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">المفتش: {site.civilDefense?.inspectorName || 'غير مسجل'}</div>
                </div>
                {site.civilDefense?.notes && (
                  <div className="p-2.5 rounded-xl bg-[#070B1C] border border-[#1E2945] text-amber-200 mt-2">
                    توصيات الدفاع المدني: {site.civilDefense.notes}
                  </div>
                )}
              </div>

              {/* Licenses */}
              <div className="bg-[#10172B] p-4 rounded-2xl border border-[#1E2945] space-y-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#1E2945] pb-2 font-bold text-white">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>بيانات التراخيص الحكومية</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">حالة الترخيص: <strong className="text-[#19C7A0]">{site.license?.hasLicense === 'yes' ? 'مرخص سارٍ' : 'غير مرخص'}</strong></div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">نوع الترخيص: {site.license?.licenseType || 'غير محدد'}</div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">رقم الترخيص: {site.license?.licenseNumber || 'غير محدد'}</div>
                  <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">تاريخ الانتهاء: <strong className="text-amber-300 font-mono">{site.license?.expiryDate || 'غير محدد'}</strong></div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: VISITS HISTORY */}
          {activeTab === 'visits' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">سجل الزيارات الميدانية الموثقة</h4>
                <button
                  onClick={() => onOpenNewVisitForSite(site)}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل زيارة جديدة</span>
                </button>
              </div>

              {siteVisits.length === 0 ? (
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  لا توجد زيارات سابقة مسجلة لهذا الموقع
                </div>
              ) : (
                siteVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">المندوب: {visit.agentName}</span>
                        <span className="text-[10px] text-slate-400">({visit.deviceModel})</span>
                      </div>
                      <span className="font-mono text-slate-400">
                        {visit.visitDate} • {visit.startTime} - {visit.endTime} ({visit.durationMinutes} دقيقة)
                      </span>
                    </div>

                    <p className="text-slate-300">{visit.notes}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>إحداثيات البداية: {visit.startLatitude}, {visit.startLongitude}</span>
                      <span className="text-emerald-400 font-bold">✓ زيارة موثقة GPS</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: CRM FOLLOW-UP TIMELINE */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              
              {/* Add Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-white">إضافة اتصال / متابعة جديدة</h4>
                <div className="flex gap-2">
                  <select
                    value={newNoteAction}
                    onChange={(e) => setNewNoteAction(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="call">📞 مكالمة هاتفية</option>
                    <option value="quotation_sent">📑 إرسال عرض سعر</option>
                    <option value="visit">📍 زيارة ميدانية</option>
                    <option value="contract_signed">🎉 توقيع عقد صيانة</option>
                    <option value="note">📝 ملاحظة عامة</option>
                  </select>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="اكتب نتيجة الاتصال أو المتابعة..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>حفظ</span>
                  </button>
                </div>
              </form>

              {/* Follow-up Log Items */}
              <div className="space-y-2">
                {siteFollowups.length === 0 ? (
                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                    لا توجد متابعات مسجلة بعد لهذا الموقع
                  </div>
                ) : (
                  siteFollowups.map((fol) => (
                    <div
                      key={fol.id}
                      className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <div className="p-2 rounded-lg bg-slate-900 text-amber-400 shrink-0">
                        {fol.action === 'call' ? '📞' : fol.action === 'quotation_sent' ? '📑' : fol.action === 'contract_signed' ? '🎉' : '📝'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-white">{fol.agentName}</span>
                          <span className="text-[10px] text-slate-500">{fol.date}</span>
                        </div>
                        <p className="text-slate-300">{fol.summary}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Bar: Clear Actions & Approval */}
        <div className="p-3.5 sm:p-4 bg-[#070B1C] border-t border-[#1E2945] flex flex-col gap-2 shrink-0">
          
          {/* Approval Controls for Admin/Supervisor */}
          {canApprove && site.approvalStatus === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => onApproveSite(site.id, true)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-[0.98] min-h-[46px]"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>اعتماد الموقع وإضافة {site.incentiveAmount || 1.50} ر.س للحافز</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectBox(!showRejectBox)}
                className="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] min-h-[46px]"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>رفض / طلب تعديل البيانات</span>
              </button>
            </div>
          )}

          {canApprove && showRejectBox && (
            <div className="w-full flex gap-2 pt-1 animate-fadeIn">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب الرفض هنا (مثلاً: موقع مكرر، صور غير واضحة، أرقام خاطئة...)"
                className="flex-1 bg-[#10172B] border border-rose-600/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={() => {
                  onApproveSite(site.id, false, rejectionReason || 'موقع مكرر أو بيانات غير مكتملة');
                  setShowRejectBox(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shrink-0 transition"
              >
                تأكيد الرفض
              </button>
            </div>
          )}

          {/* Quick Action for Field Visit */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewVisitForSite(site);
              }}
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition active:scale-[0.98] min-h-[46px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>زيارة الموقع الآن (+ توثيق الزيارة الميدانية)</span>
            </button>
          </div>

        </div>

      </div>

      {/* WHATSAPP CONTACT MODAL */}
      <WhatsAppContactModal
        site={site}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        currentUserName={currentUser.name}
      />
    </div>
  );
};
