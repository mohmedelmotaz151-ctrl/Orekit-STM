import React from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  ChevronLeft, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { User, Site, Visit, IncentiveSettings } from '../../types';
import { calculateAgentIncentives } from '../../utils/storage';
import { getContractExpiryBadge, getDaysRemaining } from '../../utils/date';

interface AgentHomeProps {
  currentUser: User;
  sites: Site[];
  visits: Visit[];
  settings: IncentiveSettings;
  onOpenNewVisit: (siteToVisit?: Site) => void;
  onNavigateTab: (tab: 'home' | 'sites' | 'map' | 'alerts' | 'profile') => void;
  onSelectSite: (site: Site) => void;
}

export const AgentHome: React.FC<AgentHomeProps> = ({
  currentUser,
  sites,
  visits,
  settings,
  onOpenNewVisit,
  onNavigateTab,
  onSelectSite,
}) => {
  const agentSites = sites.filter(
    (s) => s.createdByAgentId === currentUser.id || 
           (s.createdByAgentName && s.createdByAgentName === currentUser.name)
  );
  const agentVisits = visits.filter(
    (v) => v.agentId === currentUser.id || 
           (v.agentName && v.agentName === currentUser.name)
  );

  // Incentive metrics
  const inc = calculateAgentIncentives(currentUser.id, sites, settings, currentUser.name);

  // Sites needing follow-up
  const followUpSites = agentSites.filter(
    (s) => s.status === 'needs_followup' || s.status === 'urgent_maintenance'
  );

  // Sites with expiring contracts
  const expiringSites = agentSites
    .filter((s) => s.contract.hasContract === 'yes' && s.contract.endDate)
    .map((s) => ({
      site: s,
      badge: getContractExpiryBadge(s.contract.endDate),
      days: getDaysRemaining(s.contract.endDate) || 999,
    }))
    .filter((item) => item.days <= 90)
    .sort((a, b) => a.days - b.days);

  // Civil defense inspections within 30 days
  const civilDefenseSites = agentSites
    .filter((s) => s.civilDefense.hasRecord && s.civilDefense.nextVisitDate)
    .map((s) => ({
      site: s,
      days: getDaysRemaining(s.civilDefense.nextVisitDate) || 999,
    }))
    .filter((item) => item.days >= 0 && item.days <= 30)
    .sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-4 max-w-md mx-auto pb-6">
      
      {/* Top Banner Card: Oriket & Greeting */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-orange-950/40 p-5 rounded-3xl border border-slate-850 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-base shadow">
              🛡️
            </div>
            <div>
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                شركة أوريكيت للسلامة
              </span>
              <h2 className="text-xl font-black text-white">
                مرحباً، {currentUser.name} 👋
              </h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            {currentUser.assignedCity}
          </span>
        </div>

        {/* Big Start New Visit Button */}
        <button
          onClick={() => onOpenNewVisit()}
          className="w-full mt-2 py-4 px-5 rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-base shadow-xl shadow-orange-950/60 flex items-center justify-center gap-2.5 transition transform active:scale-98 border border-orange-400/30 group"
        >
          <PlusCircle className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
          <span>+ زيارة جديدة (بدء الزيارة الميدانية)</span>
        </button>
      </div>

      {/* 3 Main Quick Stats: Sites, Visits, Incentive */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Sites */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition shadow-md"
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">المواقع</span>
          <div className="text-2xl font-black text-white">{inc.approvedCount + inc.pendingCount}</div>
          <span className="text-[10px] text-emerald-400 block font-medium">
            {inc.approvedCount} معتمد
          </span>
        </div>

        {/* Visits */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition shadow-md"
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">الزيارات</span>
          <div className="text-2xl font-black text-white">{agentVisits.length}</div>
          <span className="text-[10px] text-sky-400 block font-medium">زيارة موثقة</span>
        </div>

        {/* Incentive */}
        <div 
          onClick={() => onNavigateTab('profile')}
          className="bg-gradient-to-b from-orange-950/40 to-slate-900/90 hover:bg-slate-850 p-3 rounded-2xl border border-orange-600/40 text-center cursor-pointer transition shadow-md"
        >
          <span className="text-[11px] font-semibold text-orange-300 block mb-1">الحافز</span>
          <div className="text-2xl font-black text-orange-400">{inc.grandTotalSAR}</div>
          <span className="text-[10px] text-orange-300/80 block font-medium">ريال سعودي</span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            المستهدف الشهري (300 موقع)
          </span>
          <span className="text-amber-400 font-bold font-mono">
            {inc.approvedCount} / {settings.minTargetSites} موقع ({inc.progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, inc.progressPercent)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>قيمة الموقع المعتمد: {settings.ratePerApprovedSiteSAR} ر.س</span>
          {inc.approvedCount >= settings.minTargetSites ? (
            <span className="text-emerald-400 font-bold">🎉 حققت المستهدف! (+{settings.targetBonusSAR} ر.س مكافأة)</span>
          ) : (
            <span>متبقٍ {settings.minTargetSites - inc.approvedCount} موقع لتحقيق البونص</span>
          )}
        </div>
      </div>

      {/* Smart Alerts Section: 🔔 تنبيهات */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <h3 className="font-bold text-sm text-white">التنبيهات والتذكيرات الذكية</h3>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-0.5"
          >
            <span>عرض الكل ({expiringSites.length + civilDefenseSites.length + followUpSites.length})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority Card 1: Critical Contract Expiry */}
        {expiringSites.length > 0 ? (
          <div className="space-y-2">
            {expiringSites.slice(0, 2).map(({ site, badge, days }) => (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-2 ${
                  days <= 7
                    ? 'bg-red-950/40 border-red-600/70 hover:bg-red-950/60'
                    : days <= 30
                    ? 'bg-amber-950/30 border-amber-600/60 hover:bg-amber-950/50'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badge?.badgeClass}`}>
                    {badge?.text}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    ينتهي: {site.contract.endDate}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{site.name}</h4>
                  <p className="text-xs text-slate-400">
                    شركة الصيانة الحالية: {site.contract.companyName || 'منافس'} • المسؤول: {site.managerName}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-orange-400 font-medium">فرصة تقديم عرض أوريكيت البديل</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewVisit(site);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <span>زيارة ومتابعة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            لا توجد عقود تنتهي قريباً حالياً
          </div>
        )}

        {/* Priority Card 2: Sites needing follow-up */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between hover:bg-slate-850 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
              📍
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                مواقع تحتاج متابعة ميدانية: {followUpSites.length}
              </div>
              <div className="text-xs text-slate-400">
                فرص لمتابعة العروض المقدمة وصيانة الأجهزة
              </div>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </div>

        {/* Priority Card 3: Civil Defense Visit Approaching */}
        {civilDefenseSites.length > 0 && (
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                زيارة دفاع مدني قادمة: {civilDefenseSites[0].site.name}
              </span>
              <span className="text-amber-400 font-bold">
                خلال {civilDefenseSites[0].days} يوم
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              العميل بحاجة لتجهيز عقد صيانة معتمد وتجديد الطفايات قبل التفتيش
            </p>
          </div>
        )}
      </div>

      {/* Recent Sites Added By Agent */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-sm text-white">أحدث المواقع المسجلة بواسطتك</h3>
          <button
            onClick={() => onNavigateTab('sites')}
            className="text-xs text-slate-400 hover:text-white"
          >
            عرض الكل
          </button>
        </div>

        <div className="space-y-2">
          {agentSites.slice(0, 3).map((site) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-slate-900/70 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                  <img
                    src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                    alt={site.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{site.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {site.type} • {site.district}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                      site.approvalStatus === 'approved'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                        : 'bg-amber-950/60 text-amber-300 border-amber-700'
                    }`}>
                      {site.approvalStatus === 'approved' ? '✓ معتمد (+1.50 ر.س)' : 'قيد المراجعة'}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
