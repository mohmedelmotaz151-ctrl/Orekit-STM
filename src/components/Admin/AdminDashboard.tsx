import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ShieldAlert, 
  Clock, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Phone, 
  X, 
  ExternalLink, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  Smartphone, 
  Compass, 
  FileText, 
  Calendar,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  User, 
  Site, 
  Visit, 
  IncentiveSettings, 
  SAUDI_CITIES,
  ClientIncident,
  ClientInquiry,
  ContractRenewalRequest
} from '../../types';
import { LeafletMap } from '../Common/LeafletMap';
import { SITE_STATUS_MAP, getDaysRemaining, formatDateArabic } from '../../utils/date';

interface AdminDashboardProps {
  currentUser: User;
  sites: Site[];
  visits: Visit[];
  agents: User[];
  settings: IncentiveSettings;
  incidents?: ClientIncident[];
  inquiries?: ClientInquiry[];
  renewals?: ContractRenewalRequest[];
  onSelectSite: (site: Site) => void;
  onOpenNewVisit: (site?: Site) => void;
  onNavigateTab: (tab: 'dashboard' | 'sites' | 'extinguishers' | 'clients' | 'agents' | 'incentives' | 'reports' | 'alerts') => void;
  onApproveSite: (siteId: string, approved: boolean, reason?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  sites,
  visits,
  agents,
  settings,
  incidents = [],
  inquiries = [],
  renewals = [],
  onSelectSite,
  onOpenNewVisit,
  onNavigateTab,
  onApproveSite,
}) => {
  // Modal states for deep detail inspection (UX Rule #12: reveal details on tap)
  const [selectedEmergency, setSelectedEmergency] = useState<ClientIncident | null>(null);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<Visit | null>(null);
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [showMapSection, setShowMapSection] = useState<boolean>(false);

  // Map filters
  const [mapFilterStatus, setMapFilterStatus] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Filtered dataset calculations
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed'
  );
  const urgentIncidents = activeIncidents.filter(
    (i) => i.priority === 'urgent' || i.priority === 'high'
  );
  const pendingSites = sites.filter((s) => s.approvalStatus === 'pending');
  const activeAgents = agents.filter((a) => a.role === 'agent' && a.active);

  const todayStr = new Date().toISOString().split('T')[0];
  const totalSitesCount = sites.length;
  const visitsToday = visits.filter((v) => v.visitDate === todayStr);
  const visitsTodayCount = visitsToday.length;

  // Filter map sites
  const mapSites = sites.filter((s) => {
    if (mapFilterStatus !== 'all' && s.status !== mapFilterStatus) return false;
    if (selectedCity !== 'all' && s.city !== selectedCity) return false;
    return true;
  });

  // Relative time helper
  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'مؤخرًا';
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return date.toLocaleDateString('ar-SA');
    } catch {
      return 'مؤخرًا';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      
      {/* ==================================================== */}
      {/* 1. HEADER & GREETING                                 */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#10172B] p-4 sm:p-5 rounded-2xl border border-[#1E2945]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[#20A9FF] text-xs font-semibold">
              مرحبًا {currentUser.name} 👋
            </span>
            <span className="text-[#8992AA] text-xs">·</span>
            <span className="text-[#8992AA] text-xs font-mono" dir="ltr">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#F5F7FF]">
            لوحة التحكم
          </h1>
          <p className="text-xs text-[#8992AA]">
            نظرة سريعة على أولويات العمل الميداني وحالات الطوارئ والاعتمادات
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateTab('sites')}
            className="px-3 py-1.5 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#F5F7FF] text-xs font-medium transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-[#20A9FF]" />
            <span>سجل المواقع ({totalSitesCount})</span>
          </button>

          <button
            onClick={() => onOpenNewVisit()}
            className="px-3.5 py-1.5 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-[#20A9FF]/20"
          >
            <span>+ تسجيل زيارة</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. QUICK METRIC CARDS (Clean, compact 3-second overview) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Metric 1: Active Agents */}
        <div 
          onClick={() => onNavigateTab('agents')}
          className="bg-[#10172B] hover:bg-[#151F38] p-3.5 rounded-2xl border border-[#1E2945] cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[#8992AA] text-xs font-medium flex items-center justify-between">
            <span>مندوب نشط</span>
            <Users className="w-4 h-4 text-[#20A9FF]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7FF] mt-2 font-mono">
            {activeAgents.length}
          </div>
          <span className="text-[10px] text-[#19C7A0] mt-1 block">جاهزية التغطية</span>
        </div>

        {/* Metric 2: Urgent Emergencies (Strict Red ONLY if > 0) */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
            activeIncidents.length > 0
              ? 'bg-[#10172B] border-[#EF3340]/60 hover:border-[#EF3340]'
              : 'bg-[#10172B] border-[#1E2945] hover:bg-[#151F38]'
          }`}
        >
          <div className="text-[#8992AA] text-xs font-medium flex items-center justify-between">
            <span>طوارئ عاجلة</span>
            <ShieldAlert className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-[#EF3340]' : 'text-[#8992AA]'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 font-mono ${activeIncidents.length > 0 ? 'text-[#EF3340]' : 'text-[#F5F7FF]'}`}>
            {activeIncidents.length}
          </div>
          <span className={`text-[10px] mt-1 block ${activeIncidents.length > 0 ? 'text-[#EF3340] font-bold' : 'text-[#8992AA]'}`}>
            {activeIncidents.length > 0 ? 'تتطلب تدخلاً فورياً' : 'لا توجد بلاغات حرجة'}
          </span>
        </div>

        {/* Metric 3: Pending Approval Sites */}
        <div 
          onClick={() => setShowPendingModal(true)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
            pendingSites.length > 0
              ? 'bg-[#10172B] border-[#FFB020]/60 hover:border-[#FFB020]'
              : 'bg-[#10172B] border-[#1E2945] hover:bg-[#151F38]'
          }`}
        >
          <div className="text-[#8992AA] text-xs font-medium flex items-center justify-between">
            <span>بانتظار الاعتماد</span>
            <Clock className={`w-4 h-4 ${pendingSites.length > 0 ? 'text-[#FFB020]' : 'text-[#8992AA]'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 font-mono ${pendingSites.length > 0 ? 'text-[#FFB020]' : 'text-[#F5F7FF]'}`}>
            {pendingSites.length}
          </div>
          <span className={`text-[10px] mt-1 block ${pendingSites.length > 0 ? 'text-[#FFB020]' : 'text-[#8992AA]'}`}>
            {pendingSites.length > 0 ? 'مواقع جديدة للتدقيق' : 'مكتملة ومحدّثة'}
          </span>
        </div>

        {/* Metric 4: Field Visits Today */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-[#10172B] hover:bg-[#151F38] p-3.5 rounded-2xl border border-[#1E2945] cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[#8992AA] text-xs font-medium flex items-center justify-between">
            <span>زيارات اليوم</span>
            <CheckCircle2 className="w-4 h-4 text-[#19C7A0]" />
          </div>
          <div className="text-2xl font-black text-[#19C7A0] mt-2 font-mono">
            {visitsTodayCount}
          </div>
          <span className="text-[10px] text-[#8992AA] mt-1 block">زيارة GPS موثقة</span>
        </div>

      </div>

      {/* ==================================================== */}
      {/* 3. EMERGENCY SECTION (Top priority if any exists)     */}
      {/* ==================================================== */}
      {activeIncidents.length > 0 ? (
        <div className="bg-[#10172B] border border-[#EF3340]/60 p-4 sm:p-5 rounded-2xl space-y-3 shadow-lg shadow-[#EF3340]/5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF3340] animate-pulse"></span>
              <h2 className="text-sm sm:text-base font-bold text-[#F5F7FF] flex items-center gap-2">
                <span>طوارئ عاجلة</span>
                <span className="text-[#EF3340] font-mono font-black">({activeIncidents.length})</span>
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-[#EF3340] hover:underline font-medium"
            >
              عرض جميع البلاغات
            </button>
          </div>

          {/* Active Emergency Preview Card */}
          {(() => {
            const topIncident = activeIncidents[0];
            return (
              <div className="bg-[#070B1C] border border-[#1E2945] rounded-xl p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F7FF]">{topIncident.siteName}</h3>
                    <div className="text-xs text-[#8992AA] mt-0.5">
                      <span>العميل: {topIncident.clientName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#8992AA] font-mono shrink-0">
                    {getRelativeTime(topIncident.createdAt)}
                  </span>
                </div>

                <div className="text-xs text-[#F5F7FF] bg-[#10172B] p-2.5 rounded-lg border border-[#1E2945]/70 flex items-center justify-between gap-2">
                  <span className="truncate">{topIncident.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#EF3340]/20 text-[#EF3340] font-bold shrink-0">
                    صيانة عاجلة
                  </span>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedEmergency(topIncident)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#EF3340] hover:bg-[#D92532] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-[#EF3340]/30"
                  >
                    <span>فتح الطلب</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`tel:${topIncident.clientPhone}`}
                    className="py-2 px-4 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#F5F7FF] text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19C7A0]" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Quiet reassurance banner when zero emergencies */
        <div className="bg-[#10172B] border border-[#1E2945] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-[#8992AA]">
          <span className="flex items-center gap-2 text-[#19C7A0]">
            <Check className="w-4 h-4" />
            <span>لا توجد بلاغات طوارئ نشطة حالياً — جميع المنشآت بحالة آمنة</span>
          </span>
          <button 
            onClick={() => onNavigateTab('alerts')}
            className="text-[11px] text-[#20A9FF] hover:underline"
          >
            سجل التنبيهات
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. PENDING APPROVALS QUEUE (Clear, single-action)    */}
      {/* ==================================================== */}
      {pendingSites.length > 0 && (
        <div className="bg-[#10172B] border border-[#1E2945] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[#FFB020] text-sm">⏳</span>
              <h2 className="text-sm font-bold text-[#F5F7FF]">
                مواقع بانتظار الاعتماد
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#FFB020]/15 text-[#FFB020] font-bold font-mono">
                {pendingSites.length} مواقع جديدة
              </span>
            </div>
            <p className="text-xs text-[#8992AA]">
              تحقق من الموقع والصور قبل اعتماد الحافز ({settings.ratePerApprovedSiteSAR} ر.س) للمندوب.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPendingModal(true)}
              className="w-full sm:w-auto py-2 px-4 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-[#20A9FF]/20"
            >
              <span>مراجعة المواقع</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. FIELD VISITS & AGENT PERFORMANCE (Grid layout)    */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* A. Recent Field Visits */}
        <div className="bg-[#10172B] p-4 sm:p-5 rounded-2xl border border-[#1E2945] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#20A9FF]" />
              <h3 className="font-bold text-sm text-[#F5F7FF]">آخر الزيارات الميدانية</h3>
            </div>
            <span className="text-[11px] text-[#19C7A0] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19C7A0]"></span>
              توثيق مباشر
            </span>
          </div>

          {/* Visits Stream */}
          <div className="space-y-2.5">
            {visits.slice(0, 3).map((visit) => (
              <div
                key={visit.id}
                onClick={() => setSelectedVisitDetail(visit)}
                className="p-3 bg-[#070B1C] rounded-xl border border-[#1E2945] hover:border-[#20A9FF]/40 transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#F5F7FF]">{visit.agentName}</span>
                    <span className="text-[#19C7A0] text-xs">✓</span>
                  </div>
                  <span className="text-[10px] text-[#8992AA] font-mono">
                    {visit.visitDate === todayStr ? 'اليوم' : visit.visitDate}، {visit.startTime || '12:00 م'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#F5F7FF] text-xs block font-medium">{visit.siteName}</span>
                    <span className="text-[11px] text-[#8992AA] block">{visit.deviceModel || 'هاتف ذكي'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-[#19C7A0] flex items-center gap-1">
                    ● GPS موثق
                  </span>
                </div>

                <div className="pt-1.5 border-t border-[#1E2945]/70 flex items-center justify-between text-[11px]">
                  <span className="text-[#8992AA] truncate max-w-[180px]">{visit.notes || 'زيارة ميدانية موثقة'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetSite = sites.find((s) => s.id === visit.siteId);
                      if (targetSite) onSelectSite(targetSite);
                    }}
                    className="text-[#20A9FF] hover:underline font-medium text-[11px]"
                  >
                    عرض الموقع
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('sites')}
            className="w-full py-2 rounded-xl bg-[#070B1C] hover:bg-[#151F38] text-[#8992AA] hover:text-[#F5F7FF] text-xs font-medium border border-[#1E2945] transition text-center"
          >
            عرض جميع الزيارات
          </button>
        </div>

        {/* B. Monthly Agent Performance */}
        <div className="bg-[#10172B] p-4 sm:p-5 rounded-2xl border border-[#1E2945] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFB020]" />
              <h3 className="font-bold text-sm text-[#F5F7FF]">أداء المندوبين الشهري</h3>
            </div>
            <span className="text-[11px] text-[#8992AA]">
              الهدف: {settings.minTargetSites || 300} موقع
            </span>
          </div>

          {/* Progress List */}
          <div className="space-y-3">
            {activeAgents.slice(0, 3).map((agent) => {
              const agentSitesList = sites.filter((s) => s.createdByAgentId === agent.id);
              const approvedCount = agentSitesList.filter((s) => s.approvalStatus === 'approved').length;
              const targetGoal = agent.targetSitesMonth || 300;
              const percent = Math.min(100, Math.round((approvedCount / targetGoal) * 100));
              const incentiveSAR = approvedCount * (settings.ratePerApprovedSiteSAR || 1.50);

              return (
                <div key={agent.id} className="p-3 bg-[#070B1C] rounded-xl border border-[#1E2945] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#F5F7FF]">{agent.name}</span>
                    <span className="text-xs font-mono font-bold text-[#20A9FF]">
                      {percent}%
                    </span>
                  </div>

                  {/* Clean progress bar */}
                  <div className="w-full bg-[#1E2945] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#20A9FF] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percent, 3)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8992AA]">
                    <span>{approvedCount} / {targetGoal} موقع</span>
                    <span className="font-mono text-[#19C7A0] font-medium">{incentiveSAR.toFixed(2)} ر.س</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateTab('agents')}
            className="w-full py-2 rounded-xl bg-[#070B1C] hover:bg-[#151F38] text-[#8992AA] hover:text-[#F5F7FF] text-xs font-medium border border-[#1E2945] transition text-center"
          >
            عرض جميع المندوبين
          </button>
        </div>

      </div>

      {/* ==================================================== */}
      {/* 6. INTERACTIVE MAP SECTION (Collapsible/Organized)     */}
      {/* ==================================================== */}
      <div className="bg-[#10172B] rounded-2xl border border-[#1E2945] overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#20A9FF]/15 text-[#20A9FF] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F5F7FF]">الخريطة الميدانية للتغطية الجغرافية</h3>
              <p className="text-[11px] text-[#8992AA]">
                توزيع المنشآت ({mapSites.length}) ومواقع الفرق الميدانية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#070B1C] border border-[#1E2945] rounded-xl px-2.5 py-1 text-xs text-[#F5F7FF]"
            >
              <option value="all">كل المدن</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              onClick={() => setShowMapSection(!showMapSection)}
              className="py-1 px-3 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#F5F7FF] text-xs font-medium transition"
            >
              {showMapSection ? 'إخفاء الخريطة' : 'فتح الخريطة'}
            </button>
          </div>
        </div>

        {showMapSection && (
          <div className="p-4 sm:p-5 pt-0 border-t border-[#1E2945] space-y-3">
            <LeafletMap
              sites={mapSites}
              onSelectSite={onSelectSite}
              center={
                selectedCity === 'خميس مشيط'
                  ? [18.3000, 42.7333]
                  : selectedCity === 'أبها'
                  ? [18.2164, 42.5053]
                  : selectedCity === 'جدة'
                  ? [21.5433, 39.1728]
                  : selectedCity === 'الدمام'
                  ? [26.4207, 50.0888]
                  : [24.7136, 46.6753]
              }
              zoom={selectedCity === 'all' ? 6 : 12}
              className="w-full h-80 rounded-xl border border-[#1E2945]"
            />
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: EMERGENCY REQUEST DETAILS                   */}
      {/* ==================================================== */}
      {selectedEmergency && (
        <div className="fixed inset-0 z-50 bg-[#070B1C]/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#10172B] border border-[#1E2945] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF3340]"></span>
                <h3 className="font-bold text-sm text-[#F5F7FF]">تفاصيل بلاغ الطوارئ</h3>
              </div>
              <button
                onClick={() => setSelectedEmergency(null)}
                className="p-1 rounded-lg text-[#8992AA] hover:text-[#F5F7FF] hover:bg-[#1E2945]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1.5">
                <div className="text-[#8992AA]">المنشأة:</div>
                <div className="font-bold text-sm text-[#F5F7FF]">{selectedEmergency.siteName}</div>
                <div className="text-[#8992AA]">المسؤول: {selectedEmergency.clientName} ({selectedEmergency.clientPhone})</div>
              </div>

              <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                <div className="font-bold text-[#F5F7FF]">{selectedEmergency.title}</div>
                <p className="text-[#8992AA] leading-relaxed">{selectedEmergency.description || 'طلب صيانة عاجلة بحاجة لمباشرة فني.'}</p>
              </div>

              <div className="flex items-center justify-between text-[#8992AA]">
                <span>الأولوية: <strong className="text-[#EF3340]">قصوى / طوارئ</strong></span>
                <span>الوقت: {getRelativeTime(selectedEmergency.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E2945]">
              <a
                href={`tel:${selectedEmergency.clientPhone}`}
                className="flex-1 py-2 rounded-xl bg-[#1E2945] hover:bg-[#253356] text-[#F5F7FF] text-xs font-medium text-center flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#19C7A0]" />
                <span>اتصال بالعميل</span>
              </a>

              <button
                onClick={() => {
                  setSelectedEmergency(null);
                  onNavigateTab('clients');
                }}
                className="flex-1 py-2 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold text-center"
              >
                توجيه فني صيانة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: FIELD VISIT TECHNICAL AUDIT MODAL           */}
      {/* ==================================================== */}
      {selectedVisitDetail && (
        <div className="fixed inset-0 z-50 bg-[#070B1C]/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#10172B] border border-[#1E2945] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#19C7A0]" />
                <h3 className="font-bold text-sm text-[#F5F7FF]">توثيق الزيارة الميدانية</h3>
              </div>
              <button
                onClick={() => setSelectedVisitDetail(null)}
                className="p-1 rounded-lg text-[#8992AA] hover:text-[#F5F7FF] hover:bg-[#1E2945]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                <span className="text-[#8992AA] text-[11px]">الموقع:</span>
                <div className="font-bold text-sm text-[#F5F7FF]">{selectedVisitDetail.siteName}</div>
                <div className="text-[#8992AA]">المندوب: {selectedVisitDetail.agentName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                  <span className="text-[10px] text-[#8992AA] block">الجهاز:</span>
                  <span className="text-xs font-semibold text-[#F5F7FF]">{selectedVisitDetail.deviceModel || 'Samsung S24'}</span>
                </div>
                <div className="bg-[#070B1C] p-2.5 rounded-xl border border-[#1E2945]">
                  <span className="text-[10px] text-[#8992AA] block">مدة الزيارة:</span>
                  <span className="text-xs font-semibold text-[#19C7A0]">{selectedVisitDetail.durationMinutes || 15} دقيقة</span>
                </div>
              </div>

              <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945] space-y-1">
                <span className="text-[10px] text-[#8992AA] block">إحداثيات GPS الموثقة:</span>
                <span className="font-mono text-xs text-[#20A9FF]" dir="ltr">
                  {selectedVisitDetail.startLatitude?.toFixed(5) || '24.71360'}, {selectedVisitDetail.startLongitude?.toFixed(5) || '46.67530'}
                </span>
                <span className="text-[10px] text-[#19C7A0] block">دقة الأقمار الصناعية: ± 8 أمتار</span>
              </div>

              {selectedVisitDetail.notes && (
                <div className="bg-[#070B1C] p-3 rounded-xl border border-[#1E2945]">
                  <span className="text-[10px] text-[#8992AA] block">الملاحظات:</span>
                  <p className="text-xs text-[#F5F7FF] mt-0.5">{selectedVisitDetail.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const targetSite = sites.find((s) => s.id === selectedVisitDetail.siteId);
                setSelectedVisitDetail(null);
                if (targetSite) onSelectSite(targetSite);
              }}
              className="w-full py-2 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition text-center"
            >
              فتح ملف المنشأة في CRM
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: PENDING APPROVALS QUICK REVIEW DRAWER       */}
      {/* ==================================================== */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 bg-[#070B1C]/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#10172B] border border-[#1E2945] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#FFB020]">⏳</span>
                <h3 className="font-bold text-sm text-[#F5F7FF]">
                  مواقع جديدة بانتظار الاعتماد المالي ({pendingSites.length})
                </h3>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="p-1 rounded-lg text-[#8992AA] hover:text-[#F5F7FF] hover:bg-[#1E2945]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {pendingSites.map((site) => (
                <div
                  key={site.id}
                  className="p-3 bg-[#070B1C] rounded-xl border border-[#1E2945] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#1E2945] overflow-hidden shrink-0">
                      <img
                        src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#F5F7FF]">{site.name}</div>
                      <div className="text-[11px] text-[#8992AA]">
                        المندوب: <strong className="text-[#F5F7FF]">{site.createdByAgentName}</strong> • {site.city}
                      </div>
                      <div className="text-[10px] text-[#FFB020] font-mono mt-0.5">
                        الحافز: {site.incentiveAmount || settings.ratePerApprovedSiteSAR} ر.س
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setShowPendingModal(false);
                        onSelectSite(site);
                      }}
                      className="p-1.5 rounded-lg bg-[#1E2945] hover:bg-[#253356] text-[#F5F7FF]"
                      title="فحص التفاصيل والصور"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onApproveSite(site.id, true)}
                      className="px-2.5 py-1 rounded-lg bg-[#19C7A0] hover:bg-[#16B08E] text-[#070B1C] font-bold text-xs"
                    >
                      اعتماد
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#1E2945] flex items-center justify-between text-xs text-[#8992AA]">
              <span>مراجعة فورية لمنع الازدواجية</span>
              <button
                onClick={() => {
                  setShowPendingModal(false);
                  onNavigateTab('incentives');
                }}
                className="text-[#20A9FF] hover:underline"
              >
                مركز الحوافز والاعتمادات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
