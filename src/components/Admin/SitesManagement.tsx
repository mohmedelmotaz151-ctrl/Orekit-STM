import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  PlusCircle, 
  FileSpreadsheet, 
  Eye, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Clock,
  Flame,
  ChevronLeft
} from 'lucide-react';
import { Site, User, SiteStatus, SiteApprovalStatus, SiteType, SAUDI_CITIES } from '../../types';
import { exportToCSV } from '../../utils/storage';
import { SITE_STATUS_MAP, formatDateArabic, getContractExpiryBadge } from '../../utils/date';

interface SitesManagementProps {
  currentUser: User;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onOpenNewVisit: (site?: Site) => void;
  onApproveSite: (siteId: string, approved: boolean, reason?: string) => void;
}

export const SitesManagement: React.FC<SitesManagementProps> = ({
  currentUser,
  sites,
  onSelectSite,
  onOpenNewVisit,
  onApproveSite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  const filteredSites = sites.filter((site) => {
    if (filterCity !== 'all' && site.city !== filterCity) return false;
    if (filterType !== 'all' && site.type !== filterType) return false;
    if (filterStatus !== 'all' && site.status !== filterStatus) return false;
    if (filterApproval !== 'all' && site.approvalStatus !== filterApproval) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = site.name.toLowerCase().includes(q);
      const matchManager = site.managerName.toLowerCase().includes(q);
      const matchPhone = site.phone.includes(q);
      const matchDistrict = site.district.toLowerCase().includes(q);
      const matchAgent = site.createdByAgentName.toLowerCase().includes(q);
      return matchName || matchManager || matchPhone || matchDistrict || matchAgent;
    }
    return true;
  });

  const handleExportCSV = () => {
    const exportData = filteredSites.map((s) => ({
      'اسم المنشأة': s.name,
      'النشاط': s.type,
      'المدينة': s.city,
      'الحي': s.district,
      'اسم المسؤول': s.managerName,
      'رقم الهاتف': s.phone,
      'المندوب': s.createdByAgentName,
      'حالة العميل': SITE_STATUS_MAP[s.status]?.label || s.status,
      'حالة الاعتماد': s.approvalStatus === 'approved' ? 'معتمد' : s.approvalStatus === 'pending' ? 'قيد المراجعة' : 'مرفوض',
      'الحافز (ر.س)': s.incentiveAmount || 1.50,
      'شركة الصيانة الحالية': s.contract.companyName || 'لا يوجد',
      'تاريخ انتهاء العقد': s.contract.endDate || 'غير محدد',
      'عدد الطفايات': s.equipment.extinguishers.totalCount,
      'نظام الإنذار': s.equipment.alarmSystem.exists ? (s.equipment.alarmSystem.working ? 'يعمل' : 'معطل') : 'لا يوجد',
      'تاريخ التسجيل': s.createdAt,
    }));

    exportToCSV(`مواقع_أوريكيت_للسلامة_${new Date().toISOString().split('T')[0]}`, exportData);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة المواقع والمنشآت (CRM)</h2>
          <p className="text-xs text-slate-400">
            قاعدة البيانات المركزية لعملاء الصيانة والسلامة ومتابعة التراخيص
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => onOpenNewVisit()}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل موقع جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، المسؤول، الهاتف، الحي، أو المندوب..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="all">كل المدن</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="all">كل الحالات</option>
              <option value="new_opportunity">🟢 فرصة جديدة</option>
              <option value="expiring_soon">🟠 عقد قريب الانتهاء</option>
              <option value="urgent_maintenance">🔴 يحتاج صيانة عاجلة</option>
              <option value="competitor_contract">🔵 عقد مع منافس</option>
              <option value="needs_followup">🟡 يحتاج متابعة</option>
            </select>
          </div>

          <div>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="all">كل حالات الاعتماد</option>
              <option value="pending">⏳ قيد المراجعة</option>
              <option value="approved">✓ معتمد بالحافز</option>
              <option value="rejected">✕ مرفوض</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
          <span>نتائج الفلترة: <strong className="text-white">{filteredSites.length}</strong> موقع</span>
          <span>إجمالي الحوافز المعتمدة: <strong className="text-orange-400">{(filteredSites.filter(s => s.approvalStatus === 'approved').length * 1.5).toFixed(2)} ر.س</strong></span>
        </div>
      </div>

      {/* Sites CRM Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3.5">المنشأة والنشاط</th>
                <th className="p-3.5">الموقع والمدينة</th>
                <th className="p-3.5">المسؤول والهاتف</th>
                <th className="p-3.5">أجهزة السلامة</th>
                <th className="p-3.5">عقد الصيانة الحالي</th>
                <th className="p-3.5">المندوب</th>
                <th className="p-3.5">حالة العميل</th>
                <th className="p-3.5">الاعتماد والحافز</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا توجد منشآت مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const statusInfo = SITE_STATUS_MAP[site.status] || SITE_STATUS_MAP.new_opportunity;
                  const expiryBadge = site.contract.endDate ? getContractExpiryBadge(site.contract.endDate) : null;

                  return (
                    <tr
                      key={site.id}
                      onClick={() => onSelectSite(site)}
                      className="hover:bg-slate-800/60 cursor-pointer transition"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            <img
                              src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">{site.name}</div>
                            <span className="text-[10px] text-slate-400">{site.type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white">{site.city}</div>
                        <div className="text-[10px] text-slate-400">{site.district}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white font-medium">{site.managerName}</div>
                        <div className="text-[11px] text-emerald-400 font-mono" dir="ltr">{site.phone}</div>
                      </td>

                      <td className="p-3.5">
                        <div>{site.equipment.extinguishers.totalCount} طفاية</div>
                        <div className="text-[10px] text-slate-400">
                          إنذار: {site.equipment.alarmSystem.exists ? (site.equipment.alarmSystem.working ? 'يعمل' : 'معطل') : 'لا يوجد'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white">{site.contract.companyName || 'لا يوجد'}</div>
                        {expiryBadge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${expiryBadge.badgeClass}`}>
                            {expiryBadge.days <= 0 ? 'منتهي' : `خلال ${expiryBadge.days} يوم`}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-medium text-slate-200">
                        {site.createdByAgentName}
                      </td>

                      <td className="p-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${statusInfo.bgClass}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${
                          site.approvalStatus === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : site.approvalStatus === 'pending'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {site.approvalStatus === 'approved' ? `معتمد (+${site.incentiveAmount || 1.50} ر.س)` : site.approvalStatus === 'pending' ? 'قيد التدقيق' : 'مرفوض'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectSite(site)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                            title="عرض ملف CRM"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {site.latitude && site.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900 text-blue-400 border border-blue-800/60"
                              title="فتح في خرائط Google"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {site.approvalStatus === 'pending' && (
                            <button
                              onClick={() => onApproveSite(site.id, true)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="اعتماد الحافز"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
