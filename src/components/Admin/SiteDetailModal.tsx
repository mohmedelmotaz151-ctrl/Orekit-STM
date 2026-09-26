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
  ChevronRight
} from 'lucide-react';
import { Site, Visit, FollowUpLog, User, SiteStatus, SiteApprovalStatus } from '../../types';
import { LeafletMap } from '../Common/LeafletMap';
import { SITE_STATUS_MAP, getContractExpiryBadge, formatDateArabic } from '../../utils/date';

interface SiteDetailModalProps {
  site: Site | null;
  currentUser: User;
  onClose: () => void;
  onUpdateStatus: (siteId: string, newStatus: SiteStatus) => void;
  onApproveSite: (siteId: string, approved: boolean, reason?: string) => void;
  onAddFollowUp: (siteId: string, note: string, action: 'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note') => void;
  onOpenNewVisitForSite: (site: Site) => void;
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
  followups,
  visits,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'equipment' | 'contract' | 'visits' | 'followup'>('profile');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAction, setNewNoteAction] = useState<'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note'>('call');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  if (!site) return null;

  const siteFollowups = followups.filter((f) => f.siteId === site.id);
  const siteVisits = visits.filter((v) => v.siteId === site.id);
  const statusInfo = SITE_STATUS_MAP[site.status] || SITE_STATUS_MAP.new_opportunity;
  const expiryBadge = site.contract.endDate ? getContractExpiryBadge(site.contract.endDate) : null;

  const canApprove = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddFollowUp(site.id, newNoteText.trim(), newNoteAction);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <img
                src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                alt={site.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white">{site.name}</h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusInfo.bgClass}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  site.approvalStatus === 'approved'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                    : site.approvalStatus === 'pending'
                    ? 'bg-amber-950/70 text-amber-300 border-amber-700'
                    : 'bg-rose-950/70 text-rose-300 border-rose-700'
                }`}>
                  {site.approvalStatus === 'approved' ? '✓ معتمد بالحافز (+1.50 ر.س)' : site.approvalStatus === 'pending' ? '⏳ قيد المراجعة الإدارية' : 'مرفوض'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>📍 {site.city} - {site.district}</span>
                <span>•</span>
                <span>النشاط: {site.type}</span>
                <span>•</span>
                <span>المندوب المسؤول: {site.createdByAgentName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {site.latitude && site.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                title="فتح في خرائط جوجل"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>فتح في خرائط جوجل</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 bg-slate-950/70 border-b border-slate-800 flex gap-2 text-xs overflow-x-auto">
          {[
            { id: 'profile', label: 'ملف المنشأة والمسؤول' },
            { id: 'equipment', label: 'حصر أجهزة السلامة' },
            { id: 'contract', label: 'العقد والتراخيص' },
            { id: 'visits', label: `سجل الزيارات (${siteVisits.length})` },
            { id: 'followup', label: `سجل المتابعات CRM (${siteFollowups.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3 border-b-2 font-bold whitespace-nowrap transition ${
                activeTab === t.id
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: PROFILE & CONTACT */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Quick Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">اسم المسؤول</span>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-orange-400" />
                    <span>{site.managerName}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">رقم هاتف التواصل</span>
                  <a
                    href={`tel:${site.phone}`}
                    className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 hover:underline font-mono"
                    dir="ltr"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{site.phone}</span>
                  </a>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">رقم إضافي / بديل</span>
                  <span className="text-sm text-slate-200 font-mono" dir="ltr">
                    {site.altPhone || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Address & GPS */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    العنوان والموقع الجغرافي:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 dir-ltr">{site.latitude}, {site.longitude}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600/90 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>فتح في خرائط جوجل</span>
                    </a>
                  </div>
                </div>
                <p className="text-xs text-slate-300">{site.address}</p>

                {/* Map */}
                <LeafletMap
                  center={[site.latitude, site.longitude]}
                  zoom={16}
                  pickedLocation={{ lat: site.latitude, lon: site.longitude }}
                  highlightProximityRadius={{ lat: site.latitude, lon: site.longitude, meters: 50 }}
                  className="w-full h-52 rounded-xl border border-slate-800 mt-2"
                />
              </div>

              {/* Status Update Dropdown */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تحديث تصنيف العميل:</label>
                  <p className="text-[11px] text-slate-400">تغيير الحالة يساعد الإدارة على توجيه المتابعة</p>
                </div>
                <select
                  value={site.status}
                  onChange={(e) => onUpdateStatus(site.id, e.target.value as SiteStatus)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="new_opportunity">🟢 فرصة جديدة</option>
                  <option value="needs_followup">🟡 يحتاج متابعة</option>
                  <option value="competitor_contract">🔵 لديه عقد مع شركة أخرى</option>
                  <option value="expiring_soon">🟠 العقد قريب الانتهاء</option>
                  <option value="urgent_maintenance">🔴 يحتاج صيانة عاجلة</option>
                  <option value="no_opportunity">⚫ لا توجد فرصة حاليًا</option>
                </select>
              </div>

              {/* Notes */}
              {site.notes && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-amber-400">ملاحظات وتوصيات المندوب:</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{site.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAFETY EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              
              {/* 1. Extinguishers */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-sm text-white">طفايات الحريق اليدوية</h4>
                  </div>
                  <span className="text-base font-black text-amber-400">
                    {site.equipment.extinguishers.totalCount} طفاية
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5">
                  <div>
                    <strong>الأنواع المتوفرة:</strong>{' '}
                    {site.equipment.extinguishers.types.length
                      ? site.equipment.extinguishers.types.map((t) => (t === 'powder' ? 'بودرة جافة' : t === 'co2' ? 'CO2' : t === 'foam' ? 'رغوة' : 'مائية/رطبة')).join('، ')
                      : 'غير محدد'}
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {site.equipment.extinguishers.needsMaintenance && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
                        ⚠️ بحاجة صيانة وتعبئة
                      </span>
                    )}
                    {site.equipment.extinguishers.needsReplacement && (
                      <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[11px]">
                        🔴 بحاجة استبدال تالف
                      </span>
                    )}
                    {site.equipment.extinguishers.needsNewInstall && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                        🟢 فرصة تركيب جديد
                      </span>
                    )}
                  </div>
                  {site.equipment.extinguishers.notes && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      ملاحظة: {site.equipment.extinguishers.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Alarm System */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm text-white">نظام الإنذار المبكر</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    site.equipment.alarmSystem.exists && site.equipment.alarmSystem.working
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : site.equipment.alarmSystem.exists
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {site.equipment.alarmSystem.exists
                      ? site.equipment.alarmSystem.working ? 'يعمل بسلاسة' : '⚠️ معطل بحاجة إصلاح'
                      : 'غير متوفر (فرصة توريد)'}
                  </span>
                </div>

                {site.equipment.alarmSystem.exists && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">نوع اللوحة</span>
                      <strong className="text-white text-xs">{site.equipment.alarmSystem.panelType}</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">عدد الكواشف</span>
                      <strong className="text-amber-400 text-sm">{site.equipment.alarmSystem.detectorCount}</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">كواسر الإنذار</span>
                      <strong className="text-amber-400 text-sm">{site.equipment.alarmSystem.callPointCount}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Water & Special Systems */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-5 h-5 text-sky-400" />
                  <h4 className="font-bold text-sm text-white">الرشاشات والمضخات والأنظمة الخاصة</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="bg-slate-900 p-3 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 block">شبكة الرشاشات (Sprinklers):</span>
                    <strong className="text-white block">
                      {site.equipment.waterAndPumps.sprinklersExist
                        ? `متوفرة (${site.equipment.waterAndPumps.sprinklersCount} رأس رشاش)`
                        : 'غير متوفرة'}
                    </strong>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 block">محطة مضخات الحريق:</span>
                    <strong className="text-white block">
                      {site.equipment.waterAndPumps.pumpsExist
                        ? site.equipment.waterAndPumps.pumpsType
                        : 'لا توجد مضخات'}
                    </strong>
                  </div>

                  <div className="sm:col-span-2 bg-slate-900 p-3 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 block">أنظمة الإخماد الخاصة (كيتشن هود / FM200):</span>
                    <strong className="text-amber-300 block">
                      {site.equipment.waterAndPumps.specialSuppressionSystem || 'لا يوجد'}
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
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block">هل يوجد عقد صيانة حالي؟</span>
                    <strong className="text-white">
                      {site.contract.hasContract === 'yes' ? 'نعم مرتبط بعقد' : site.contract.hasContract === 'no' ? 'لا يوجد عقد حالي' : 'غير معروف'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block">اسم شركة الصيانة:</span>
                    <strong className="text-amber-300">{site.contract.companyName || 'لا يوجد'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block">تاريخ بداية العقد:</span>
                    <strong className="text-white">{site.contract.startDate || 'غير مسجل'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block">تاريخ انتهاء العقد:</span>
                    <strong className="text-rose-400 font-bold">{site.contract.endDate || 'غير مسجل'}</strong>
                  </div>

                  {site.contract.annualValue && (
                    <div>
                      <span className="text-slate-400 block">قيمة العقد التقريبية:</span>
                      <strong className="text-emerald-400 font-bold">{site.contract.annualValue} ر.س / سنوياً</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Civil Defense Inspection */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-bold text-white">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>سجل الدفاع المدني ومنصة سلامة</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>آخر زيارة: {site.civilDefense.lastVisitDate || 'غير مسجلة'}</div>
                  <div>الزيارة القادمة: <strong className="text-amber-400">{site.civilDefense.nextVisitDate || 'غير محددة'}</strong></div>
                  <div>رقم المحضر: {site.civilDefense.reportNumber || 'لا يوجد'}</div>
                  <div>المفتش: {site.civilDefense.inspectorName || 'غير مسجل'}</div>
                </div>
                {site.civilDefense.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-900 text-amber-200 mt-2">
                    توصيات الدفاع المدني: {site.civilDefense.notes}
                  </div>
                )}
              </div>

              {/* Licenses */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-bold text-white">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>بيانات التراخيص الحكومية</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>حالة الترخيص: {site.license.hasLicense === 'yes' ? 'مرخص سارٍ' : 'غير مرخص'}</div>
                  <div>نوع الترخيص: {site.license.licenseType}</div>
                  <div>رقم الترخيص: {site.license.licenseNumber}</div>
                  <div>تاريخ الانتهاء: {site.license.expiryDate || 'غير محدد'}</div>
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

        {/* Modal Bottom Bar: Approval Workflow & Quick Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          
          {/* Approval Controls for Admin/Supervisor */}
          {canApprove && site.approvalStatus === 'pending' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onApproveSite(site.id, true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد الموقع وإضافة {site.incentiveAmount || 1.50} ر.س للحافز</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectBox(!showRejectBox)}
                className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 text-xs font-bold transition"
              >
                رفض / طلب تعديل
              </button>
            </div>
          )}

          {canApprove && showRejectBox && (
            <div className="w-full flex gap-2 pt-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="سبب الرفض (مثلاً: موقع مكرر، صور غير واضحة، أرقام خاطئة...)"
                className="flex-1 bg-slate-900 border border-rose-700/60 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  onApproveSite(site.id, false, rejectionReason || 'موقع مكرر أو بيانات غير مكتملة');
                  setShowRejectBox(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                تأكيد الرفض
              </button>
            </div>
          )}

          {/* Quick Action for Agent: Start Visit */}
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={() => {
                onClose();
                onOpenNewVisitForSite(site);
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>زيارة الموقع الآن</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
