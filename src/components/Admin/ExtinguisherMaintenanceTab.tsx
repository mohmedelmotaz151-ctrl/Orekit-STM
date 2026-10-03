import React, { useState } from 'react';
import { Site, ExtinguisherMaintenanceInfo, ExtinguisherMaintenanceLog, User } from '../../types';
import { formatDateArabic, getDaysRemaining, getExtinguisherExpiryBadge } from '../../utils/date';
import { 
  Flame, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  FileText, 
  Printer, 
  Wrench, 
  Check, 
  X, 
  Building2, 
  Phone,
  MessageCircle
} from 'lucide-react';
import { WhatsAppContactModal } from '../Common/WhatsAppContactModal';

interface ExtinguisherMaintenanceTabProps {
  site: Site;
  currentUser: User;
  onUpdateMaintenance: (maintenance: ExtinguisherMaintenanceInfo) => void;
  onOpenNewVisit?: (site: Site) => void;
}

export const ExtinguisherMaintenanceTab: React.FC<ExtinguisherMaintenanceTabProps> = ({
  site,
  currentUser,
  onUpdateMaintenance,
  onOpenNewVisit,
}) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const maintenance = site.extinguisherMaintenance || {
    hasMaintenancePlan: site.approvalStatus === 'approved',
    lastMaintenanceDate: site.approvedAt ? site.approvedAt.split('T')[0] : site.createdAt,
    expiryDate: '',
    maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
    technicianName: currentUser.name,
    certificateOrTagNumber: `EXT-${site.id.slice(-6).toUpperCase()}`,
    cylinderPressureChecked: true,
    status: 'valid',
    powderCount: site.equipment?.extinguishers?.totalCount || 0,
    co2Count: 0,
    foamCount: 0,
    waterCount: 0,
    notes: '',
    logs: [],
  };

  const expiryBadge = getExtinguisherExpiryBadge(maintenance.expiryDate);
  const daysLeft = getDaysRemaining(maintenance.expiryDate);
  const isApproved = site.approvalStatus === 'approved';

  // Form state for recording a new maintenance cycle
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultNextYear = new Date();
  defaultNextYear.setFullYear(defaultNextYear.getFullYear() + 1);
  const nextYearStr = defaultNextYear.toISOString().split('T')[0];

  const [maintDate, setMaintDate] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState(maintenance.expiryDate || nextYearStr);
  const [tagNumber, setTagNumber] = useState(
    maintenance.certificateOrTagNumber || `ORIKET-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [companyName, setCompanyName] = useState(maintenance.maintenanceCompany || 'شركة أوريكيت للسلامة والوقاية من الحريق');
  const [techName, setTechName] = useState(currentUser.name);
  const [powder, setPowder] = useState(maintenance.powderCount || site.equipment?.extinguishers?.totalCount || 0);
  const [co2, setCo2] = useState(maintenance.co2Count || 0);
  const [foam, setFoam] = useState(maintenance.foamCount || 0);
  const [water, setWater] = useState(maintenance.waterCount || 0);
  const [pressureChecked, setPressureChecked] = useState(true);
  const [hydroDate, setHydroDate] = useState(maintenance.hydrostaticTestDate || '');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [serviceAction, setServiceAction] = useState<'refill' | 'annual_inspection' | 'replacement' | 'new_install'>('annual_inspection');

  // Quick preset helper
  const handleSetPresetExpiry = (months: number) => {
    const base = new Date(maintDate || todayStr);
    base.setMonth(base.getMonth() + months);
    setExpiryDate(base.toISOString().split('T')[0]);
  };

  const handleSaveCycle = (e: React.FormEvent) => {
    e.preventDefault();

    const totalCalculated = Number(powder) + Number(co2) + Number(foam) + Number(water);

    // Determine status
    const remaining = getDaysRemaining(expiryDate);
    let newStatus: 'valid' | 'expiring_soon' | 'expired' | 'needs_refill' = 'valid';
    if (remaining !== null) {
      if (remaining < 0) newStatus = 'expired';
      else if (remaining <= 30) newStatus = 'expiring_soon';
    }

    const newLog: ExtinguisherMaintenanceLog = {
      id: `log_ext_${Date.now()}`,
      maintenanceDate: maintDate,
      expiryDate,
      technicianName: techName,
      companyName,
      certificateOrTagNumber: tagNumber,
      servicedCount: totalCalculated,
      typesServiced: [
        powder > 0 ? `بودرة (${powder})` : '',
        co2 > 0 ? `ثاني أكسيد الكربون (${co2})` : '',
        foam > 0 ? `رغوة (${foam})` : '',
        water > 0 ? `ماء (${water})` : '',
      ].filter(Boolean),
      status: 'completed',
      notes: maintenanceNotes || `تم تنفيذ دورة ${serviceAction === 'refill' ? 'إعادة تعبئة' : 'فحص سنوي واختبار صلاحية'}`,
      createdAt: new Date().toISOString(),
    };

    const updatedMaintenance: ExtinguisherMaintenanceInfo = {
      hasMaintenancePlan: true,
      lastMaintenanceDate: maintDate,
      expiryDate,
      maintenanceCompany: companyName,
      technicianName: techName,
      certificateOrTagNumber: tagNumber,
      cylinderPressureChecked: pressureChecked,
      hydrostaticTestDate: hydroDate,
      status: newStatus,
      powderCount: Number(powder),
      co2Count: Number(co2),
      foamCount: Number(foam),
      waterCount: Number(water),
      notes: maintenanceNotes,
      logs: [newLog, ...(maintenance.logs || [])],
    };

    onUpdateMaintenance(updatedMaintenance);
    setIsUpdateModalOpen(false);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header Alert Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition ${
        isApproved 
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-600/40 shadow-lg' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
              isApproved ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
            }`}>
              🧯
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  قسم صيانة طفايات الحريق وتاريخ الصلاحية
                </h3>
                {isApproved ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    موقع معتمد رسمياً
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 font-medium">
                    قيد المراجعة / غير معتمد بعد
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة دورات الصيانة الوقائية، إعادة التعبئة، والتواريخ المعتمدة لصلاحية طفايات الحريق
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition border border-emerald-400/30"
              title="تواصل عبر واتساب"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>تواصل واتساب</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
              title="طباعة شهادة الصيانة"
            >
              <Printer className="w-4 h-4 text-sky-400 shrink-0" />
              <span>طباعة الشهادة</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="col-span-2 sm:col-span-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/50 transition min-h-[42px]"
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span>توثيق صيانة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Expiry Status Countdown Banner */}
      {maintenance.expiryDate ? (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          daysLeft !== null && daysLeft < 0
            ? 'bg-rose-950/40 border-rose-600 text-rose-200'
            : daysLeft !== null && daysLeft <= 30
            ? 'bg-amber-950/40 border-amber-600 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-600/50 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-current">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">حالة صلاحية طفايات الحريق:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${expiryBadge?.badgeClass}`}>
                  {expiryBadge?.text}
                </span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                تاريخ انتهاء الصلاحية المحدد: <span className="font-mono text-amber-300">{maintenance.expiryDate}</span>
                {daysLeft !== null && (
                  <span className="text-xs font-normal text-slate-300 mr-2">
                    ({daysLeft < 0 ? `انتهت منذ ${Math.abs(daysLeft)} يوم` : `متبقي ${daysLeft} يوم على إعادة التعبئة`})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left text-xs space-y-0.5 border-t sm:border-t-0 sm:border-r border-slate-800 pt-2 sm:pt-0 sm:pr-4">
            <div className="text-slate-400">رقم ملصق / كارت الصيانة:</div>
            <div className="font-mono font-bold text-white text-sm">{maintenance.certificateOrTagNumber || 'غير مسجل'}</div>
            <div className="text-[11px] text-slate-400">آخر صيانة: {maintenance.lastMaintenanceDate || 'غير مسجلة'}</div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-700/60 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>لم يتم تسجيل تاريخ انتهاء صلاحية محدد لطفايات هذا الموقع بعد. اضغط على تحديث الصيانة لجدولة الصلاحية لسنة قادمة.</span>
          </div>
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold whitespace-nowrap transition"
          >
            تحديد تاريخ الانتهاء الآن
          </button>
        </div>
      )}

      {/* 3. Four Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">إجمالي الطفايات بالمنشأة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400">
              {(maintenance.powderCount || 0) + (maintenance.co2Count || 0) + (maintenance.foamCount || 0) + (maintenance.waterCount || 0) || site.equipment?.extinguishers?.totalCount || 0}
            </span>
            <span className="text-xs text-slate-400">طفاية</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">تاريخ آخر صيانة وتعبئة</span>
          <div className="text-sm font-bold text-white font-mono">
            {maintenance.lastMaintenanceDate || 'غير مسجلة'}
          </div>
          <span className="text-[10px] text-slate-400">
            {formatDateArabic(maintenance.lastMaintenanceDate)}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">تاريخ انتهاء الصلاحية</span>
          <div className="text-sm font-bold text-rose-400 font-mono">
            {maintenance.expiryDate || 'غير محدد'}
          </div>
          <span className="text-[10px] text-slate-400">
            {formatDateArabic(maintenance.expiryDate)}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">شركة الصيانة المسؤولة</span>
          <div className="text-xs font-bold text-emerald-400 line-clamp-1">
            {maintenance.maintenanceCompany || 'شركة أوريكيت للسلامة'}
          </div>
          <span className="text-[10px] text-slate-400">
            الفني: {maintenance.technicianName || 'فني معتمد'}
          </span>
        </div>
      </div>

      {/* 4. Extinguishers Breakdown Grid & Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Breakdown by Type */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h4 className="font-bold text-xs text-white">توزيع الطفايات حسب النوع والمادة</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">معيار NFPA 10</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">بودرة جافة (6 كجم)</span>
                <span className="font-bold text-white">Dry Powder ABC</span>
              </div>
              <span className="text-base font-black text-amber-400 font-mono">
                {maintenance.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">ثاني أكسيد الكربون (5 كجم)</span>
                <span className="font-bold text-white">CO2</span>
              </div>
              <span className="text-base font-black text-sky-400 font-mono">
                {maintenance.co2Count || 0}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">رغوة ميكانيكية</span>
                <span className="font-bold text-white">Foam (AFFF)</span>
              </div>
              <span className="text-base font-black text-emerald-400 font-mono">
                {maintenance.foamCount || 0}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">كيميائي رطب / ماء</span>
                <span className="font-bold text-white">Wet Chemical / Water</span>
              </div>
              <span className="text-base font-black text-purple-400 font-mono">
                {maintenance.waterCount || 0}
              </span>
            </div>
          </div>

          {maintenance.notes && (
            <div className="p-2.5 rounded-xl bg-slate-900 text-xs text-slate-300">
              <span className="text-slate-400 block text-[10px]">ملاحظات الفحص والصيانة:</span>
              {maintenance.notes}
            </div>
          )}
        </div>

        {/* Technical Safety Inspection Checklist */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-xs text-white">معايير فحص السلامة المعتمدة للدفاع المدني</h4>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
              معتمد
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>مؤشر ضغط الساعات في المنطقة الخضراء (Pressure Gauge OK)</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>سلامة مسمار الأمان والختم البلاستيكي المعتمد (Safety Pin & Seal)</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>خلو الاسطوانة من الصدأ والضربات وجاهزية الخرطوم (Hose & Body)</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تثبيت ملصق الصيانة والتعبئة المعتمد مع تاريخ الانتهاء المقروء</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Historical Maintenance Logs Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <h4 className="font-bold text-xs text-white">
              سجل دورات الصيانة وإعادة التعبئة السابقة ({maintenance.logs?.length || 0})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">توثيق دقيق لكل عملية فحص</span>
        </div>

        {!maintenance.logs || maintenance.logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 space-y-2">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
            <p>لا توجد دورات صيانة سابقة مسجلة لهذا الموقع بعد.</p>
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="text-orange-400 font-bold hover:underline"
            >
              + إضافة أول دورة صيانة الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">تاريخ الصيانة</th>
                  <th className="p-2.5">تاريخ الانتهاء</th>
                  <th className="p-2.5">رقم الملصق/الكارت</th>
                  <th className="p-2.5">عدد الطفايات المفحوصة</th>
                  <th className="p-2.5">الفني المسؤول</th>
                  <th className="p-2.5">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {maintenance.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-mono font-bold text-white">{log.maintenanceDate}</td>
                    <td className="p-2.5 font-mono text-rose-300 font-bold">{log.expiryDate}</td>
                    <td className="p-2.5 font-mono text-amber-300">{log.certificateOrTagNumber || '-'}</td>
                    <td className="p-2.5 font-bold">{log.servicedCount} طفاية</td>
                    <td className="p-2.5 text-slate-300">{log.technicianName || log.companyName || 'فني السلامة'}</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. MODAL: Record / Update Maintenance & Expiry Date */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                  🧯
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    تسجيل وتحديث صيانة طفايات الحريق وتاريخ الانتهاء
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    المنشأة: {site.name} • {site.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCycle} className="space-y-4 text-xs">
              
              {/* Type of Maintenance Action */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">نوع العملية المنفذة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'annual_inspection', label: 'فحص سنوي معتمد' },
                    { id: 'refill', label: 'إعادة تعبئة وضغط' },
                    { id: 'replacement', label: 'استبدال طفايات تالفة' },
                    { id: 'new_install', label: 'تركيب طفايات جديدة' },
                  ].map((act) => (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => setServiceAction(act.id as any)}
                      className={`p-2 rounded-xl border text-center transition font-bold ${
                        serviceAction === act.id
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    تاريخ الصيانة / التعبئة:
                  </label>
                  <input
                    type="date"
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    تاريخ انتهاء الصلاحية المعتمد:
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons for Expiry */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">فترة الصلاحية المقررة:</span>
                <button
                  type="button"
                  onClick={() => handleSetPresetExpiry(12)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] font-bold"
                >
                  سنة واحدة (الدفاع المدني السعودي)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetExpiry(6)}
                  className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 text-[11px] font-bold"
                >
                  6 أشهر
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetExpiry(24)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px]"
                >
                  سنتان
                </button>
              </div>

              {/* Tag / Sticker Number & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    رقم ملصق / كارت الصيانة الدوري:
                  </label>
                  <input
                    type="text"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    placeholder="مثال: ORIKET-2026-09"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    الفني المنفذ / المفتش:
                  </label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    placeholder="اسم الفني"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  شركة الصيانة المسؤولة:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="شركة أوريكيت للسلامة والوقاية من الحريق"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Extinguishers Quantities by Type */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">أعداد الطفايات المشمولة بالصيانة:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">بودرة 6 كجم:</label>
                    <input
                      type="number"
                      min="0"
                      value={powder}
                      onChange={(e) => setPowder(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">CO2 (ثاني أكسيد):</label>
                    <input
                      type="number"
                      min="0"
                      value={co2}
                      onChange={(e) => setCo2(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">رغوة Foam:</label>
                    <input
                      type="number"
                      min="0"
                      value={foam}
                      onChange={(e) => setFoam(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">ماء / رطب:</label>
                    <input
                      type="number"
                      min="0"
                      value={water}
                      onChange={(e) => setWater(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ملاحظات الفحص وتقرير الصيانة:
                </label>
                <textarea
                  rows={2}
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="مثال: تم فحص وتعبئة الطفايات واختبار الصمامات ووضع ملصقات شركة أوريكيت المعتمدة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ دورة الصيانة وتحديث تاريخ الانتهاء</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

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
