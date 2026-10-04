import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Flame, 
  Phone, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Radio, 
  User as UserIcon, 
  Building2, 
  MapPin, 
  Calendar, 
  Wrench, 
  Eye, 
  Check, 
  X,
  Sparkles,
  Filter
} from 'lucide-react';
import { 
  User, 
  Site, 
  ClientIncident, 
  CivilDefenseInspectionAlert, 
  ContractRenewalRequest, 
  ClientInquiry,
  OrkeitServiceOrder
} from '../../types';
import { soundNotifier } from '../../utils/soundNotifications';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { formatDateArabic, getDaysRemaining } from '../../utils/date';

export interface AdminNotificationsProps {
  currentUser: User;
  sites: Site[];
  incidents: ClientIncident[];
  civilDefenseAlerts: CivilDefenseInspectionAlert[];
  renewals: ContractRenewalRequest[];
  inquiries: ClientInquiry[];
  orders?: OrkeitServiceOrder[];
  onSelectSite: (site: Site) => void;
  onUpdateIncident: (incidentId: string, updates: Partial<ClientIncident>) => void;
  onUpdateSiteStatus?: (siteId: string, status: any) => void;
  onUpdateOrder?: (orderId: string, updates: Partial<OrkeitServiceOrder>) => void;
  onOpenTracking?: (order: OrkeitServiceOrder) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  currentUser,
  sites,
  incidents,
  civilDefenseAlerts,
  renewals,
  inquiries,
  orders = [],
  onSelectSite,
  onUpdateIncident,
  onUpdateSiteStatus,
  onUpdateOrder,
  onOpenTracking,
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'orders' | 'emergency' | 'civil_defense' | 'contracts' | 'inquiries'
  >('orders');
  const [soundEnabled, setSoundEnabled] = useState(soundNotifier.isSoundEnabled());
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Quick dispatch modal state
  const [dispatchIncident, setDispatchIncident] = useState<ClientIncident | null>(null);
  const [technicianName, setTechnicianName] = useState('فني طوارئ أوريكيت الميداني');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // 1. Emergency visits & urgent maintenance requests
  const urgentIncidents = incidents.filter(
    (i) =>
      i.status !== 'resolved' &&
      i.status !== 'closed' &&
      (i.priority === 'urgent' ||
        i.priority === 'high' ||
        i.title.includes('زيارة طارئة') ||
        i.title.includes('صيانة عاجلة') ||
        i.description.includes('زيارة طارئة') ||
        i.description.includes('صيانة عاجلة'))
  );

  // Other active incidents
  const otherIncidents = incidents.filter(
    (i) =>
      i.status !== 'resolved' &&
      i.status !== 'closed' &&
      !urgentIncidents.some((u) => u.id === i.id)
  );

  // 2. Urgent maintenance sites
  const urgentMaintenanceSites = sites.filter(
    (s) => s.status === 'urgent_maintenance' || s.equipment?.extinguishers?.needsMaintenance
  );

  // 3. Expiring contracts
  const expiringContractsSites = sites.filter((s) => {
    if (s.contract?.hasContract !== 'yes' || !s.contract?.endDate) return false;
    const days = getDaysRemaining(s.contract.endDate);
    return days !== null && days <= 60;
  });

  // 4. Upcoming Civil Defense inspections
  const upcomingCDAlerts = civilDefenseAlerts.filter(
    (a) => a.status === 'upcoming' || a.preInspectionVisitRequested
  );

  // 5. Pending renewals & inquiries
  const pendingRenewals = renewals.filter((r) => r.status === 'pending');
  const pendingInquiries = inquiries.filter((inq) => inq.status === 'pending');

  // 6. Quick service orders from clients
  const pendingOrders = orders.filter((o) => !o.isReadByAdmin || o.status === 'received' || o.status === 'review');
  const unreadOrdersCount = orders.filter((o) => !o.isReadByAdmin).length;

