import React, { useState } from 'react';
import { 
  User, 
  Site, 
  ClientIncident, 
  ClientInquiry, 
  ContractRenewalRequest, 
  CivilDefenseInspectionAlert 
} from '../../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  FileText, 
  HelpCircle, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Phone, 
  Building2, 
  PlusCircle, 
  MessageCircle, 
  Camera, 
  Send, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ShieldCheck, 
  X,
  ExternalLink,
  Layers,
  Check
} from 'lucide-react';
import { createWhatsAppUrl, ORIKET_COMPANY_PHONE } from '../../utils/whatsapp';
import { formatDateArabic, getDaysRemaining } from '../../utils/date';

interface ClientPortalProps {
  currentUser: User;
  linkedSite?: Site | null;
  incidents: ClientIncident[];
  inquiries: ClientInquiry[];
  renewals: ContractRenewalRequest[];
  civilDefenseAlerts: CivilDefenseInspectionAlert[];
  onSaveIncident: (incident: ClientIncident) => void;
  onSaveInquiry: (inquiry: ClientInquiry) => void;
  onSaveRenewal: (renewal: ContractRenewalRequest) => void;
  onSaveCDAlert?: (alert: CivilDefenseInspectionAlert) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentUser,
  linkedSite,
  incidents,
  inquiries,
  renewals,
  civilDefenseAlerts,
  onSaveIncident,
  onSaveInquiry,
  onSaveRenewal,
  onSaveCDAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'inquiries' | 'renewal' | 'defense'>('incidents');

  // Filter client-specific records
  const myIncidents = incidents.filter(
    (i) => i.clientUserId === currentUser.id || (linkedSite && i.siteId === linkedSite.id)
  );
  const myInquiries = inquiries.filter(
    (i) => i.clientUserId === currentUser.id || (linkedSite && i.siteId === linkedSite.id)
  );
  const myRenewals = renewals.filter(
    (r) => r.clientUserId === currentUser.id || (linkedSite && r.siteId === linkedSite.id)
  );
  const myCDAlert = civilDefenseAlerts.find(
    (a) => (linkedSite && a.siteId === linkedSite.id) || a.siteName === (currentUser.facilityName || linkedSite?.name)
  );

