import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Flame, 
  Phone, 
  Calendar, 
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { Site, User } from '../../types';
import { getDaysRemaining, getContractExpiryBadge, formatDateArabic } from '../../utils/date';

interface AgentAlertsProps {
  currentUser: User;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onOpenNewVisit: (site: Site) => void;
}

export const AgentAlerts: React.FC<AgentAlertsProps> = ({
  currentUser,
  sites,
  onSelectSite,
  onOpenNewVisit,
}) => {
  // 1. Group contracts by countdown tier
  const contractsExpiring7Days = sites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract.endDate) || 999 }))
    .filter((item) => item.days <= 7);

  const contractsExpiring30Days = sites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract.endDate) || 999 }))
    .filter((item) => item.days > 7 && item.days <= 30);

  const contractsExpiring60Days = sites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract.endDate) || 999 }))
    .filter((item) => item.days > 30 && item.days <= 60);

  const contractsExpiring90Days = sites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract.endDate) || 999 }))
    .filter((item) => item.days > 60 && item.days <= 90);

  // 2. Civil defense visits within 30 days
  const upcomingCivilDefense = sites
    .filter((s) => s.civilDefense.hasRecord && s.civilDefense.nextVisitDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.civilDefense.nextVisitDate) || 999 }))
    .filter((item) => item.days >= 0 && item.days <= 45)
    .sort((a, b) => a.days - b.days);

  // 3. Urgent maintenance needed
  const urgentMaintenance = sites.filter((s) => s.status === 'urgent_maintenance');

  const totalAlerts = 
    contractsExpiring7Days.length + 
    contractsExpiring30Days.length + 
    contractsExpiring60Days.length + 
    contractsExpiring90Days.length + 
    upcomingCivilDefense.length + 
    urgentMaintenance.length;

  return (
    <div className="space-y-5 max-w-md mx-auto pb-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 p-4 rounded-3xl border border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مركز التذكيرات الذكية والمتابعات</h2>
            <p className="text-xs text-slate-300">
              إجمالي التنبيهات الميدانية النشطة: <strong className="text-amber-400">{totalAlerts} تنبيه</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 1. Critical Contracts: Within 7 Days */}
      {contractsExpiring7Days.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              🔴 عقود تنتهي خلال 7 أيام (عاجل جداً - فرصة إغلاق فورية)
            </span>
            <span className="text-xs font-bold text-red-400">{contractsExpiring7Days.length}</span>
          </div>

          {contractsExpiring7Days.map(({ site, days }) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-red-950/30 border-2 border-red-700/80 p-3.5 rounded-2xl cursor-pointer hover:bg-red-950/50 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{site.name}</h4>
                <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {days < 0 ? 'منتهي!' : `متبقٍ ${days} أيام`}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                شركة الصيانة الحالية: <strong className="text-white">{site.contract.companyName || 'منافس'}</strong>
                <span className="block text-[11px] text-slate-400">تاريخ الانتهاء: {site.contract.endDate} • المسؤول: {site.managerName}</span>
              </div>

              <div className="pt-2 border-t border-red-800/60 flex items-center justify-between">
                <a
                  href={`tel:${site.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 text-xs font-bold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال بالمسؤول</span>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewVisit(site);
                  }}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  بدء زيارة تجديد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Urgent Contracts: Within 30 Days */}
      {contractsExpiring30Days.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>⚠️</span>
              عقود تنتهي خلال 30 يوماً (متابعة وإرسال عروض أوريكيت)
            </span>
            <span className="text-xs font-bold text-amber-400">{contractsExpiring30Days.length}</span>
          </div>

          {contractsExpiring30Days.map(({ site, days }) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-amber-950/20 border border-amber-600/60 p-3.5 rounded-2xl cursor-pointer hover:bg-amber-950/30 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{site.name}</h4>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  ينتهي خلال {days} يوم
                </span>
              </div>

              <div className="text-xs text-slate-300">
                الشركة: {site.contract.companyName || 'شركة أخرى'} • {site.city} - {site.district}
              </div>

              <div className="pt-2 border-t border-amber-800/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">المندوب: {site.createdByAgentName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewVisit(site);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                >
                  تسجيل زيارة ومتابعة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Defense Visits Incoming */}
      {upcomingCivilDefense.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              مواعيد تفتيش الدفاع المدني القادمة
            </span>
            <span className="text-xs font-bold text-sky-400">{upcomingCivilDefense.length}</span>
          </div>

          {upcomingCivilDefense.map(({ site, days }) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-850 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{site.name}</h4>
                <span className="bg-sky-950 text-sky-300 border border-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  التفتيش بعد {days} يوم
                </span>
              </div>

              <p className="text-xs text-slate-400">
                تاريخ الزيارة المقررة: {formatDateArabic(site.civilDefense.nextVisitDate)} • تقرير: {site.civilDefense.reportNumber || 'غير مسجل'}
              </p>

              {site.civilDefense.notes && (
                <div className="p-2 rounded-lg bg-slate-950 text-[11px] text-amber-300">
                  {site.civilDefense.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Urgent Maintenance Needed */}
      {urgentMaintenance.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              منشآت بحاجة لصيانة عاجلة (طفايات / إنذار)
            </span>
            <span className="text-xs font-bold text-rose-400">{urgentMaintenance.length}</span>
          </div>

          {urgentMaintenance.map((site) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-850 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{site.name}</h4>
                <span className="text-[11px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
                  🔴 صيانة عاجلة
                </span>
              </div>
              <p className="text-xs text-slate-400">
                الإنذار: {site.equipment.alarmSystem.working ? 'يعمل' : 'معطل بحاجة إصلاح'} • الطفايات: {site.equipment.extinguishers.totalCount} طفاية
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
