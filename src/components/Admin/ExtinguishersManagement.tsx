import React, { useState } from 'react';
import { Site, User, ExtinguisherMaintenanceInfo, ExtinguisherMaintenanceLog } from '../../types';
import { getDaysRemaining, getExtinguisherExpiryBadge, formatDateArabic } from '../../utils/date';
import { exportToCSV } from '../../utils/storage';
import { 
  Flame, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  ExternalLink, 
  Wrench, 
  X, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

interface ExtinguishersManagementProps {
  currentUser: User;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onUpdateSiteMaintenance: (siteId: string, maintenance: ExtinguisherMaintenanceInfo) => void;
  onOpenNewVisit: (site: Site) => void;
}

export const ExtinguishersManagement: React.FC<ExtinguishersManagementProps> = ({
  currentUser,
  sites,
  onSelectSite,
  onUpdateSiteMaintenance,
  onOpenNewVisit,
}) => {
  // Focus primarily on approved sites, or sites with extinguishers
  const [filterType, setFilterType] = useState<'all_approved' | 'expired' | 'expiring_30' | 'valid'>('all_approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  // Modal for quick update
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [companyName, setCompanyName] = useState('شركة أوريكيت للسلامة والوقاية من الحريق');
  const [techName, setTechName] = useState(currentUser.name);
  const [powder, setPowder] = useState(0);
  const [co2, setCo2] = useState(0);
  const [foam, setFoam] = useState(0);
  const [water, setWater] = useState(0);
  const [notes, setNotes] = useState('');

  // Only approved sites
  const approvedSites = sites.filter((s) => s.approvalStatus === 'approved');

  // Calculate metrics
  let totalValid = 0;
  let totalExpiringSoon = 0;
  let totalExpired = 0;
  let totalExtinguishersCount = 0;

  approvedSites.forEach((site) => {
    const ext = site.extinguisherMaintenance;
    const totalSiteExt = (ext?.powderCount || 0) + (ext?.co2Count || 0) + (ext?.foamCount || 0) + (ext?.waterCount || 0) || site.equipment?.extinguishers?.totalCount || 0;
    totalExtinguishersCount += totalSiteExt;

    if (!ext?.expiryDate) {
      totalExpiringSoon++;
      return;
    }

    const days = getDaysRemaining(ext.expiryDate);
    if (days === null) return;
    if (days < 0) totalExpired++;
    else if (days <= 30) totalExpiringSoon++;
    else totalValid++;
  });

  // Filter sites
  const filteredSites = approvedSites.filter((site) => {
    const ext = site.extinguisherMaintenance;
    const days = ext?.expiryDate ? getDaysRemaining(ext.expiryDate) : null;

    if (filterType === 'expired') {
      if (days === null || days >= 0) return false;
    } else if (filterType === 'expiring_30') {
      if (days === null || days < 0 || days > 30) return false;
    } else if (filterType === 'valid') {
      if (days === null || days <= 30) return false;
    }

    if (selectedCity !== 'all' && site.city !== selectedCity) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = site.name.toLowerCase().includes(q);
      const matchManager = site.managerName.toLowerCase().includes(q);
      const matchPhone = site.phone.includes(q);
      const matchTag = ext?.certificateOrTagNumber?.toLowerCase().includes(q);
      if (!matchName && !matchManager && !matchPhone && !matchTag) return false;
    }

    return true;
  });

  // Unique cities from approved sites
  const cities = Array.from(new Set(approvedSites.map((s) => s.city).filter(Boolean)));

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    const m = site.extinguisherMaintenance;
    const today = new Date().toISOString().split('T')[0];
    const defaultNext = new Date();
    defaultNext.setFullYear(defaultNext.getFullYear() + 1);

    setMaintDate(m?.lastMaintenanceDate || today);
    setExpiryDate(m?.expiryDate || defaultNext.toISOString().split('T')[0]);
    setTagNumber(m?.certificateOrTagNumber || `EXT-${site.id.slice(-6).toUpperCase()}`);
    setCompanyName(m?.maintenanceCompany || 'شركة أوريكيت للسلامة والوقاية من الحريق');
    setTechName(m?.technicianName || currentUser.name);
    setPowder(m?.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0);
    setCo2(m?.co2Count || 0);
    setFoam(m?.foamCount || 0);
    setWater(m?.waterCount || 0);
    setNotes(m?.notes || '');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    const totalCalculated = Number(powder) + Number(co2) + Number(foam) + Number(water);
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
      notes: notes || 'تم تحديث دورة الصيانة الدورية وتاريخ الصلاحية',
      createdAt: new Date().toISOString(),
    };

    const updatedMaintenance: ExtinguisherMaintenanceInfo = {
      hasMaintenancePlan: true,
      lastMaintenanceDate: maintDate,
      expiryDate,
      maintenanceCompany: companyName,
      technicianName: techName,
      certificateOrTagNumber: tagNumber,
      cylinderPressureChecked: true,
      status: newStatus,
      powderCount: Number(powder),
      co2Count: Number(co2),
      foamCount: Number(foam),
      waterCount: Number(water),
      notes,
      logs: [newLog, ...(editingSite.extinguisherMaintenance?.logs || [])],
    };

    onUpdateSiteMaintenance(editingSite.id, updatedMaintenance);
    setEditingSite(null);
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const exportRows = filteredSites.map((site) => {
      const ext = site.extinguisherMaintenance;
      const days = ext?.expiryDate ? getDaysRemaining(ext.expiryDate) : null;
      const badge = getExtinguisherExpiryBadge(ext?.expiryDate);

      return {
        'اسم المنشأة': site.name,
        'النوع': site.type,
        'المدينة': site.city,
        'الحي': site.district,
        'اسم المسؤول': site.managerName,
        'رقم الهاتف': site.phone,
        'حالة الاعتماد': 'معتمد رسمياً',
        'إجمالي الطفايات': (ext?.powderCount || 0) + (ext?.co2Count || 0) + (ext?.foamCount || 0) + (ext?.waterCount || 0) || site.equipment?.extinguishers?.totalCount || 0,
        'طفايات بودرة': ext?.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0,
        'طفايات CO2': ext?.co2Count || 0,
        'طفايات رغوة': ext?.foamCount || 0,
        'طفايات ماء/رطب': ext?.waterCount || 0,
        'تاريخ آخر صيانة': ext?.lastMaintenanceDate || 'غير مسجل',
        'تاريخ انتهاء الصلاحية': ext?.expiryDate || 'غير محدد',
        'الأيام المتبقية': days !== null ? days : 'غير محدد',
        'حالة الصلاحية': badge?.text || 'غير محدد',
        'رقم كارت الصيانة': ext?.certificateOrTagNumber || 'لا يوجد',
        'شركة الصيانة': ext?.maintenanceCompany || 'أوريكيت للسلامة',
        'الفني المعتمد': ext?.technicianName || 'غير مسجل',
        'المندوب': site.createdByAgentName,
      };
    });

    exportToCSV(`تقرير_صيانة_طفايات_المواقع_المعتمدة_${today}`, exportRows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400 bg-orange-950/70 border border-orange-700/60 px-2.5 py-0.5 rounded-full">
                قسم صيانة وتعبئة طفايات الحريق
              </span>
              <span className="text-xs text-slate-400">
                خاص بالمواقع المعتمدة • تتبع تواريخ الانتهاء وإعادة التعبئة
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              سجل صيانة طفايات الحريق وتواريخ الانتهاء
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              متابعة دقيقة لكل موقع معتمد، فحص الضغط، ملصقات الفحص الدوري، وتنبيهات انتهاء الصلاحية
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير كشف Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">المواقع المعتمدة للطفايات</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{approvedSites.length}</span>
              <span className="text-xs text-slate-400">منشأة ({totalExtinguishersCount} طفاية)</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 font-bold block mb-1">🟢 طفايات سارية الصلاحية</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">{totalValid}</span>
              <span className="text-xs text-slate-400">موقع آمن</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-amber-400 font-bold block mb-1">🟠 تنتهي خلال 30 يوم</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-400 font-mono">{totalExpiringSoon}</span>
              <span className="text-xs text-slate-400">بحاجة تعبئة وتجديد</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-rose-400 font-bold block mb-1">🔴 منتهية الصلاحية</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-400 font-mono">{totalExpired}</span>
              <span className="text-xs text-slate-400">فرصة فورية لأوريكيت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Filter Pills */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs overflow-x-auto gap-1">
            {[
              { id: 'all_approved', label: 'جميع المواقع المعتمدة', count: approvedSites.length },
              { id: 'expired', label: '🔴 منتهية الصلاحية', count: totalExpired },
              { id: 'expiring_30', label: '🟠 تنتهي خلال 30 يوم', count: totalExpiringSoon },
              { id: 'valid', label: '🟢 سارية الصلاحية', count: totalValid },
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* City Dropdown */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">جميع المدن والمناطق</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المنشأة، المسؤول، رقم الهاتف، أو رقم ملصق الصيانة..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>
      </div>

      {/* Extinguishers Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {filteredSites.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Flame className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-sm text-slate-300">لا توجد مواقع مطابقة للتصفية</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرب تغيير التصفية أو التأكد من اعتماد المواقع عبر صفحة سجل المواقع المركزي
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5">المنشأة المعتمدة</th>
                  <th className="p-3.5">المدينة والحي</th>
                  <th className="p-3.5">المسؤول والهاتف</th>
                  <th className="p-3.5">أعداد وأنواع الطفايات</th>
                  <th className="p-3.5">تاريخ الصيانة</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">حالة الصلاحية</th>
                  <th className="p-3.5">رقم الملصق</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredSites.map((site) => {
                  const ext = site.extinguisherMaintenance;
                  const totalSiteExt =
                    (ext?.powderCount || 0) +
                    (ext?.co2Count || 0) +
                    (ext?.foamCount || 0) +
                    (ext?.waterCount || 0) || site.equipment?.extinguishers?.totalCount || 0;
                  const badge = getExtinguisherExpiryBadge(ext?.expiryDate);

                  return (
                    <tr key={site.id} className="hover:bg-slate-850/60 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs sm:text-sm">{site.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓ معتمد</span>
                          <span>•</span>
                          <span>{site.type}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white">{site.city}</div>
                        <div className="text-[10px] text-slate-400">{site.district}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white font-medium">{site.managerName}</div>
                        <a
                          href={`tel:${site.phone}`}
                          className="text-[11px] text-emerald-400 font-mono hover:underline"
                          dir="ltr"
                        >
                          {site.phone}
                        </a>
                      </td>

                      <td className="p-3.5">
                        <div className="font-black text-amber-400 font-mono text-sm">
                          {totalSiteExt} طفاية
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          بودرة: {ext?.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0}
                          {ext?.co2Count ? ` • CO2: ${ext.co2Count}` : ''}
                          {ext?.foamCount ? ` • رغوة: ${ext.foamCount}` : ''}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        {ext?.lastMaintenanceDate || 'غير مسجل'}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-rose-300">
                          {ext?.expiryDate || 'غير محدد'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {badge ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${badge.badgeClass}`}>
                            {badge.text}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            بحاجة تحديد
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-amber-300 text-[11px]">
                        {ext?.certificateOrTagNumber || '-'}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(site)}
                            className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                            title="تحديث دورة الصيانة وتاريخ الانتهاء"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>تحديث الصيانة</span>
                          </button>

                          <button
                            onClick={() => onSelectSite(site)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="عرض تفاصيل الموقع الكاملة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK UPDATE MODAL */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                  🧯
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تحديث صيانة طفايات الموقع</h3>
                  <p className="text-[11px] text-slate-400">
                    {editingSite.name} • {editingSite.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSite(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الصيانة / التعبئة:</label>
                  <input
                    type="date"
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ انتهاء الصلاحية:</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">فترة الصلاحية:</span>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date(maintDate);
                    base.setFullYear(base.getFullYear() + 1);
                    setExpiryDate(base.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold"
                >
                  سنة واحدة (معياري)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date(maintDate);
                    base.setMonth(base.getMonth() + 6);
                    setExpiryDate(base.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-sky-950 border border-sky-700 text-sky-300 text-[10px] font-bold"
                >
                  6 أشهر
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم ملصق/كارت الصيانة:</label>
                  <input
                    type="text"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفني المسؤول:</label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-white font-bold block mb-1.5">أعداد الطفايات:</span>
                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">بودرة 6كجم:</label>
                    <input
                      type="number"
                      min="0"
                      value={powder}
                      onChange={(e) => setPowder(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">CO2:</label>
                    <input
                      type="number"
                      min="0"
                      value={co2}
                      onChange={(e) => setCo2(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">رغوة:</label>
                    <input
                      type="number"
                      min="0"
                      value={foam}
                      onChange={(e) => setFoam(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">ماء/رطب:</label>
                    <input
                      type="number"
                      min="0"
                      value={water}
                      onChange={(e) => setWater(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات وتوصيات الفحص..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتحديث الصلاحية</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
