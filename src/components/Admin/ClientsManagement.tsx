import React, { useState } from 'react';
import { 
  User, 
  Site, 
  ClientIncident, 
  ClientInquiry, 
  ContractRenewalRequest, 
  CivilDefenseInspectionAlert,
  SAUDI_CITIES
} from '../../types';
import { 
  Users, 
  Building2, 
  Phone, 
  PlusCircle, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Key, 
  Lock, 
  Search, 
  X, 
  MessageCircle, 
  Edit3, 
  Power, 
  Check, 
  UserCheck, 
  UserX,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { formatDateArabic } from '../../utils/date';

interface ClientsManagementProps {
  currentUser: User;
  clients: User[];
  sites: Site[];
  incidents: ClientIncident[];
  inquiries: ClientInquiry[];
  renewals: ContractRenewalRequest[];
  civilDefenseAlerts: CivilDefenseInspectionAlert[];
  onSaveClient: (client: User) => void;
  onToggleClientStatus: (clientId: string) => void;
  onUpdateIncident: (incidentId: string, updates: Partial<ClientIncident>) => void;
  onAnswerInquiry: (inquiryId: string, answer: string, answeredBy: string) => void;
  onUpdateRenewal: (renewalId: string, updates: Partial<ContractRenewalRequest>) => void;
  onSaveCDAlert: (alert: CivilDefenseInspectionAlert) => void;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({
  currentUser,
  clients,
  sites,
  incidents,
  inquiries,
  renewals,
  civilDefenseAlerts,
  onSaveClient,
  onToggleClientStatus,
  onUpdateIncident,
  onAnswerInquiry,
  onUpdateRenewal,
  onSaveCDAlert,
}) => {
  const [hubTab, setHubTab] = useState<'accounts' | 'incidents' | 'inquiries' | 'renewals' | 'defense'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');

  // Client Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('1234');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [clientCity, setClientCity] = useState('الرياض');
  const [clientSiteType, setClientSiteType] = useState<string>('مطعم');
  const [clientHasLicense, setClientHasLicense] = useState<'yes' | 'no'>('yes');
  const [clientHasContract, setClientHasContract] = useState<'yes' | 'no'>('no');

  // Response Modals
  const [answeringInquiry, setAnsweringInquiry] = useState<ClientInquiry | null>(null);
  const [inquiryAnswerText, setInquiryAnswerText] = useState('');

  const [managingIncident, setManagingIncident] = useState<ClientIncident | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [incidentStatus, setIncidentStatus] = useState<ClientIncident['status']>('in_progress');

  const [quotingRenewal, setQuotingRenewal] = useState<ContractRenewalRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState<number>(1500);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Civil defense alert edit
  const [cdSiteId, setCdSiteId] = useState('');
  const [cdDate, setCdDate] = useState('2026-10-15');
  const [isCdModalOpen, setIsCdModalOpen] = useState(false);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingClient(null);
    setClientName('');
    setClientPhone('');
    setClientUsername('');
    setClientPassword('1234');
    setSelectedSiteId('');
    setFacilityName('');
    setClientCity('الرياض');
    setClientSiteType('مطعم');
    setClientHasLicense('yes');
    setClientHasContract('no');
    setIsAccountModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (client: User) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientPhone(client.phone);
    setClientUsername(client.username);
    setClientPassword(client.password || '1234');
    setSelectedSiteId(client.siteId || '');
    setFacilityName(client.facilityName || '');
    setClientCity(client.assignedCity || 'الرياض');

    const linked = sites.find((s) => s.id === client.siteId);
    if (linked) {
      setClientSiteType(linked.type || 'مطعم');
      setClientHasLicense(linked.license?.hasLicense === 'yes' ? 'yes' : 'no');
      setClientHasContract(linked.contract?.hasContract === 'yes' ? 'yes' : 'no');
    } else {
      setClientSiteType('مطعم');
      setClientHasLicense('yes');
      setClientHasContract('no');
    }

    setIsAccountModalOpen(true);
  };

  // When selecting a site in the modal, autofill facility name and city
  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    const found = sites.find((s) => s.id === siteId);
    if (found) {
      setFacilityName(found.name);
      setClientCity(found.city);
      setClientSiteType(found.type || 'مطعم');
      setClientHasLicense(found.license?.hasLicense === 'yes' ? 'yes' : 'no');
      setClientHasContract(found.contract?.hasContract === 'yes' ? 'yes' : 'no');
      if (!clientName) setClientName(found.managerName);
      if (!clientPhone) {
        setClientPhone(found.phone);
        setClientUsername(found.phone);
      }
    }
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    const user: User = {
      id: editingClient?.id || `client_${Date.now()}`,
      name: clientName,
      phone: clientPhone,
      username: clientUsername || clientPhone,
      password: clientPassword || '1234',
      role: 'client',
      active: editingClient ? editingClient.active : true,
      siteId: selectedSiteId || undefined,
      facilityName: facilityName || (sites.find(s => s.id === selectedSiteId)?.name) || 'منشأة معتمدة',
      assignedCity: clientCity,
      targetSitesMonth: 0,
      joinedDate: editingClient?.joinedDate || new Date().toISOString().split('T')[0],
    };

    onSaveClient(user);
    setIsAccountModalOpen(false);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringInquiry || !inquiryAnswerText) return;
    onAnswerInquiry(answeringInquiry.id, inquiryAnswerText, currentUser.name);
    setAnsweringInquiry(null);
    setInquiryAnswerText('');
  };

  const handleIncidentUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingIncident) return;
    onUpdateIncident(managingIncident.id, {
      status: incidentStatus,
      adminNotes: incidentNotes,
      assignedTechnician: assignedTech,
      resolvedAt: incidentStatus === 'resolved' || incidentStatus === 'closed' ? new Date().toISOString() : undefined,
    });
    setManagingIncident(null);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingRenewal) return;
    onUpdateRenewal(quotingRenewal.id, {
      status: 'quote_sent',
      quotedPriceSAR: Number(quotePrice),
      adminResponse: quoteNotes || `تم اعتماد عرض السعر بمبلغ ${quotePrice} ريال سعودي، يرجى مراجعة العرض والتواصل للاعتماد.`,
    });
    setQuotingRenewal(null);
  };

  const handleSaveCDAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cdSiteId) return;
    const targetSite = sites.find((s) => s.id === cdSiteId);
    const alert: CivilDefenseInspectionAlert = {
      id: `cd_${cdSiteId}`,
      siteId: cdSiteId,
      siteName: targetSite?.name || 'موقع العميل',
      scheduledDate: cdDate,
      inspectionType: 'safety_compliance',
      preInspectionVisitRequested: false,
      checklistStatus: {
        extinguishersReady: true,
        alarmSystemReady: true,
        exitsAndLightingClear: true,
        pumpsReady: true,
        contractValid: true,
      },
      status: 'upcoming',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveCDAlert(alert);
    setIsCdModalOpen(false);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.facilityName && c.facilityName.toLowerCase().includes(q)) ||
      (c.assignedCity && c.assignedCity.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Overview Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-orange-500" />
            <span>إدارة حسابات العملاء وبوابة المنشآت</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وإدارة حسابات دخول عملاء المنشآت، ومتابعة بلاغات الأعطال، والاستفسارات الفنية، وتجديد العقود
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-xs shadow-xl shadow-orange-950/60 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة حساب عميل جديد</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي العملاء</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{clients.length}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {clients.filter(c => c.active).length} حساب نشط
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>بلاغات الأعطال</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            إجمالي البلاغات: {incidents.length}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>استفسارات معلقة</span>
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {inquiries.filter(i => i.status === 'pending').length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {inquiries.filter(i => i.status === 'answered').length} تم الرد عليها
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>طلبات تجديد العقود</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {renewals.filter(r => r.status === 'pending').length}
          </div>
          <span className="text-[11px] text-amber-400 mt-1 block">
            تتطلب عروض أسعار
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto gap-1">
        {[
          { id: 'accounts', label: `حسابات العملاء المسجلين (${clients.length})`, icon: Users },
          { id: 'incidents', label: `بلاغات الأعطال (${incidents.filter(i => i.status === 'pending' || i.status === 'in_progress').length} نشط)`, icon: AlertTriangle },
          { id: 'inquiries', label: `الاستفسارات الفنية (${inquiries.filter(i => i.status === 'pending').length} جديد)`, icon: HelpCircle },
          { id: 'renewals', label: `طلبات تجديد العقود (${renewals.length})`, icon: RefreshCw },
          { id: 'defense', label: 'مواعيد زيارات الدفاع المدني', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = hubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setHubTab(tab.id as any)}
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

      {/* TAB 1: CLIENT ACCOUNTS LIST */}
      {hubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم العميل، المنشأة، الجوال..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>

            <span className="text-xs text-slate-400">
              عدد الحسابات المطابقة: {filteredClients.length}
            </span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد حسابات عملاء مسجلة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                قم بالضغط على "إضافة حساب عميل جديد" لإنشاء بيانات دخول لمسؤول المنشأة وربطه بموقعه المعتمد.
              </p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة أول حساب عميل</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3.5">العميل / المنشأة</th>
                      <th className="p-3.5">اسم المستخدم وكلمة المرور</th>
                      <th className="p-3.5">رقم الجوال</th>
                      <th className="p-3.5">المدينة / الموقع المرتبط</th>
                      <th className="p-3.5 text-center">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredClients.map((client) => {
                      const linked = sites.find((s) => s.id === client.siteId);
                      return (
                        <tr key={client.id} className="hover:bg-slate-850/50 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">
                              {client.facilityName || linked?.name || 'منشأة عميل'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 flex-wrap">
                              <span>المسؤول: {client.name}</span>
                              {linked?.type && (
                                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                                  {linked.type}
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                linked?.license?.hasLicense === 'yes'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              }`}>
                                {linked?.license?.hasLicense === 'yes' ? 'مرخص' : 'بدون ترخيص'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                linked?.contract?.hasContract === 'yes'
                                  ? 'bg-orange-950 text-orange-400 border border-orange-800/60'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {linked?.contract?.hasContract === 'yes' ? 'عقد ساري' : 'بدون عقد'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-[11px]">
                            <div className="text-orange-400 font-bold">{client.username}</div>
                            <div className="text-slate-500">كلمة المرور: {client.password || '••••'}</div>
                          </td>

                          <td className="p-3.5 font-mono text-[11px]">
                            <div className="text-slate-300">{client.phone}</div>
                          </td>

                          <td className="p-3.5 text-[11px]">
                            <div className="text-slate-200">{client.assignedCity || linked?.city || 'الرياض'}</div>
                            {linked && (
                              <span className="text-[10px] text-emerald-400 block mt-0.5">
                                ✓ مربوط بموقع معتمد (كود: {linked.id.slice(0, 8)})
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => onToggleClientStatus(client.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 mx-auto ${
                                client.active
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/50'
                                  : 'bg-red-950 text-red-400 border border-red-800 hover:bg-red-900/50'
                              }`}
                            >
                              {client.active ? (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>مفعل</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3" />
                                  <span>معطل</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* WhatsApp Contact */}
                              <a
                                href={createWhatsAppUrl(
                                  client.phone,
                                  `السلام عليكم أخي ${client.name}، نرحب بك في بوابة عملاء شركة أوريكيت للسلامة. بيانات دخولك هي: اسم المستخدم: ${client.username} | كلمة المرور: ${client.password || '1234'}`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 transition"
                                title="إرسال بيانات الدخول عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>

                              {/* Edit Client */}
                              <button
                                onClick={() => handleOpenEdit(client)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="تعديل الحساب"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCIDENTS HUB */}
      {hubTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">إدارة بلاغات الأعطال الواردة من العملاء</h2>
            <span className="text-xs text-slate-400">إجمالي البلاغات: {incidents.length}</span>
          </div>

          {incidents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
              لا توجد أي بلاغات مسجلة من العملاء حتى الآن.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.map((inc) => (
                <div key={inc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-400">{inc.siteName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {inc.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{inc.title}</h3>
                      <p className="text-[11px] text-slate-500">
                        العميل: {inc.clientName} ({inc.clientPhone}) | {formatDateArabic(inc.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : inc.status === 'in_progress'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inc.status === 'resolved' ? 'تم الإصلاح' : inc.status === 'in_progress' ? 'جاري المعالجة' : 'قيد المراجعة'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                    {inc.description}
                  </p>

                  {inc.photo && (
                    <img src={inc.photo} alt="مرفق" className="w-full max-h-36 object-cover rounded-xl border border-slate-850" />
                  )}

                  {inc.adminNotes && (
                    <div className="text-xs bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/50 text-emerald-300">
                      ملاحظة الفحص: {inc.adminNotes} (الفني: {inc.assignedTechnician || 'غير محدد'})
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setManagingIncident(inc);
                        setIncidentStatus(inc.status);
                        setIncidentNotes(inc.adminNotes || '');
                        setAssignedTech(inc.assignedTechnician || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                    >
                      مباشرة وتحديث حالة البلاغ
                    </button>

                    <a
                      href={createWhatsAppUrl(
                        inc.clientPhone,
                        `السلام عليكم أخي ${inc.clientName}، بخصوص بلاغكم "${inc.title}" في منشأة "${inc.siteName}".`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>تواصل واتساب</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INQUIRIES HUB */}
      {hubTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">الاستفسارات والاستشارات الفنية الواردة</h2>
            <span className="text-xs text-slate-400">
              {inquiries.filter(i => i.status === 'pending').length} استفسار بانتظار الرد
            </span>
          </div>

          {inquiries.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
              لا توجد استفسارات فنية مسجلة من العملاء.
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-400">{inq.siteName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {inq.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{inq.subject}</h3>
                      <p className="text-[11px] text-slate-500">
                        المرسل: {inq.clientName} ({inq.clientPhone}) | {formatDateArabic(inq.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        inq.status === 'answered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inq.status === 'answered' ? '✓ تم الرد' : 'بانتظار الرد'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                    {inq.question}
                  </p>

                  {inq.answer && (
                    <div className="bg-emerald-950/40 border border-emerald-850 p-3 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-400">الرد الفني المعتمد ({inq.answeredBy}):</div>
                      <p className="text-slate-200">{inq.answer}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setAnsweringInquiry(inq);
                        setInquiryAnswerText(inq.answer || '');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{inq.answer ? 'تعديل الرد' : 'كتابة الرد الفني للعميل'}</span>
                    </button>

                    <a
                      href={createWhatsAppUrl(
                        inq.clientPhone,
                        `السلام عليكم أخي ${inq.clientName} بخصوص استفساركم "${inq.subject}".`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>رد مباشر عبر واتساب</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RENEWALS HUB */}
      {hubTab === 'renewals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">طلبات تجديد عقود صيانة السلامة</h2>
            <span className="text-xs text-slate-400">إجمالي الطلبات: {renewals.length}</span>
          </div>

          {renewals.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
              لا توجد طلبات تجديد عقود مسجلة حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {renewals.map((ren) => (
                <div key={ren.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{ren.siteName}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        مسؤول المنشأة: {ren.clientName} ({ren.clientPhone}) | المدة المطلوبة: {ren.requestedDurationYears} سنوات
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        ren.status === 'approved' || ren.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : ren.status === 'quote_sent'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {ren.status === 'approved' || ren.status === 'completed'
                        ? 'معتمد ومجدد'
                        : ren.status === 'quote_sent'
                        ? `تم إرسال العرض: ${ren.quotedPriceSAR} ر.س`
                        : 'طلب جديد معلق'}
                    </span>
                  </div>

                  {ren.notes && (
                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      ملاحظات العميل: {ren.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setQuotingRenewal(ren);
                          setQuotePrice(ren.quotedPriceSAR || 1800);
                          setQuoteNotes(ren.adminResponse || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                      >
                        إعداد وإرسال عرض السعر
                      </button>

                      <button
                        onClick={() => {
                          onUpdateRenewal(ren.id, { status: 'approved' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        اعتماد التجديد فوراً
                      </button>
                    </div>

                    <a
                      href={createWhatsAppUrl(
                        ren.clientPhone,
                        `السلام عليكم أخي ${ren.clientName}، بخصوص طلب تجديد عقد السلامة لمنشأة "${ren.siteName}"، يسرنا في شركة أوريكيت إرسال تفاصيل العرض المعتمد.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>إرسال العرض واتساب</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CIVIL DEFENSE HUB */}
      {hubTab === 'defense' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-white">جدولة وتنبيهات زيارات الدفاع المدني للمنشآت</h2>
              <p className="text-xs text-slate-400">
                حدد مواعيد التفتيش المتوقعة للعملاء ليظهر لهم العد التنازلي وقائمة التحقق الاستباقية
              </p>
            </div>
            <button
              onClick={() => setIsCdModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>جدولة موعد تفتيش لموقع</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {civilDefenseAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{alert.siteName}</h3>
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>موعد الزيارة: {formatDateArabic(alert.scheduledDate)}</span>
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    تفتيش سنوي وقائي
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-slate-400">حالة الجاهزية الاستباقية:</div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">✓ الطفايات جاهزة</span>
                    <span className="text-emerald-400">✓ الإنذار يعمل</span>
                    <span className="text-emerald-400">✓ العقد ساري</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. ADD / EDIT CLIENT ACCOUNT MODAL */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingClient ? 'تعديل بيانات حساب العميل' : 'إضافة حساب عميل جديد (بوابة المنشآت)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountSubmit} className="space-y-3.5 text-xs">
              
              {/* Optional: Link to Existing Approved Site */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">
                  ربط الموقع / المنشأة من سجل المواقع المعتمد
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- اختياري: اختر منشأة من قاعدة بيانات CRM --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}) - مسؤول: {s.managerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facility Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم المنشأة أو الشركة *</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="مثال: مطعم شواية الرياض، فندق الأندلس..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Manager Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم مسؤول المنشأة (العميل) *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="مثال: م. أحمد الغامدي"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Phone & Username */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">رقم الجوال *</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(e.target.value);
                      if (!clientUsername || clientUsername === clientPhone) {
                        setClientUsername(e.target.value);
                      }
                    }}
                    placeholder="05XXXXXXXX"
                    required
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">اسم المستخدم للدخول *</label>
                  <input
                    type="text"
                    value={clientUsername}
                    onChange={(e) => setClientUsername(e.target.value)}
                    placeholder="05XXXXXXXX"
                    required
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-left"
                  />
                </div>
              </div>

              {/* Password & City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">كلمة المرور *</label>
                  <input
                    type="text"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="1234"
                    required
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">المدينة</label>
                  <select
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    {SAUDI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Site Type, License, and Maintenance Contract Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">نوع الموقع / النشاط</label>
                  <select
                    value={clientSiteType}
                    onChange={(e) => setClientSiteType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="مطعم">مطعم</option>
                    <option value="فندق">فندق</option>
                    <option value="مستشفى">مستشفى</option>
                    <option value="مستودع">مستودع</option>
                    <option value="مصنع">مصنع</option>
                    <option value="مجمع تجاري">مجمع تجاري</option>
                    <option value="مكتب">مكتب</option>
                    <option value="مدرسة">مدرسة</option>
                    <option value="محطة وقود">محطة وقود</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">ترخيص المنشأة</label>
                  <select
                    value={clientHasLicense}
                    onChange={(e) => setClientHasLicense(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="yes">يوجد ترخيص ساري</option>
                    <option value="no">لا يوجد ترخيص</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">عقد صيانة السلامة</label>
                  <select
                    value={clientHasContract}
                    onChange={(e) => setClientHasContract(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="yes">يوجد عقد صيانة</option>
                    <option value="no">لا يوجد عقد صيانة</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/60"
                >
                  حفظ وتفعيل الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ANSWER INQUIRY MODAL */}
      {answeringInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">الرد الفني المعتمد على استفسار العميل</h3>
              <button onClick={() => setAnsweringInquiry(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-300">
              <div className="font-bold text-orange-400">{answeringInquiry.subject}</div>
              <p className="mt-1">{answeringInquiry.question}</p>
            </div>

            <form onSubmit={handleAnswerSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">نص الإفادة والرد الفني *</label>
                <textarea
                  rows={4}
                  value={inquiryAnswerText}
                  onChange={(e) => setInquiryAnswerText(e.target.value)}
                  placeholder="اكتب التوجيه الفني أو الإفادة الرسمية وفقاً لاشتراطات الدفاع المدني..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnsweringInquiry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  إرسال الرد للعميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MANAGE INCIDENT MODAL */}
      {managingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">تحديث ومباشرة بلاغ العطل</h3>
              <button onClick={() => setManagingIncident(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIncidentUpdateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">حالة البلاغ</label>
                <select
                  value={incidentStatus}
                  onChange={(e) => setIncidentStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="pending">قيد المراجعة</option>
                  <option value="in_progress">جاري المباشرة والمعالجة</option>
                  <option value="resolved">تم الإصلاح وإنهاء العطل ✓</option>
                  <option value="closed">مغلق</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم الفني المكلف</label>
                <input
                  type="text"
                  value={assignedTech}
                  onChange={(e) => setAssignedTech(e.target.value)}
                  placeholder="مثال: فني الصيانة مهند / فريق الطوارئ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">تقرير الفحص وملاحظات الإدارة للعميل</label>
                <textarea
                  rows={3}
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="مثال: تم إرسال الفني واستبدال صمام الطفاية وفحص الضغط بنجاح..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagingIncident(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  حفظ التحديثات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. QUOTE RENEWAL MODAL */}
      {quotingRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">إرسال عرض سعر تجديد العقد</h3>
              <button onClick={() => setQuotingRenewal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">قيمة العقد السنوي المقترحة (ر.س) *</label>
                <input
                  type="number"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(Number(e.target.value))}
                  placeholder="1500"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">شروط أو تفاصيل العرض</label>
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="يشمل الزيارات الدورية الربع سنوية وتوثيق منصة سلامة وشهادة الصيانة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuotingRenewal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  اعتماد وإرسال العرض للعميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CIVIL DEFENSE SCHEDULE MODAL */}
      {isCdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">جدولة موعد تفتيش الدفاع المدني لموقع</h3>
              <button onClick={() => setIsCdModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCDAlertSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اختر المنشأة / الموقع *</label>
                <select
                  value={cdSiteId}
                  onChange={(e) => setCdSiteId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="">-- اختر الموقع --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">تاريخ الزيارة المجدول *</label>
                <input
                  type="date"
                  value={cdDate}
                  onChange={(e) => setCdDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCdModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  حفظ وتفعيل التنبيه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