  // Modal / Form States
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentCategory, setIncidentCategory] = useState<ClientIncident['category']>('extinguisher');
  const [incidentPriority, setIncidentPriority] = useState<ClientIncident['priority']>('medium');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentPhoto, setIncidentPhoto] = useState<string>('');

  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState<ClientInquiry['category']>('safety_regulations');
  const [inquiryQuestion, setInquiryQuestion] = useState('');

  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalYears, setRenewalYears] = useState<number>(1);
  const [renewalNotes, setRenewalNotes] = useState('');

  const [preVisitRequested, setPreVisitRequested] = useState(false);

  // Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setIncidentPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle || !incidentDescription) return;

    const newTicket: ClientIncident = {
      id: `inc_${Date.now()}`,
      siteId: linkedSite?.id || currentUser.siteId || 'client_site',
      siteName: linkedSite?.name || currentUser.facilityName || 'منشأة العميل',
      clientUserId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone,
      title: incidentTitle,
      category: incidentCategory,
      priority: incidentPriority,
      description: incidentDescription,
      locationDetails: incidentLocation,
      photo: incidentPhoto || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSaveIncident(newTicket);
    setShowNewIncidentModal(false);
    setIncidentTitle('');
    setIncidentDescription('');
    setIncidentLocation('');
    setIncidentPhoto('');
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirySubject || !inquiryQuestion) return;

    const newInq: ClientInquiry = {
      id: `inq_${Date.now()}`,
      siteId: linkedSite?.id || currentUser.siteId || 'client_site',
      siteName: linkedSite?.name || currentUser.facilityName || 'منشأة العميل',
      clientUserId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone,
      subject: inquirySubject,
      category: inquiryCategory,
      question: inquiryQuestion,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSaveInquiry(newInq);
    setShowNewInquiryModal(false);
    setInquirySubject('');
    setInquiryQuestion('');
  };

  const handleSubmitRenewal = (e: React.FormEvent) => {
    e.preventDefault();

    const newRenewal: ContractRenewalRequest = {
      id: `ren_${Date.now()}`,
      siteId: linkedSite?.id || currentUser.siteId || 'client_site',
      siteName: linkedSite?.name || currentUser.facilityName || 'منشأة العميل',
      clientUserId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone,
      currentContractEndDate: linkedSite?.contract?.endDate,
      requestedDurationYears: renewalYears,
      notes: renewalNotes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSaveRenewal(newRenewal);
    setShowRenewalModal(false);
    setRenewalNotes('');
  };

  const handleRequestPreInspectionVisit = () => {
    setPreVisitRequested(true);
    // Create an urgent ticket or alert
    const newTicket: ClientIncident = {
      id: `inc_cd_${Date.now()}`,
      siteId: linkedSite?.id || currentUser.siteId || 'client_site',
      siteName: linkedSite?.name || currentUser.facilityName || 'منشأة العميل',
      clientUserId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone,
      title: 'طلب كشف استباقي عاجل قبل زيارة الدفاع المدني',
      category: 'other',
      priority: 'urgent',
      description: 'نطلب من فريق شركة أوريكيت إرسال فني متخصص لمراجعة وتدقيق أنظمة وطفايات السلامة والتأكد من مطابقتها لاشتراطات الدفاع المدني قبل الموعد المحدد.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    onSaveIncident(newTicket);
  };

  // Facility Contract Status
  const contractEndDate = linkedSite?.contract?.endDate;
  const daysRemaining = contractEndDate ? getDaysRemaining(contractEndDate) : null;
  const isContractExpiring = daysRemaining !== null && daysRemaining <= 60 && daysRemaining >= 0;
  const isContractExpired = daysRemaining !== null && daysRemaining < 0;

  // Extinguisher status
  const totalExtinguishers = linkedSite?.equipment?.extinguishers?.totalCount || 0;
  const needsExtMaintenance = linkedSite?.equipment?.extinguishers?.needsMaintenance;

  // Civil defense inspection defaults
  const inspectionDate = myCDAlert?.scheduledDate || '2026-10-15';
  const cdDays = getDaysRemaining(inspectionDate);

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Facility Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/60 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {currentUser.facilityName || linkedSite?.name || 'منشأة العميل'}
                </h1>
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/80 font-bold">
                  بوابة عميل معتمد
                </span>
                {linkedSite?.type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {linkedSite.type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  {linkedSite?.city || 'المملكة العربية السعودية'}
                  {linkedSite?.district ? ` - حي ${linkedSite.district}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  المسؤول: {currentUser.name} ({currentUser.phone})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Direct WhatsApp Support to Oriket */}
          <div className="flex items-center gap-3">
            <a
              href={createWhatsAppUrl(
                ORIKET_COMPANY_PHONE,
                `السلام عليكم، معكم ${currentUser.name} من منشأة "${currentUser.facilityName || linkedSite?.name || 'العميل'}". أرجو التواصل معي للأهمية.`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>واتساب إدارة أوريكيت</span>
            </a>
          </div>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          
          {/* Contract Status */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>عقد صيانة السلامة</span>
              <FileText className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-sm font-bold text-white">
              {isContractExpired ? (
                <span className="text-red-400 flex items-center gap-1">منتهي الصلاحية</span>
              ) : isContractExpiring ? (
                <span className="text-amber-400 flex items-center gap-1">متبقي {daysRemaining} يوم</span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">ساري ومعتمد</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {contractEndDate ? `ينتهي في: ${formatDateArabic(contractEndDate)}` : 'عقد أوريكيت السنوي'}
            </p>
          </div>

          {/* Extinguishers */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>طفايات الحريق</span>
              <Flame className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-sm font-bold text-white">
              {totalExtinguishers > 0 ? `${totalExtinguishers} طفاية مسجلة` : 'مسجلة بالنظام'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {needsExtMaintenance ? (
                <span className="text-amber-400 font-bold">تتطلب فحص وصيانة</span>
              ) : (
                <span className="text-emerald-400">جاهزة ومختومة</span>
              )}
            </p>
          </div>

          {/* Civil Defense Inspection */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>زيارة الدفاع المدني</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-white">
              {cdDays !== null && cdDays >= 0 ? `متبقي ${cdDays} يوم` : 'موعد مجدول'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {inspectionDate ? formatDateArabic(inspectionDate) : 'تفتيش وقائي'}
            </p>
          </div>

          {/* Active Incident Tickets */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>البلاغات المفتوحة</span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-sm font-bold text-white">
              {myIncidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length} بلاغ قيد المتابعة
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              إجمالي البلاغات: {myIncidents.length}
            </p>
          </div>

        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto gap-1">
        {[
          { id: 'incidents', label: `بلاغات الأعطال والصيانة (${myIncidents.length})`, icon: AlertTriangle },
          { id: 'inquiries', label: `الاستفسارات والاستشارات (${myInquiries.length})`, icon: HelpCircle },
          { id: 'renewal', label: 'طلب تجديد العقد', icon: RefreshCw },
          { id: 'defense', label: 'تنبيهات زيارات الدفاع المدني', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: INCIDENTS / FAULTS (بلاغات الأعطال والصيانة) */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">سجل بلاغات الأعطال وطلبات الصيانة</h2>
              <p className="text-xs text-slate-400">
                أرسل بلاغاً فورياً عند وجود أي عطل بأنظمة السلامة أو طفايات الحريق لمباشرته من قِبل فنيي أوريكيت
              </p>
            </div>
            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل بلاغ عطل جديد</span>
            </button>
          </div>

          {/* List of Incidents */}
          {myIncidents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-white">لا توجد بلاغات مسجلة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                جميع أنظمة ومعدات السلامة في منشأتك تعمل بكفاءة. يمكنك تسجيل أي عطل أو طلب صيانة طارئة في أي وقت.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myIncidents.map((incident) => {
                const isUrgent = incident.priority === 'urgent';
                const isHigh = incident.priority === 'high';
                return (
                  <div
                    key={incident.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isUrgent
                                ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                                : isHigh
                                ? 'bg-orange-950 text-orange-400 border border-orange-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            أولوية: {incident.priority === 'urgent' ? 'طارئ وعاجل' : incident.priority === 'high' ? 'عالي' : incident.priority === 'medium' ? 'متوسط' : 'عادي'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {incident.category === 'extinguisher' ? 'طفايات الحريق' : incident.category === 'alarm' ? 'نظام الإنذار' : incident.category === 'pumps' ? 'مضخات الحريق' : incident.category === 'sprinklers' ? 'شبكة الرشاشات' : incident.category === 'emergency_light' ? 'إنارة الطوارئ' : 'أخرى'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5">{incident.title}</h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                          incident.status === 'resolved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : incident.status === 'in_progress'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : incident.status === 'closed'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {incident.status === 'resolved' ? '✓ تم الإصلاح' : incident.status === 'in_progress' ? 'جاري المعالجة' : incident.status === 'closed' ? 'مغلق' : 'قيد المراجعة'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      {incident.description}
                    </p>

                    {incident.locationDetails && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        <span>الموقع الداخلي: {incident.locationDetails}</span>
                      </div>
                    )}

                    {incident.photo && (
                      <div>
                        <img
                          src={incident.photo}
                          alt="مرفق البلاغ"
                          className="w-full max-h-40 object-cover rounded-xl border border-slate-850"
                        />
                      </div>
                    )}

                    {incident.adminNotes && (
                      <div className="bg-emerald-950/30 border border-emerald-900/60 p-3 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>إفادة فريق أوريكيت:</span>
                        </div>
                        <p className="text-slate-300">{incident.adminNotes}</p>
                        {incident.assignedTechnician && (
                          <p className="text-[11px] text-slate-400">الفني المباشر: {incident.assignedTechnician}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                      <span>تاريخ البلاغ: {formatDateArabic(incident.createdAt)}</span>
                      <a
                        href={createWhatsAppUrl(
                          ORIKET_COMPANY_PHONE,
                          `السلام عليكم بخصوص البلاغ "${incident.title}" (كود: ${incident.id}) في منشأة "${incident.siteName}".`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>متابعة عبر واتساب</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INQUIRIES & CONSULTATIONS (الاستفسارات والاستشارات) */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">الاستفسارات والاستشارات الفنية</h2>
              <p className="text-xs text-slate-400">
                تواصل مباشرة مع استشاريي السلامة ومهندسي شركة أوريكيت للاستفسار عن اشتراطات الدفاع المدني، الأنظمة، والعقود
              </p>
            </div>
            <button
              onClick={() => setShowNewInquiryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طرح استفسار جديد</span>
            </button>
          </div>

          {myInquiries.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <HelpCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-base font-bold text-white">لا توجد استفسارات سابقة</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                لديك استفسار حول رخصة سلامة، أنواع الطفايات، أو متطلبات الدفاع المدني لمنشأتك؟ اطرح سؤالك الآن وسيجيبك فريقنا الهندسي.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                        {inquiry.category === 'safety_regulations' ? 'اشتراطات السلامة' : inquiry.category === 'civil_defense' ? 'تراخيص الدفاع المدني' : inquiry.category === 'extinguishers' ? 'مواصفات الطفايات' : inquiry.category === 'pricing' ? 'الأسعار والعقود' : 'استفسار فني'}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{inquiry.subject}</h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        inquiry.status === 'answered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inquiry.status === 'answered' ? '✓ تم الرد' : 'بانتظار الرد'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    {inquiry.question}
                  </p>

                  {inquiry.answer ? (
                    <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>رد استشاري أوريكيت ({inquiry.answeredBy || 'الإدارة الهندسية'}):</span>
                        </span>
                        {inquiry.answeredAt && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDateArabic(inquiry.answeredAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-line">{inquiry.answer}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400/90 flex items-center gap-2 bg-amber-950/20 p-2.5 rounded-xl border border-amber-900/40">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>استفسارك قيد المراجعة الفنية من قِبل مهندسي أوريكيت، سيصلك الرد هنا قريباً.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>تاريخ الطرح: {formatDateArabic(inquiry.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTRACT RENEWAL (طلب تجديد العقد) */}
      {activeTab === 'renewal' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">تجديد عقد الصيانة والسلامة المعتمد</h2>
              <p className="text-xs text-slate-400">
                جدد عقد صيانة أنظمة السلامة لمنشأتك مع شركة أوريكيت لضمان استمرار رخصة الدفاع المدني دون انقطاع
              </p>
            </div>
            <button
              onClick={() => setShowRenewalModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تقديم طلب تجديد العقد</span>
            </button>
          </div>

          {/* Current Contract Detailed Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>بيانات العقد الحالي المعتمد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-500 block">الشركة المشغلة</span>
                <span className="text-xs font-bold text-white mt-1 block">شركة أوريكيت لأنظمة السلامة</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-500 block">تاريخ بداية العقد</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {linkedSite?.contract?.startDate ? formatDateArabic(linkedSite.contract.startDate) : 'مسجل ومعتمد'}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-500 block">تاريخ نهاية العقد</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {linkedSite?.contract?.endDate ? formatDateArabic(linkedSite.contract.endDate) : 'غير محدد'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/30 to-amber-950/20 border border-orange-900/40 flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-orange-400">حالة التجديد:</span>
                <p className="text-xs text-slate-300">
                  {isContractExpired
                    ? '⚠️ العقد منتهي! يرجى تقديم طلب تجديد لتجنب إيقاف ترخيص الدفاع المدني والمخالفات.'
                    : isContractExpiring
                    ? `⚠️ العقد قارب على الانتهاء (متبقي ${daysRemaining} يوم). يُفضل تجديده الآن.`
                    : '✓ العقد ساري ومطابق لاشتراطات الدفاع المدني ومنصة سلامة.'}
                </p>
              </div>
              <a
                href={createWhatsAppUrl(
                  ORIKET_COMPANY_PHONE,
                  `السلام عليكم، أرغب في تجديد عقد الصيانة والسلامة لمنشأة "${currentUser.facilityName || linkedSite?.name}". يرجى إرسال عرض السعر المعتمد.`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تجديد فوري عبر واتساب</span>
              </a>
            </div>
          </div>

          {/* Past Renewal Requests List */}
          {myRenewals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">طلبات التجديد المقدمة سابقاً</h3>
              <div className="space-y-3">
                {myRenewals.map((renewal) => (
                  <div
                    key={renewal.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          طلب تجديد لمدة {renewal.requestedDurationYears} {renewal.requestedDurationYears === 1 ? 'سنة' : 'سنوات'}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            renewal.status === 'approved' || renewal.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : renewal.status === 'quote_sent'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {renewal.status === 'approved' || renewal.status === 'completed'
                            ? 'تم الاعتماد والتجديد'
                            : renewal.status === 'quote_sent'
                            ? `تم إرسال عرض السعر: ${renewal.quotedPriceSAR || 0} ر.س`
                            : 'قيد المراجعة وإعداد العرض'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        تاريخ الطلب: {formatDateArabic(renewal.createdAt)}
                      </span>
                    </div>

                    {renewal.adminResponse && (
                      <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850">
                        ملاحظات الإدارة: {renewal.adminResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: CIVIL DEFENSE VISITS & ALERTS (تنبيهات وزيارات الدفاع المدني) */}
      {activeTab === 'defense' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">مركز تنبيهات وجاهزية زيارات الدفاع المدني</h2>
              <p className="text-xs text-slate-400">
                متابعة مواعيد التفتيش الدوري والتحقق من الجاهزية الاستباقية لتجنب المخالفات والغرامات
              </p>
            </div>
            <button
              onClick={handleRequestPreInspectionVisit}
              disabled={preVisitRequested}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{preVisitRequested ? 'تم إرسال طلب الزيارة الاستباقية' : 'طلب كشف استباقي من فريق أوريكيت'}</span>
            </button>
          </div>

          {/* Upcoming Inspection Date Highlight */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">الموعد المتوقع لزيارة الدفاع المدني القادمة</h3>
                  <p className="text-xs text-slate-400">
                    {inspectionDate ? formatDateArabic(inspectionDate) : 'الموعد المجدول للتفتيش السنوي'}
                  </p>
                </div>
              </div>

              <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">العد التنازلي</span>
                <span className="text-lg font-black text-amber-400">
                  {cdDays !== null && cdDays >= 0 ? `${cdDays} يوم` : 'اليوم'}
                </span>
              </div>
            </div>

            {preVisitRequested && (
              <div className="bg-emerald-950/50 border border-emerald-800 p-3 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  تم تسجيل طلبك بنجاح! سيقوم مهندس شركة أوريكيت بزيارة منشأتك خلال 48 ساعة لفحص جميع الأنظمة وتجهيز التقرير.
                </span>
              </div>
            )}
          </div>

          {/* Pre-Inspection Checklist (قائمة التحقق الاستباقية للجاهزية) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>قائمة التدقيق الاستباقية لاشتراطات الدفاع المدني (Compliance Checklist)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تأكد من استيفاء هذه البنود لضمان اجتياز التفتيش بنسبة 100% وبدون أي ملحوظات
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-emerald-400">نسبة الجاهزية المتوقعة: 100%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'طفايات الحريق جاهزة ومختومة', desc: 'مجددة الصيانة، وجود ملصق الفحص الدوري ساري المفعول، وضغط المؤشر بالأخضر.', ready: true },
                { title: 'لوحة إنذار الحريق خالية من الأعطال', desc: 'لا توجد أصوات صفير أو لمبات عطل، وتعمل بالبطاريات الاحتياطية.', ready: true },
                { title: 'شبكة الرشاشات ومضخات الحريق', desc: 'محبس المياه الرئيسي مفتوح ومغلق بالسلسلة، والضغط ثابت على البار المطلوب.', ready: true },
                { title: 'لوحات مخارج الطوارئ ومسارات الهروب', desc: 'مسارات الإخلاء سالكة تماماً وخالية من البضائع أو الكراتين، ولوحات Exit مضاءة.', ready: true },
                { title: 'عقد صيانة السلامة ساري ومعتمد', desc: 'عقد صيانة معتمد من شركة أوريكيت ومسجل بمنصة سلامة التابعة للدفاع المدني.', ready: !isContractExpired },
                { title: 'مخططات السلامة وشهادة الإشغال', desc: 'وجود ملف السلامة الورقي متضمناً تقرير الصيانة الأخير ورخصة البلدية.', ready: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-start gap-3"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.ready ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {item.ready ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Guidance Note */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-orange-400">تنبيه نظامي هام لمنشآت الأعمال:</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  وفقاً للائحة التفتيش وضبط مخالفات الدفاع المدني، يُلزم المنشأة بوجود عقد صيانة سلامة ساري وموقع من شركة معتمدة كشركة أوريكيت للسلامة، وتحديث صيانة الطفايات سنوياً. في حال وجود أي ملحوظة تواصل معنا فوراً لمساعدتك في إغلاقها نظامياً.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. NEW INCIDENT MODAL */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">تسجيل بلاغ عطل أو طلب صيانة جديد</h3>
              </div>
              <button
                onClick={() => setShowNewIncidentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">عنوان البلاغ *</label>
                <input
                  type="text"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  placeholder="مثال: تسريب في خط الرشاشات أو صوت إنذار مستمر"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">نوع النظام / المعدة</label>
                  <select
                    value={incidentCategory}
                    onChange={(e) => setIncidentCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="extinguisher">طفايات الحريق</option>
                    <option value="alarm">نظام الإنذار والكواشف</option>
                    <option value="pumps">مضخات الحريق</option>
                    <option value="sprinklers">شبكة الرشاشات التلقائية</option>
                    <option value="emergency_light">إنارة الطوارئ ومخارج الهروب</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">درجة الأولوية</label>
                  <select
                    value={incidentPriority}
                    onChange={(e) => setIncidentPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="low">عادي (Low)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="high">عالي (High)</option>
                    <option value="urgent">طارئ وعاجل 🚨 (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">الموقع داخل المنشأة (اختياري)</label>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="مثال: الدور الأرضي، المستودع الرئيسي، المطبخ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">تفاصيل ووصف المشكلة *</label>
                <textarea
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="اشرح المشكلة وما تمت ملاحظته بالتفصيل لكي يتجهز الفني بالقطع المناسبة..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">صورة توضيحية للعطل (اختياري)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span>رفع صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {incidentPhoto && (
                    <span className="text-xs text-emerald-400 font-bold">✓ تم إرفاق الصورة</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/60"
                >
                  إرسال البلاغ فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. NEW INQUIRY MODAL */}
      {showNewInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">طرح استفسار أو استشارة فنية جديدة</h3>
              </div>
              <button
                onClick={() => setShowNewInquiryModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInquiry} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">عنوان أو موضوع الاستفسار *</label>
                <input
                  type="text"
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  placeholder="مثال: عدد الطفايات المطلوب لمستودع مساحته 400 م2"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">تصنيف الاستفسار</label>
                <select
                  value={inquiryCategory}
                  onChange={(e) => setInquiryCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="safety_regulations">اشتراطات السلامة والوقاية كود البناء</option>
                  <option value="civil_defense">تراخيص الدفاع المدني ومنصة سلامة</option>
                  <option value="extinguishers">مواصفات وأنواع وصيانة الطفايات</option>
                  <option value="pricing">الأسعار والعقود السنوية</option>
                  <option value="technical">استفسار فني وتشغيلي عام</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">نص السؤال والتفاصيل *</label>
                <textarea
                  rows={4}
                  value={inquiryQuestion}
                  onChange={(e) => setInquiryQuestion(e.target.value)}
                  placeholder="اكتب سؤالك بوضوح وسيقوم المهندس المختص بالرد عليك بالتفصيل..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewInquiryModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/60"
                >
                  إرسال الاستفسار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CONTRACT RENEWAL MODAL */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">تقديم طلب تجديد عقد صيانة السلامة</h3>
              </div>
              <button
                onClick={() => setShowRenewalModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRenewal} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">مدة التجديد المطلوبة</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: 'سنة واحدة' },
                    { value: 2, label: 'سنتان' },
                    { value: 3, label: '3 سنوات' },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setRenewalYears(dur.value)}
                      className={`p-3 rounded-xl border text-center font-bold transition ${
                        renewalYears === dur.value
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">ملاحظات أو طلبات خاصة (اختياري)</label>
                <textarea
                  rows={3}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  placeholder="مثال: إضافة طفايات جديدة للمستودع الجديد أو طلب فحص قبل التوقيع..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-1 text-[11px] text-slate-400">
                <span className="font-bold text-white block">مزايا تجديد العقد مع أوريكيت:</span>
                <p>• إصدار شهادة صيانة معتمدة فوراً بمنصة سلامة الإلكترونية.</p>
                <p>• زيارات فحص دورية ربع سنوية مجانية مع تقرير هندسي معتمد.</p>
                <p>• خط طوارئ 24/7 لمباشرة أعطال أنظمة الإنذار والإطفاء.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/60"
                >
                  إرسال طلب التجديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
