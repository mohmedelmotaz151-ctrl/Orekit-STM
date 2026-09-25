import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  FileText, 
  ShieldAlert, 
  Building2, 
  Users, 
  Award, 
  Clock, 
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { User, Site, Visit, IncentiveSettings } from '../../types';
import { exportToCSV } from '../../utils/storage';
import { getDaysRemaining, getContractExpiryBadge, formatDateArabic, SITE_STATUS_MAP } from '../../utils/date';

interface ReportsManagementProps {
  currentUser: User;
  sites: Site[];
  visits: Visit[];
  agents: User[];
  settings: IncentiveSettings;
}

export const ReportsManagement: React.FC<ReportsManagementProps> = ({
  currentUser,
  sites,
  visits,
  agents,
  settings,
}) => {
  const [activeReportType, setActiveReportType] = useState<
    'expiring_contracts' | 'agents_performance' | 'safety_equipment' | 'civil_defense' | 'all_sites' | 'visits_log'
  >('expiring_contracts');

  // 1. Expiring contracts data
  const expiringContractsData = sites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({
      site: s,
      days: getDaysRemaining(s.contract.endDate) || 999,
      badge: getContractExpiryBadge(s.contract.endDate),
    }))
    .sort((a, b) => a.days - b.days);

  // 2. Safety equipment needs
  const safetyEquipmentNeedsData = sites.filter(
    (s) =>
      s.equipment.extinguishers.needsMaintenance ||
      s.equipment.extinguishers.needsReplacement ||
      s.equipment.extinguishers.needsNewInstall ||
      !s.equipment.alarmSystem.working ||
      s.status === 'urgent_maintenance'
  );

  // Export handlers
  const handleExportActiveReport = () => {
    const today = new Date().toISOString().split('T')[0];

    if (activeReportType === 'expiring_contracts') {
      const rows = expiringContractsData.map(({ site, days }) => ({
        'اسم المنشأة': site.name,
        'النوع': site.type,
        'المدينة': site.city,
        'اسم المسؤول': site.managerName,
        'الهاتف': site.phone,
        'شركة الصيانة الحالية': site.contract.companyName || 'منافس',
        'تاريخ انتهاء العقد': site.contract.endDate,
        'الأيام المتبقية': days,
        'حالة التنبيه': days <= 7 ? 'عاجل جداً (7 أيام)' : days <= 30 ? 'ينتهي خلال شهر' : days <= 60 ? 'خلال 60 يوم' : 'خلال 90 يوم',
        'المندوب المسؤول': site.createdByAgentName,
      }));
      exportToCSV(`تقرير_العقود_المنتهية_أوريكيت_${today}`, rows);
    } else if (activeReportType === 'agents_performance') {
      const rows = agents
        .filter((a) => a.role === 'agent')
        .map((a) => {
          const aSites = sites.filter((s) => s.createdByAgentId === a.id);
          const approved = aSites.filter((s) => s.approvalStatus === 'approved').length;
          const pending = aSites.filter((s) => s.approvalStatus === 'pending').length;
          const visitsCount = visits.filter((v) => v.agentId === a.id).length;
          const incentiveSAR = approved * (settings.ratePerApprovedSiteSAR || 1.5);
          return {
            'المندوب': a.name,
            'الجوال': a.phone,
            'المدينة': a.assignedCity,
            'المواقع المسجلة': aSites.length,
            'المعتمدة بالحافز': approved,
            'قيد التدقيق': pending,
            'عدد الزيارات': visitsCount,
            'المستهدف الشهري': a.targetSitesMonth,
            'نسبة الإنجاز %': `${Math.round((approved / a.targetSitesMonth) * 100)}%`,
            'الحافز المستحق (ر.س)': incentiveSAR.toFixed(2),
          };
        });
      exportToCSV(`تقرير_أداء_مندوبي_أوريكيت_${today}`, rows);
    } else if (activeReportType === 'safety_equipment') {
      const rows = safetyEquipmentNeedsData.map((s) => ({
        'المنشأة': s.name,
        'النشاط': s.type,
        'المدينة': s.city,
        'المسؤول': s.managerName,
        'الهاتف': s.phone,
        'عدد الطفايات': s.equipment.extinguishers.totalCount,
        'صيانة طفايات': s.equipment.extinguishers.needsMaintenance ? 'نعم' : 'لا',
        'استبدال طفايات': s.equipment.extinguishers.needsReplacement ? 'نعم' : 'لا',
        'تركيب جديد': s.equipment.extinguishers.needsNewInstall ? 'نعم' : 'لا',
        'حالة الإنذار': s.equipment.alarmSystem.exists ? (s.equipment.alarmSystem.working ? 'يعمل' : 'معطل بحاجة إصلاح') : 'لا يوجد',
        'نوع لوحة الإنذار': s.equipment.alarmSystem.panelType,
        'مضخات الحريق': s.equipment.waterAndPumps.pumpsExist ? s.equipment.waterAndPumps.pumpsType : 'لا يوجد',
        'نظام خاص': s.equipment.waterAndPumps.specialSuppressionSystem,
        'المندوب': s.createdByAgentName,
      }));
      exportToCSV(`تقرير_احتياجات_أجهزة_السلامة_${today}`, rows);
    } else if (activeReportType === 'visits_log') {
      const rows = visits.map((v) => ({
        'اسم المنشأة': v.siteName,
        'المندوب': v.agentName,
        'تاريخ الزيارة': v.visitDate,
        'وقت البداية': v.startTime,
        'وقت النهاية': v.endTime,
        'المدة (دقيقة)': v.durationMinutes,
        'نوع الجهاز': v.deviceModel,
        'إحداثيات البداية': `${v.startLatitude}, ${v.startLongitude}`,
        'الملاحظات': v.notes,
        'الحالة الناتجة': SITE_STATUS_MAP[v.outcomeStatus]?.label || v.outcomeStatus,
      }));
      exportToCSV(`سجل_الزيارات_الميدانية_${today}`, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/40 p-5 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
            مركز التقارير والذكاء الميداني
          </span>
          <h2 className="text-xl font-black text-white">تقارير شركة أوريكيت للسلامة</h2>
          <p className="text-xs text-slate-300">
            تصدير تقارير العقود، أداء المندوبين، أجهزة ومعدات السلامة، ومواعيد الدفاع المدني بصيغتي Excel و PDF
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto no-print">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>طباعة تقرير (PDF)</span>
          </button>

          <button
            onClick={handleExportActiveReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 no-print text-xs">
        {[
          { id: 'expiring_contracts', label: 'العقود التي ستنتهي (30-90 يوم)', icon: AlertTriangle, count: expiringContractsData.length },
          { id: 'agents_performance', label: 'تقرير أداء وحوافز المندوبين', icon: Award, count: agents.filter(a => a.role === 'agent').length },
          { id: 'safety_equipment', label: 'تقرير أجهزة السلامة واحتياج الصيانة', icon: Flame, count: safetyEquipmentNeedsData.length },
          { id: 'visits_log', label: 'سجل الزيارات الميدانية الموثقة', icon: Clock, count: visits.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportType(tab.id as any)}
              className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between gap-2 ${
                isActive
                  ? 'bg-orange-600/20 text-orange-300 border-orange-500/50 shadow-md font-bold'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="line-clamp-1">{tab.label}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 font-mono text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT VIEWPORT */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4">
        
        {/* Printable Letterhead Header */}
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-lg">
              🛡️
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                شركة أوريكيت للسلامة والوقاية من الحريق
              </h3>
              <p className="text-xs text-slate-400">
                المملكة العربية السعودية • تقرير الإدارة العليا الميداني
              </p>
            </div>
          </div>
          <div className="text-left text-xs text-slate-400">
            <div>تاريخ الاستخراج: {formatDateArabic(new Date().toISOString().split('T')[0])}</div>
            <div>المستخدم المستخرج: {currentUser.name}</div>
          </div>
        </div>

        {/* 1. EXPIRING CONTRACTS TABLE */}
        {activeReportType === 'expiring_contracts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">اسم المنشأة</th>
                  <th className="p-3">المدينة والحي</th>
                  <th className="p-3">شركة الصيانة الحالية</th>
                  <th className="p-3">تاريخ الانتهاء</th>
                  <th className="p-3">المتبقي</th>
                  <th className="p-3">المسؤول والهاتف</th>
                  <th className="p-3">المندوب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {expiringContractsData.map(({ site, days, badge }) => (
                  <tr key={site.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{site.name}</td>
                    <td className="p-3">{site.city} - {site.district}</td>
                    <td className="p-3 font-medium text-amber-300">{site.contract.companyName || 'شركة أخرى'}</td>
                    <td className="p-3 font-mono">{site.contract.endDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge?.badgeClass}`}>
                        {badge?.text}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{site.managerName} ({site.phone})</td>
                    <td className="p-3 text-slate-400">{site.createdByAgentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. AGENTS PERFORMANCE TABLE */}
        {activeReportType === 'agents_performance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">المندوب</th>
                  <th className="p-3">المنطقة</th>
                  <th className="p-3">المواقع المسجلة</th>
                  <th className="p-3">المعتمدة بالحافز</th>
                  <th className="p-3">المستهدف (300 موقع)</th>
                  <th className="p-3">نسبة الإنجاز</th>
                  <th className="p-3 text-orange-400">الحافز المالي المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {agents.filter(a => a.role === 'agent').map((agent) => {
                  const aSites = sites.filter(s => s.createdByAgentId === agent.id);
                  const approved = aSites.filter(s => s.approvalStatus === 'approved').length;
                  const rate = settings.ratePerApprovedSiteSAR || 1.5;
                  const earnedSAR = (approved * rate) + (approved >= settings.minTargetSites ? settings.targetBonusSAR : 0);
                  const progress = Math.min(100, Math.round((approved / agent.targetSitesMonth) * 100));

                  return (
                    <tr key={agent.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{agent.name}</td>
                      <td className="p-3">{agent.assignedCity}</td>
                      <td className="p-3 font-mono">{aSites.length}</td>
                      <td className="p-3 font-bold text-emerald-400 font-mono">{approved} موقع</td>
                      <td className="p-3 font-mono">{agent.targetSitesMonth}</td>
                      <td className="p-3">
                        <span className="font-bold text-amber-400">{progress}%</span>
                      </td>
                      <td className="p-3 font-black text-orange-400 font-mono text-sm">
                        {earnedSAR.toFixed(2)} ر.س
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. SAFETY EQUIPMENT AUDIT TABLE */}
        {activeReportType === 'safety_equipment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">المنشأة</th>
                  <th className="p-3">النشاط</th>
                  <th className="p-3">طفايات الحريق</th>
                  <th className="p-3">احتياج الطفايات</th>
                  <th className="p-3">نظام الإنذار</th>
                  <th className="p-3">الأنظمة الخاصة والمضخات</th>
                  <th className="p-3">حالة المنشأة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {safetyEquipmentNeedsData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{s.name}</td>
                    <td className="p-3">{s.type}</td>
                    <td className="p-3 font-mono">{s.equipment.extinguishers.totalCount} طفاية</td>
                    <td className="p-3 text-[11px]">
                      {s.equipment.extinguishers.needsMaintenance && <span className="text-amber-400 block">• تحتاج صيانة</span>}
                      {s.equipment.extinguishers.needsReplacement && <span className="text-red-400 block">• تحتاج استبدال</span>}
                      {s.equipment.extinguishers.needsNewInstall && <span className="text-emerald-400 block">• تركيب جديد</span>}
                    </td>
                    <td className="p-3">
                      {s.equipment.alarmSystem.exists ? (
                        <span className={s.equipment.alarmSystem.working ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                          {s.equipment.alarmSystem.working ? 'يعمل' : '⚠️ معطل بحاجة إصلاح'}
                        </span>
                      ) : (
                        <span className="text-slate-500">لا يوجد (فرصة)</span>
                      )}
                    </td>
                    <td className="p-3">{s.equipment.waterAndPumps.specialSuppressionSystem || 'غير متوفر'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SITE_STATUS_MAP[s.status]?.bgClass}`}>
                        {SITE_STATUS_MAP[s.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. VISITS LOG TABLE */}
        {activeReportType === 'visits_log' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">المنشأة</th>
                  <th className="p-3">المندوب</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">المدة</th>
                  <th className="p-3">الجهاز</th>
                  <th className="p-3">الملاحظات</th>
                  <th className="p-3">الحالة الناتجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{v.siteName}</td>
                    <td className="p-3 text-slate-200">{v.agentName}</td>
                    <td className="p-3 font-mono">{v.visitDate} ({v.startTime} - {v.endTime})</td>
                    <td className="p-3 font-mono">{v.durationMinutes} دقيقة</td>
                    <td className="p-3 text-[11px] text-slate-400">{v.deviceModel}</td>
                    <td className="p-3 text-slate-300 line-clamp-1">{v.notes}</td>
                    <td className="p-3">
                      <span className="text-orange-400 font-bold">
                        {SITE_STATUS_MAP[v.outcomeStatus]?.label || v.outcomeStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
