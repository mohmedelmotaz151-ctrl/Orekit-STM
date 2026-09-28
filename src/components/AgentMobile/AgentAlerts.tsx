import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Flame, 
  Phone, 
  Calendar, 
  ChevronLeft,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Wrench,
  HelpCircle,
  FileCheck2,
  Building2
} from 'lucide-react';
import { 
  Site, 
  User, 
  ClientIncident, 
  ClientInquiry, 
  ContractRenewalRequest 
} from '../../types';
import { getDaysRemaining, getContractExpiryBadge, getExtinguisherExpiryBadge, formatDateArabic } from '../../utils/date';
import { soundNotifier } from '../../utils/soundNotifications';

interface AgentAlertsProps {
  currentUser: User;
  sites: Site[];
  incidents?: ClientIncident[];
  inquiries?: ClientInquiry[];
  renewals?: ContractRenewalRequest[];
  onSelectSite: (site: Site) => void;
  onOpenNewVisit: (site: Site) => void;
}

export const AgentAlerts: React.FC<AgentAlertsProps> = ({
  currentUser,
  sites,
  incidents = [],
  inquiries = [],
  renewals = [],
  onSelectSite,
  onOpenNewVisit,
}) => {
  // Sites added by or assigned to this agent
  const agentSites = sites.filter(
    (s) => s.createdByAgentId === currentUser.id ||
           (s.createdByAgentName && s.createdByAgentName === currentUser.name)
  );
  const agentSiteIds = new Set(agentSites.map((s) => s.id));

  // Client requests matching this agent's sites or assigned directly
  const agentIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed' && (
      i.assignedAgentId === currentUser.id ||
      (i.assignedAgentName && i.assignedAgentName === currentUser.name) ||
      agentSiteIds.has(i.siteId)
    )
  );

  const urgentIncidents = agentIncidents.filter(
    (i) => i.priority === 'urgent' || i.priority === 'high'
  );

  const agentInquiries = inquiries.filter(
    (inq) => inq.status === 'pending' && (
      inq.assignedAgentId === currentUser.id ||
      (inq.assignedAgentName && inq.assignedAgentName === currentUser.name) ||
      agentSiteIds.has(inq.siteId)
    )
  );

  const agentRenewals = renewals.filter(
    (r) => r.status === 'pending' && (
      r.assignedAgentId === currentUser.id ||
      (r.assignedAgentName && r.assignedAgentName === currentUser.name) ||
      agentSiteIds.has(r.siteId)
    )
  );

  // 1. Group contracts by countdown tier
  const contractsExpiring7Days = sites
    .filter((s) => s.contract?.hasContract === 'yes' && s.contract?.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract?.endDate || '') || 999 }))
    .filter((item) => item.days <= 7);

  const contractsExpiring30Days = sites
    .filter((s) => s.contract?.hasContract === 'yes' && s.contract?.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract?.endDate || '') || 999 }))
    .filter((item) => item.days > 7 && item.days <= 30);

  const contractsExpiring60Days = sites
    .filter((s) => s.contract?.hasContract === 'yes' && s.contract?.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract?.endDate || '') || 999 }))
    .filter((item) => item.days > 30 && item.days <= 60);

  const contractsExpiring90Days = sites
    .filter((s) => s.contract?.hasContract === 'yes' && s.contract?.endDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.contract?.endDate || '') || 999 }))
    .filter((item) => item.days > 60 && item.days <= 90);

  // 2. Civil defense visits within 30 days
  const upcomingCivilDefense = sites
    .filter((s) => s.civilDefense?.hasRecord && s.civilDefense?.nextVisitDate)
    .map((s) => ({ site: s, days: getDaysRemaining(s.civilDefense?.nextVisitDate || '') || 999 }))
    .filter((item) => item.days >= 0 && item.days <= 45)
    .sort((a, b) => a.days - b.days);

  // 3. Urgent maintenance needed
  const urgentMaintenance = sites.filter((s) => s.status === 'urgent_maintenance');

  // 4. Approved sites extinguisher expiry alert (within 30 days or expired)
  const approvedExtinguishersAlerts = sites
    .filter((s) => s.approvalStatus === 'approved' && s.extinguisherMaintenance?.expiryDate)
    .map((s) => ({
      site: s,
      days: getDaysRemaining(s.extinguisherMaintenance?.expiryDate || '') || 999,
      badge: getExtinguisherExpiryBadge(s.extinguisherMaintenance?.expiryDate),
    }))
    .filter((item) => item.days <= 45)
    .sort((a, b) => a.days - b.days);

  const totalAlerts = 
    agentIncidents.length +
    agentInquiries.length +
    agentRenewals.length +
    contractsExpiring7Days.length + 
    contractsExpiring30Days.length + 
    contractsExpiring60Days.length + 
    contractsExpiring90Days.length + 
    upcomingCivilDefense.length + 
    urgentMaintenance.length +
    approvedExtinguishersAlerts.length;

  const [isPlayingSiren, setIsPlayingSiren] = useState(false);

  const handleTriggerEmergencyAlarm = () => {
    soundNotifier.initAudio();
    setIsPlayingSiren(true);
    soundNotifier.sendEmergencyNotification({
      title: '🚨 إنذار طوارئ فوري: طلبات عملاء وتنبيهات ميدانية نشطة!',
      body: `يوجد ${totalAlerts} تنبيه عاجل (${agentIncidents.length} طلبات صيانة عملاء، و${contractsExpiring7Days.length} عقود تنتهي فوراً).`,
      urgent: true,
    });
    setTimeout(() => {
      setIsPlayingSiren(false);
    }, 4500);
  };

  return (
    <div className="space-y-5 max-w-md mx-auto pb-6">
      
      {/* Top Banner with Emergency Siren Button */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/50 p-4 rounded-3xl border border-red-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
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

        {/* Emergency Sound & Outside Notification Action */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={handleTriggerEmergencyAlarm}
            disabled={isPlayingSiren}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 ${
              isPlayingSiren
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-red-600/90 hover:bg-red-500 text-white'
            }`}
          >
            <Radio className="w-4 h-4 shrink-0" />
            <span>{isPlayingSiren ? 'جاري إطلاق صفارة الإنذار...' : 'إطلاق إنذار طوارئ صوتي 🚨'}</span>
          </button>

          <button
            onClick={() => {
              soundNotifier.requestNotificationPermission().then((perm) => {
                if (perm === 'granted') {
                  soundNotifier.sendEmergencyNotification({
                    title: '✓ تم تفعيل إشعارات أوريكيت في النظام',
                    body: 'ستصلك إنذارات الطوارئ خارج التطبيق على شاشة القفل وسطح المكتب فوراً.',
                    urgent: false,
                  });
                }
              });
            }}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1 shrink-0"
            title="تفعيل الإشعارات خارج التطبيق"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>إشعارات خارج التطبيق</span>
          </button>
        </div>
      </div>

      {/* 0. EMERGENCY CLIENT MAINTENANCE & INCIDENT REQUESTS (Urgent Alarm for Agent & Admin) */}
      {agentIncidents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              🚨 طلبات صيانة وبلاغات طوارئ من عملائك ({agentIncidents.length})
            </span>
            <span className="bg-rose-950 text-rose-300 border border-rose-600 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {urgentIncidents.length} طوارئ فورية
            </span>
          </div>

          {agentIncidents.map((incident) => {
            const isUrgent = incident.priority === 'urgent' || incident.priority === 'high';
            const targetSite = sites.find((s) => s.id === incident.siteId);

            return (
              <div
                key={incident.id}
                onClick={() => {
                  if (targetSite) onSelectSite(targetSite);
                }}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2.5 shadow-xl ${
                  isUrgent
                    ? 'bg-rose-950/60 border-rose-500 text-white animate-pulse'
                    : 'bg-amber-950/40 border-amber-600/70 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/40">
                      <Wrench className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{incident.siteName}</h4>
                      <span className="text-[11px] text-slate-300">
                        العميل: {incident.clientName} ({incident.clientPhone})
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                    isUrgent
                      ? 'bg-rose-600 text-white border-rose-400 animate-bounce'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500'
                  }`}>
                    {isUrgent ? '🚨 إنذار صيانة فوري' : '⚠️ بلاغ صيانة'}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-rose-300">{incident.title}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                    {incident.description}
                  </p>
                  {incident.locationDetails && (
                    <div className="text-[10px] text-slate-400">
                      📍 الموقع داخل المنشأة: {incident.locationDetails}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-800/40 flex items-center justify-between flex-wrap gap-2">
                  <a
                    href={`tel:${incident.clientPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال بالعميل فوراً</span>
                  </a>

                  {targetSite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewVisit(targetSite);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>بدء زيارة طوارئ للموقع</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 0.1 Client Technical Inquiries & Consultations */}
      {agentInquiries.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              استفسارات واستشارات فنية من عملائك ({agentInquiries.length})
            </span>
            <span className="text-[11px] text-sky-300 font-mono">جديد</span>
          </div>

          {agentInquiries.map((inq) => {
            const targetSite = sites.find((s) => s.id === inq.siteId);
            return (
              <div
                key={inq.id}
                onClick={() => {
                  if (targetSite) onSelectSite(targetSite);
                }}
                className="bg-sky-950/30 border border-sky-600/50 p-3.5 rounded-2xl cursor-pointer hover:bg-sky-950/40 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{inq.siteName}</h4>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold">
                    استفسار معلق
                  </span>
                </div>
                <div className="text-xs text-sky-200 font-semibold">{inq.subject}</div>
                <p className="text-xs text-slate-300 line-clamp-2">{inq.question}</p>
                <div className="pt-2 border-t border-sky-900/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{inq.clientName} ({inq.clientPhone})</span>
                  <a
                    href={`tel:${inq.clientPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sky-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>تواصل هاتفياً</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 0.2 Client Contract Renewal Requests */}
      {agentRenewals.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              طلبات تجديد عقود الصيانة من عملائك ({agentRenewals.length})
            </span>
            <span className="text-[11px] text-emerald-300 font-mono">فرصة بيع</span>
          </div>

          {agentRenewals.map((r) => {
            const targetSite = sites.find((s) => s.id === r.siteId);
            return (
              <div
                key={r.id}
                onClick={() => {
                  if (targetSite) onSelectSite(targetSite);
                }}
                className="bg-emerald-950/30 border border-emerald-600/50 p-3.5 rounded-2xl cursor-pointer hover:bg-emerald-950/40 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{r.siteName}</h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    طلب تجديد {r.requestedDurationYears} سنوات
                  </span>
                </div>
                {r.notes && <p className="text-xs text-slate-300">{r.notes}</p>}
                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{r.clientName} ({r.clientPhone})</span>
                  {targetSite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewVisit(targetSite);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                    >
                      زيارة وإتمام التجديد
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                شركة الصيانة الحالية: <strong className="text-white">{site.contract?.companyName || 'منافس'}</strong>
                <span className="block text-[11px] text-slate-400">تاريخ الانتهاء: {site.contract?.endDate || 'غير محدد'} • المسؤول: {site.managerName}</span>
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
                الشركة: {site.contract?.companyName || 'شركة أخرى'} • {site.city} - {site.district}
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
                تاريخ الزيارة المقررة: {formatDateArabic(site.civilDefense?.nextVisitDate || '')} • تقرير: {site.civilDefense?.reportNumber || 'غير مسجل'}
              </p>

              {site.civilDefense?.notes && (
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
                الإنذار: {site.equipment?.alarmSystem?.working ? 'يعمل' : 'معطل بحاجة إصلاح'} • الطفايات: {site.equipment?.extinguishers?.totalCount || 0} طفاية
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 5. Approved Sites Fire Extinguisher Expiry Alerts */}
      {approvedExtinguishersAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <span>🧯</span>
              صلاحية طفايات المواقع المعتمدة (تعبئة وتجديد)
            </span>
            <span className="text-xs font-bold text-orange-400">{approvedExtinguishersAlerts.length}</span>
          </div>

          {approvedExtinguishersAlerts.map(({ site, days, badge }) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="bg-orange-950/20 border border-orange-600/50 p-3.5 rounded-2xl cursor-pointer hover:bg-orange-950/30 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{site.name}</h4>
                  <span className="text-[10px] text-emerald-400 font-bold">✓ موقع معتمد</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge?.badgeClass}`}>
                  {days < 0 ? 'منتهية الصلاحية!' : `تنتهي خلال ${days} يوم`}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                الطفايات: <strong className="text-white">{(site.extinguisherMaintenance?.powderCount || 0) + (site.extinguisherMaintenance?.co2Count || 0) + (site.extinguisherMaintenance?.foamCount || 0) + (site.extinguisherMaintenance?.waterCount || 0) || site.equipment?.extinguishers?.totalCount || 0} طفاية</strong>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  تاريخ الانتهاء: <strong className="text-rose-400 font-mono">{site.extinguisherMaintenance?.expiryDate}</strong> • ملصق رقم: {site.extinguisherMaintenance?.certificateOrTagNumber || 'غير مسجل'}
                </span>
              </div>

              <div className="pt-2 border-t border-orange-800/40 flex items-center justify-between">
                <a
                  href={`tel:${site.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 text-xs font-bold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال بالعميل</span>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewVisit(site);
                  }}
                  className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                >
                  زيارة تعبئة وصيانة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