  const totalEmergencyCount = urgentIncidents.length + urgentMaintenanceSites.length;

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundNotifier.setSoundEnabled(newState);
    if (newState) {
      soundNotifier.playChime();
    } else {
      soundNotifier.stopAlarm();
      setIsAlarmPlaying(false);
    }
  };

  const handleTestAlarm = () => {
    soundNotifier.initAudio();
    setIsAlarmPlaying(true);
    soundNotifier.playEmergencyAlarm(4);
    setTimeout(() => {
      setIsAlarmPlaying(false);
    }, 4000);
  };

  const handleStopAlarm = () => {
    soundNotifier.stopAlarm();
    setIsAlarmPlaying(false);
  };

  const handleDispatchTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchIncident) return;

    onUpdateIncident(dispatchIncident.id, {
      status: 'in_progress',
      assignedTechnician: technicianName.trim(),
      adminNotes: dispatchNotes.trim()
        ? `${dispatchIncident.adminNotes ? dispatchIncident.adminNotes + ' • ' : ''}تم توجيه الفني: ${technicianName} (${dispatchNotes})`
        : `تم توجيه الفني الميداني: ${technicianName}`,
    });

    setDispatchIncident(null);
    setDispatchNotes('');
  };

  const handleMarkResolved = (incidentId: string) => {
    onUpdateIncident(incidentId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-2 border-red-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-bold text-red-400 bg-red-950/80 border border-red-700/60 px-2.5 py-0.5 rounded-full">
                مركز إدارة الطوارئ والتنبيهات المباشرة
              </span>
              <span className="text-xs text-slate-400">· شركة أوريكيت للسلامة</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>إشعارات وبلاغات العملاء الميدانية</span>
              {urgentIncidents.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-600 text-white font-mono animate-bounce">
                  {urgentIncidents.length} بلاغ عاجل
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تصل بلاغات العملاء للزيارات الطارئة والصيانة العاجلة إلى هذه الصفحة مباشرة وبشكل فوري
              مع صوت إنذار تحذيري ونظام تتبع لسرعة إرسال الفنيين وتأكيد المعالجة.
            </p>
          </div>

          {/* Sound Alarm Controls */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {isAlarmPlaying ? (
              <button
                onClick={handleStopAlarm}
                className="py-2.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-950 animate-pulse"
              >
                <VolumeX className="w-4 h-4" />
                <span>إيقاف صوت الإنذار 🔕</span>
              </button>
            ) : (
              <button
                onClick={handleTestAlarm}
                className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-red-300 hover:text-white border border-red-700/60 text-xs font-bold transition flex items-center gap-2 shadow-md"
                title="تجربة صوت صفارة إنذار الطوارئ المعتمد"
              >
                <Radio className="w-4 h-4 text-red-400" />
                <span>اختبار صوت الإنذار 🚨</span>
              </button>
            )}

            <button
              onClick={handleToggleSound}
              className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                soundEnabled
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/70 hover:bg-emerald-900/60'
                  : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'الإنذار الصوتي مفعل' : 'الإنذار الصوتي مكتوم'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>الصوت مكتوم</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterType('orders')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterType === 'orders'
                ? 'bg-[#20A9FF] text-[#070B1C] shadow-md shadow-[#20A9FF]/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚡ طلبات الخدمات السريعة</span>
            {pendingOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                filterType === 'orders' ? 'bg-[#070B1C] text-[#20A9FF]' : 'bg-[#20A9FF] text-[#070B1C]'
              }`}>
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('emergency')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterType === 'emergency'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>🚨 زيارة طارئة وصيانة عاجلة</span>
            {totalEmergencyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[10px]">
                {totalEmergencyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            جميع الإشعارات ({incidents.length + civilDefenseAlerts.length + expiringContractsSites.length + pendingOrders.length})
          </button>

          <button
            onClick={() => setFilterType('civil_defense')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterType === 'civil_defense'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>🛡️ زيارات الدفاع المدني</span>
            {upcomingCDAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[10px]">
                {upcomingCDAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('contracts')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterType === 'contracts'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>⏳ عقود قاربت على الانتهاء</span>
            {expiringContractsSites.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[10px]">
                {expiringContractsSites.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('inquiries')}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterType === 'inquiries'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>📋 تجديد العقود والاستشارات</span>
            {pendingRenewals.length + pendingInquiries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[10px]">
                {pendingRenewals.length + pendingInquiries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* QUICK SERVICE ORDERS NOTIFICATIONS SECTION */}
      {(filterType === 'orders' || filterType === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-[#20A9FF]">⚡</span>
              <span>إشعارات طلبات الخدمات السريعة الواردة من حسابات العملاء</span>
              <span className="text-xs font-mono text-[#20A9FF]">({pendingOrders.length})</span>
            </h2>
            <span className="text-xs text-[#20A9FF] font-bold">مباشرة فورية</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">لا توجد طلبات خدمات سريعة معلقة حالياً</h3>
              <p className="text-xs text-slate-400">
                جميع طلبات العملاء تمت مراجعتها ومباشرتها بنجاح.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders.map((order) => {
                const isUnread = !order.isReadByAdmin;
                return (
                  <div
                    key={order.id}
                    className={`bg-slate-900 border-2 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between gap-4 transition ${
                      isUnread ? 'border-[#20A9FF] shadow-[#20A9FF]/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#20A9FF] via-cyan-400 to-[#19C7A0]" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/40 flex items-center gap-1.5 font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {order.date}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {order.serviceType}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-[#20A9FF]" />
                          <span>{order.siteName}</span>
                          <span className="text-slate-600">•</span>
                          <span>العميل: <strong className="text-white">{order.clientName}</strong></span>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                          <span className="text-[#20A9FF] font-bold block mb-0.5">تفاصيل الطلب:</span>
                          <p className="leading-relaxed">"{order.notes}"</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">الحالة:</span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#20A9FF]/15 text-[#20A9FF] border border-[#20A9FF]/30">
                          {order.statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                      {onOpenTracking && (
                        <button
                          onClick={() => onOpenTracking(order)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <span>متابعة مراحل الطلب</span>
                        </button>
                      )}

                      <a
                        href={`tel:${order.clientPhone}`}
                        className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اتصال</span>
                      </a>

                      <a
                        href={createWhatsAppUrl(order.clientPhone, `مرحباً ${order.clientName}، بخصوص طلبكم رقم ${order.orderNumber} (${order.serviceType}) لدى شركة أوريكيت للسلامة.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>واتساب</span>
                      </a>

                      {onUpdateOrder && (
                        <>
                          {order.status === 'received' && (
                            <button
                              onClick={() => onUpdateOrder(order.id, { status: 'in_progress', statusLabel: 'قيد التنفيذ والمتابعة', isReadByAdmin: true })}
                              className="py-2 px-3 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold hover:bg-cyan-900 transition"
                            >
                              بدء التنفيذ
                            </button>
                          )}
                          {order.status === 'in_progress' && (
                            <button
                              onClick={() => onUpdateOrder(order.id, { status: 'completed', statusLabel: 'مكتمل بنجاح', isReadByAdmin: true })}
                              className="py-2 px-3 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold hover:bg-emerald-900 transition"
                            >
                              إكمال الطلب ✓
                            </button>
                          )}
                          {isUnread && (
                            <button
                              onClick={() => onUpdateOrder(order.id, { isReadByAdmin: true })}
                              className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
                            >
                              استلام
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EMERGENCY SECTION (Top Priority) */}
      {(filterType === 'emergency' || filterType === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>بلاغات الطوارئ وزيارات الصيانة العاجلة الواردة من العملاء</span>
              <span className="text-xs font-mono text-red-400">({urgentIncidents.length})</span>
            </h2>
            <span className="text-xs text-slate-400">استجابة فورية</span>
          </div>

          {urgentIncidents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">لا توجد بلاغات طوارئ أو زيارات عاجلة معلقة حالياً</h3>
              <p className="text-xs text-slate-400">
                كافة طلبات العملاء السابقة تمت معالجتها أو تم توجيه الفنيين إليها.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentIncidents.map((incident) => {
                const targetSite = sites.find((s) => s.id === incident.siteId);
                const isInProgress = incident.status === 'in_progress';

                return (
                  <div
                    key={incident.id}
                    className="bg-slate-900 border-2 border-red-600 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between gap-4"
                  >
                    {/* Top Alert Glow Line */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse" />

                    <div className="space-y-3">
                      {/* Badge and Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-950 text-red-300 border border-red-700/80 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                          <span>🚨 زيارة طارئة / صيانة عاجلة</span>
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateArabic(incident.createdAt.split('T')[0])}</span>
                        </span>
                      </div>

                      {/* Site Name and Client Contact */}
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <span>{incident.siteName}</span>
                          {isInProgress && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                              جاري المعالجة
                            </span>
                          )}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                            <span>المسؤول: {incident.clientName}</span>
                          </span>

                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <a
                              href={`tel:${incident.clientPhone}`}
                              className="text-emerald-400 hover:underline font-mono"
                              dir="ltr"
                            >
                              {incident.clientPhone}
                            </a>
                          </span>

                          {targetSite?.city && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{targetSite.city} {targetSite.district ? `(${targetSite.district})` : ''}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fault Title and Details */}
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <span className="text-xs font-bold text-red-300 block">
                          {incident.title}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {incident.description}
                        </p>
                        {incident.locationDetails && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-850 flex items-center gap-1">
                            <span className="font-bold text-slate-300">موقع العطل بالمنشأة:</span>
                            <span>{incident.locationDetails}</span>
                          </div>
                        )}
                      </div>

                      {/* Assigned technician info if in progress */}
                      {incident.assignedTechnician && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            تم توجيه: <strong>{incident.assignedTechnician}</strong>
                            {incident.adminNotes ? ` (${incident.adminNotes})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Attached photo preview */}
                      {incident.photo && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(incident.photo || null)}
                            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض صورة العطل المرفقة من العميل</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Direct Phone Call */}
                        <a
                          href={`tel:${incident.clientPhone}`}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>

                        {/* Direct WhatsApp */}
                        <a
                          href={createWhatsAppUrl(
                            incident.clientPhone,
                            `السلام عليكم ورحمة الله وبركاته،\nمعكم إدارة شركة أوريكيت لأنظمة السلامة.\nبخصوص بلاغ الطوارئ / طلب الصيانة العاجلة لمنشأة (${incident.siteName}):\n"${incident.title}"\nتم استلام البلاغ وجاري المتابعة معك وتوجيه الفني فوراً.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-700/60 font-bold transition flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        {/* View Site on Map */}
                        {targetSite && (
                          <button
                            onClick={() => onSelectSite(targetSite)}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold transition flex items-center gap-1"
                            title="معاينة موقع المنشأة الجغرافي والبيانات"
                          >
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                            <span>الموقع</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Dispatch Technician */}
                        <button
                          onClick={() => setDispatchIncident(incident)}
                          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-950"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>توجيه فني صيانة</span>
                        </button>

                        {/* Mark Resolved */}
                        <button
                          onClick={() => handleMarkResolved(incident.id)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 text-slate-300 border border-slate-700 font-bold transition flex items-center gap-1"
                          title="اعتماد اكتمال الصيانة ومعالجة البلاغ"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>إتمام</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CIVIL DEFENSE INSPECTION ALERTS */}
      {(filterType === 'civil_defense' || filterType === 'all') && upcomingCDAlerts.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>🛡️ مواعيد وتفتيش الدفاع المدني القادمة</span>
            <span className="text-xs font-mono text-orange-400">({upcomingCDAlerts.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingCDAlerts.map((alert) => {
              const targetSite = sites.find((s) => s.id === alert.siteId);
              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-400">تفتيش دفاع مدني</span>
                      <span className="text-slate-400 font-mono">{alert.scheduledDate}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{alert.siteName}</h4>
                    <p className="text-xs text-slate-300">
                      نوع الزيارة: {alert.inspectionType === 'safety_compliance' ? 'مطابقة اشتراطات السلامة' : 'فحص سنوي وتجديد رخصة'}
                    </p>
                    {alert.preInspectionVisitRequested && (
                      <span className="inline-block text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                        طلب العميل زيارة تدقيق مسبقة
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    {targetSite && (
                      <button
                        onClick={() => onSelectSite(targetSite)}
                        className="text-orange-400 hover:underline font-bold"
                      >
                        معاينة ملف المنشأة ➔
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXPIRING CONTRACTS */}
      {(filterType === 'contracts' || filterType === 'all') && expiringContractsSites.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>⏳ عقود صيانة قاربت على الانتهاء</span>
            <span className="text-xs font-mono text-orange-400">({expiringContractsSites.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringContractsSites.map((site) => {
              const days = getDaysRemaining(site.contract?.endDate || '');
              return (
                <div
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/60 transition cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-400 font-bold">{site.type}</span>
                      <span className="text-rose-400 font-bold font-mono">
                        {days !== null && days < 0 ? 'منتهي' : `متبقي ${days} يوم`}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{site.name}</h4>
                    <span className="text-xs text-slate-400 block">
                      المسؤول: {site.managerName} ({site.phone})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      تاريخ نهاية العقد: {site.contract?.endDate}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-orange-400 font-bold">
                    <span>فتح وتجديد العقد ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DISPATCH TECHNICIAN MODAL */}
      {dispatchIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">توجيه فني صيانة ميداني</h3>
                  <span className="text-xs text-slate-400">{dispatchIncident.siteName}</span>
                </div>
              </div>
              <button
                onClick={() => setDispatchIncident(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchTechnician} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم فني الصيانة المكلف *</label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  required
                  placeholder="مثال: المهندس أحمد، فني الطوارئ علي..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">ملاحظات التوجيه / رقم أمر العمل</label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  rows={3}
                  placeholder="مثال: تم الاتصال بالفني للتوجه فوراً مع حقيبة فحص الإنذار وطفايات CO2..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchIncident(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold transition shadow-lg shadow-orange-950"
                >
                  تأكيد التوجيه وتحديث الحالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-xl w-full space-y-3 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white">صورة العطل المرفقة من العميل</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={selectedPhoto}
                alt="صورة العطل"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
