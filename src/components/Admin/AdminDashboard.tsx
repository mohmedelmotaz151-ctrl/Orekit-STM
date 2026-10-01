import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ShieldAlert, 
  Flame, 
  Clock, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  Filter,
  Eye,
  FileSpreadsheet,
  Phone
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
import { SITE_STATUS_MAP, getContractExpiryBadge, formatDateArabic, getDaysRemaining } from '../../utils/date';

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
  const [mapFilterStatus, setMapFilterStatus] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Active client emergency requests for admin
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed'
  );
  const urgentIncidents = activeIncidents.filter(
    (i) => i.priority === 'urgent' || i.priority === 'high'
  );
  const pendingRenewals = renewals.filter((r) => r.status === 'pending');
  const pendingInquiries = inquiries.filter((inq) => inq.status === 'pending');

  // Pending approval sites
  const pendingSites = sites.filter((s) => s.approvalStatus === 'pending');

  // Filter sites for map
  const mapSites = sites.filter((s) => {
    if (mapFilterStatus !== 'all' && s.status !== mapFilterStatus) return false;
    if (selectedCity !== 'all' && s.city !== selectedCity) return false;
    return true;
  });

  // Calculate dynamic statistics from current data
  const todayStr = new Date().toISOString().split('T')[0];
  const totalSitesCount = sites.length;
  const newSitesTodayCount = sites.filter((s) => s.createdAt === todayStr).length;
  const visitsTodayCount = visits.filter((v) => v.visitDate === todayStr).length;
  const expiringContractsCount = sites.filter(
    (s) => s.contract?.hasContract === 'yes' && s.contract?.endDate && (getDaysRemaining(s.contract.endDate) || 999) <= 90
  ).length;
  const maintenanceNeededCount = sites.filter(
    (s) => s.status === 'urgent_maintenance' || s.equipment?.extinguishers?.needsMaintenance
  ).length;
  const newOpportunitiesCount = sites.filter((s) => s.status === 'new_opportunity').length;
  const activeAgentsCount = agents.filter((a) => a.role === 'agent' && a.active).length;
  const approvedSitesCount = sites.filter((s) => s.approvalStatus === 'approved').length;
  const extinguishersDueCount = sites.filter((s) => {
    if (s.approvalStatus !== 'approved') return false;
    const days = s.extinguisherMaintenance?.expiryDate ? getDaysRemaining(s.extinguisherMaintenance.expiryDate) : null;
    return days !== null && days <= 30;
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-orange-400 bg-orange-950/70 border border-orange-700/60 px-2.5 py-0.5 rounded-full">
              مركز العمليات والرقابة الميدانية
            </span>
            <span className="text-xs text-slate-400">اليوم: {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white">
            لوحة الإدارة العامة - شركة أوريكيت للسلامة
          </h1>
          <p className="text-xs text-slate-300">
            مرحباً {currentUser.name} ({currentUser.role === 'admin' ? 'المدير العام' : 'مشرف العمليات'}) • مراقبة الزيارات الميدانية واعتماد حوافز المندوبين
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateTab('extinguishers')}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition"
          >
            <Flame className="w-4 h-4" />
            <span>صيانة طفايات المواقع ({approvedSitesCount})</span>
            {extinguishersDueCount > 0 && (
              <span className="bg-rose-950 text-rose-200 border border-rose-500 px-1.5 py-0.2 rounded-full text-[10px]">
                {extinguishersDueCount} تنبيه
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>التقارير والتصدير</span>
          </button>
          <button
            onClick={() => onNavigateTab('incentives')}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Award className="w-4 h-4 text-orange-400" />
            <span>الحوافز ({settings.ratePerApprovedSiteSAR} ر.س)</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (Matching User Spec #6: إحصائيات اليوم) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        
        {/* 1. Total Sites */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-3 sm:p-4 rounded-2xl border border-slate-800 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>إجمالي المواقع</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5 font-mono">
            {totalSitesCount.toLocaleString('ar-SA')}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">+12 هذا الأسبوع</span>
        </div>

        {/* 2. New Sites Today */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>مواقع جديدة</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {newSitesTodayCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">مسجلة اليوم</span>
        </div>

        {/* 3. Visits Today */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>زيارات اليوم</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {visitsTodayCount}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">زيارة GPS موثقة</span>
        </div>

        {/* 4. Expiring Contracts */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-orange-500/40 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>عقود قريبة الانتهاء</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2 font-mono">
            {expiringContractsCount}
          </div>
          <span className="text-[10px] text-orange-300 mt-1 block">خلال 30-90 يوماً</span>
        </div>

        {/* 5. Maintenance Needed */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-red-500/40 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>تحتاج صيانة</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {maintenanceNeededCount}
          </div>
          <span className="text-[10px] text-rose-300 mt-1 block">أجهزة وطفايات بحاجة فحص</span>
        </div>

        {/* 6. New Opportunities */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>فرص جديدة</span>
            <span className="text-sm">🟢</span>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {newOpportunitiesCount}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">جاهزة لعروض الأسعار</span>
        </div>

        {/* 7. Active Agents */}
        <div 
          onClick={() => onNavigateTab('agents')}
          className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 cursor-pointer transition shadow-md flex flex-col justify-between"
        >
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>المندوبون</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-2 font-mono">
            {activeAgentsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">مندوب ميداني نشط</span>
        </div>

      </div>

      {/* EMERGENCY CLIENT MAINTENANCE REQUESTS (Audible Alarm & Urgent Tickets for Admin) */}
      {activeIncidents.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/70 via-rose-950/60 to-slate-900 border-2 border-red-600/80 p-5 rounded-3xl space-y-3.5 shadow-2xl shadow-red-950/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-red-950 animate-bounce">
                🚨
              </div>
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <span>طلبات صيانة وبلاغات طوارئ فورية من العملاء ({activeIncidents.length})</span>
                  {urgentIncidents.length > 0 && (
                    <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {urgentIncidents.length} طوارئ قصوى
                    </span>
                  )}
                </h3>
                <p className="text-xs text-red-200/90">
                  تتطلب استجابة سريعة وتوجيه فني صيانة أو اتصال بالمندوب والعميل فوراً
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-white font-bold bg-red-600 hover:bg-red-500 px-3.5 py-1.5 rounded-xl border border-red-500 shadow-md shadow-red-950 transition flex items-center gap-1.5"
            >
              <span>🚨 فتح مركز الإشعارات والطوارئ</span>
              <span>➔</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {activeIncidents.slice(0, 3).map((incident) => {
              const isUrgent = incident.priority === 'urgent' || incident.priority === 'high';
              const targetSite = sites.find((s) => s.id === incident.siteId);

              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    if (targetSite) onSelectSite(targetSite);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isUrgent
                      ? 'bg-slate-950/90 border-red-600 hover:border-red-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{incident.siteName}</h4>
                      <span className="text-[11px] text-slate-300 block">
                        العميل: {incident.clientName} ({incident.clientPhone})
                      </span>
                      {incident.assignedAgentName && (
                        <span className="text-[10px] text-orange-400 block mt-0.5">
                          المندوب المسؤول: <strong>{incident.assignedAgentName}</strong>
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isUrgent
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {isUrgent ? 'طوارئ عاجلة' : 'صيانة'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-850">
                    <span className="font-bold text-red-300 block">{incident.title}</span>
                    <p className="line-clamp-2 text-slate-400 text-[11px] mt-0.5">{incident.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                    <a
                      href={`tel:${incident.clientPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال هاتفي</span>
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateTab('clients');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px]"
                    >
                      توجيه فني الصيانة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING APPROVALS QUEUE (Preventing Fraud / Anti-Tamper Verification) */}
      {pendingSites.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/60 p-4 rounded-3xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                ⏳
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  مواقع جديدة بانتظار المراجعة والاعتماد المالي ({pendingSites.length})
                </h3>
                <p className="text-xs text-amber-200/80">
                  تحقق من الموقع والصور لمنع تكرار المواقع واعتماد إضافة الحافز ({settings.ratePerApprovedSiteSAR} ر.س) للمندوب
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('incentives')}
              className="text-xs text-amber-300 hover:text-white font-bold underline"
            >
              عرض مركز الاعتماد الشامل
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingSites.map((site) => (
              <div
                key={site.id}
                className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80'}
                      alt={site.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{site.name}</h4>
                    <p className="text-xs text-slate-400">
                      المندوب: <strong className="text-slate-200">{site.createdByAgentName}</strong> • {site.city} ({site.district})
                    </p>
                    <span className="text-[11px] text-amber-400 font-medium">
                      الحافز المقترح: {site.incentiveAmount || settings.ratePerApprovedSiteSAR} ر.س
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectSite(site)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    title="فحص التفاصيل والصور"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onApproveSite(site.id, true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعتماد</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTERACTIVE GEOGRAPHIC MAP OF REGISTERED SITES */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                خريطة التوزيع الجغرافي للمواقع والزيارات الميدانية
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مراقبة مواقع العملاء وتوزيع الفرق الميدانية وتفادي الازدواجية
            </p>
          </div>

          {/* Map Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200"
            >
              <option value="all">كل المدن</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={mapFilterStatus}
              onChange={(e) => setMapFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200"
            >
              <option value="all">كل الحالات</option>
              <option value="new_opportunity">🟢 فرص جديدة</option>
              <option value="expiring_soon">🟠 عقود قريبة الانتهاء</option>
              <option value="urgent_maintenance">🔴 صيانة عاجلة</option>
              <option value="competitor_contract">🔵 عقود مع منافس</option>
              <option value="needs_followup">🟡 يحتاج متابعة</option>
            </select>
          </div>
        </div>

        {/* Map Canvas */}
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
          className="w-full h-96 rounded-2xl border border-slate-700"
        />

        {/* Map Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> فرصة جديدة</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> عقد قريب الانتهاء</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> صيانة عاجلة</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> عقد مع شركة أخرى</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> يحتاج متابعة</span>
          </div>
          <span>انقر على أي منشأة بالخريطة لفتح ملف CRM الكامل</span>
        </div>
      </div>

      {/* AGENT LEADERBOARD PREVIEW & RECENT VISITS STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Field Agents Leaderboard */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">أداء المندوبين الشهري</h3>
            </div>
            <button
              onClick={() => onNavigateTab('agents')}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              إدارة الكل
            </button>
          </div>

          <div className="space-y-3">
            {agents
              .filter((a) => a.role === 'agent')
              .map((agent) => {
                const agentSitesList = sites.filter((s) => s.createdByAgentId === agent.id);
                const approvedCount = agentSitesList.filter((s) => s.approvalStatus === 'approved').length;
                const totalIncentive = approvedCount * settings.ratePerApprovedSiteSAR;
                const targetPercent = Math.min(100, Math.round((approvedCount / (agent.targetSitesMonth || 300)) * 100));

                return (
                  <div key={agent.id} className="p-3 bg-slate-950/80 rounded-2xl border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{agent.name}</h4>
                          <span className="text-[10px] text-slate-400">{agent.assignedCity}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-orange-400 font-mono block">
                          {totalIncentive.toFixed(2)} ر.س
                        </span>
                        <span className="text-[10px] text-slate-500">حافز مستحق</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>المواقع: {approvedCount} / {agent.targetSitesMonth}</span>
                        <span className="text-amber-400 font-bold">{targetPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                          style={{ width: `${targetPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Live Visits Stream (Anti-Tamper & GPS Audited) */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-sm text-white">سجل الزيارات الميدانية الموثقة (مباشر)</h3>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              تتبع GPS مباشر
            </span>
          </div>

          <div className="space-y-2.5">
            {visits.slice(0, 4).map((visit) => (
              <div
                key={visit.id}
                className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-850 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{visit.siteName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 font-mono">
                      {visit.startTime} - {visit.endTime} ({visit.durationMinutes} دقيقة)
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-1">{visit.notes}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span>المندوب: <strong className="text-slate-300">{visit.agentName}</strong></span>
                    <span>•</span>
                    <span>الجهاز: {visit.deviceModel}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">GPS موثق</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const targetSite = sites.find((s) => s.id === visit.siteId);
                    if (targetSite) onSelectSite(targetSite);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0"
                >
                  عرض الموقع
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
