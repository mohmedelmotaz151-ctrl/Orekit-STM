import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  Sparkles,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { User, Site, IncentiveSettings } from '../../types';
import { calculateAgentIncentives } from '../../utils/storage';
import { formatDateArabic } from '../../utils/date';

interface AgentIncentivesProps {
  currentUser: User;
  sites: Site[];
  settings: IncentiveSettings;
  onSelectSite: (site: Site) => void;
}

export const AgentIncentives: React.FC<AgentIncentivesProps> = ({
  currentUser,
  sites,
  settings,
  onSelectSite,
}) => {
  const inc = calculateAgentIncentives(currentUser.id, sites, settings, currentUser.name);
  const agentSites = sites.filter(
    (s) => s.createdByAgentId === currentUser.id || 
           (s.createdByAgentName && s.createdByAgentName === currentUser.name)
  );

  return (
    <div className="space-y-4 max-w-md mx-auto pb-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-orange-950/60 via-slate-900 to-slate-900 p-5 rounded-3xl border border-orange-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-lg">
              💰
            </div>
            <div>
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                نظام الحوافز والمكافآت
              </span>
              <h2 className="text-lg font-black text-white">
                محفظة حوافز {currentUser.name}
              </h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-600/20 text-orange-300 border border-orange-500/30 font-bold">
            {settings.ratePerApprovedSiteSAR} ر.س / موقع
          </span>
        </div>

        {/* Big Balance Display */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400">إجمالي الحافز المعتمد المستحق</span>
          <div className="text-4xl font-black text-orange-400 tracking-tight flex items-center justify-center gap-1.5">
            <span>{inc.grandTotalSAR}</span>
            <span className="text-base text-slate-300 font-medium">ر.س</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مواقع معتمدة من الإدارة وجاهزة للصرف</span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-0.5">قيد المراجعة الإدارية</span>
            <strong className="text-amber-400 font-bold text-base block">{inc.pendingPotentialSAR} ر.س</strong>
            <span className="text-[10px] text-slate-500">({inc.pendingCount} موقع)</span>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-0.5">مواقع معتمدة</span>
            <strong className="text-emerald-400 font-bold text-base block">{inc.approvedCount} موقع</strong>
            <span className="text-[10px] text-slate-500">تم تدقيقها</span>
          </div>
        </div>
      </div>

      {/* Target Progress & Incentive Tier Simulation */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">خطة المستهدف الشهري</h3>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {inc.approvedCount} / {settings.minTargetSites} موقع
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, inc.progressPercent)}%` }}
          />
        </div>

        <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-850 text-xs text-slate-300 space-y-2">
          <div className="flex justify-between items-center">
            <span>مستوى 1: عند تسجيل 300 موقع</span>
            <span className="font-bold text-amber-400">300 × {settings.ratePerApprovedSiteSAR} = 450 ر.س</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>مستوى 2: عند تسجيل 500 موقع</span>
            <span className="font-bold text-orange-400">500 × {settings.ratePerApprovedSiteSAR} = 750 ر.س</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            💡 <strong>آلية منع التلاعب:</strong> لا يحتسب الحافز بمجرد الضغط على حفظ؛ بل يقوم المشرف والمدير بمراجعة الموقع الجغرافي والصور قبل الاعتماد النهائي.
          </div>
        </div>
      </div>

      {/* Audit Log of Sites */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-sm text-white">سجل المواقع وحالة الحافز</h3>
          <span className="text-xs text-slate-400">{agentSites.length} سجل</span>
        </div>

        <div className="space-y-2">
          {agentSites.map((site) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-slate-900/80 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  site.approvalStatus === 'approved'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : site.approvalStatus === 'pending'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {site.approvalStatus === 'approved' ? '✓' : site.approvalStatus === 'pending' ? '⏳' : '✕'}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{site.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    تاريخ التسجيل: {formatDateArabic(site.createdAt)}
                  </p>
                </div>
              </div>

              <div className="text-left">
                <div className={`text-xs font-bold ${
                  site.approvalStatus === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  +{site.incentiveAmount || settings.ratePerApprovedSiteSAR} ر.س
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {site.approvalStatus === 'approved' ? 'معتمد' : 'مراجعة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
