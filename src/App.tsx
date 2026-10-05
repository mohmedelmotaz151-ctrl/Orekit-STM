import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredSites, 
  saveStoredSites, 
  getStoredVisits, 
  saveStoredVisits, 
  getStoredFollowups, 
  saveStoredFollowups, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredCurrentUser, 
  saveStoredCurrentUser,
  getStoredIncidents,
  saveStoredIncidents,
  getStoredInquiries,
  saveStoredInquiries,
  getStoredRenewals,
  saveStoredRenewals,
  getStoredCivilDefenseAlerts,
  saveStoredCivilDefenseAlerts,
  normalizeSite 
} from './utils/storage';
import { 
  User, 
  Site, 
  Visit, 
  FollowUpLog, 
  IncentiveSettings, 
  SiteStatus,
  ExtinguisherMaintenanceInfo,
  ClientIncident,
  ClientInquiry,
  ContractRenewalRequest,
  CivilDefenseInspectionAlert
} from './types';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { AgentHome } from './components/AgentMobile/AgentHome';
import { AgentSitesList } from './components/AgentMobile/AgentSitesList';
import { AgentAlerts } from './components/AgentMobile/AgentAlerts';
import { AgentIncentives } from './components/AgentMobile/AgentIncentives';
import { NewVisitModal } from './components/AgentMobile/NewVisitModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SitesManagement } from './components/Admin/SitesManagement';
import { ExtinguishersManagement } from './components/Admin/ExtinguishersManagement';
import { AgentsManagement } from './components/Admin/AgentsManagement';
import { ClientsManagement } from './components/Admin/ClientsManagement';
import { IncentivesManagement } from './components/Admin/IncentivesManagement';
import { ReportsManagement } from './components/Admin/ReportsManagement';
import { AdminNotifications } from './components/Admin/AdminNotifications';
import { SiteDetailModal } from './components/Admin/SiteDetailModal';
import { ClientPortal } from './components/ClientPortal/ClientPortal';
import { LeafletMap } from './components/Common/LeafletMap';
import { EmergencyAlarmBar } from './components/Common/EmergencyAlarmBar';
import { MobileAppModeBanner } from './components/Common/MobileAppModeBanner';
import { OfflineIndicator } from './components/Common/OfflineIndicator';
import { AppModulesHub } from './components/NavigationHub/AppModulesHub';
import { VerticalScrollControl } from './components/Common/VerticalScrollControl';
import { AndroidTopBar } from './components/AndroidApp/AndroidTopBar';
import { AndroidBottomNav, AndroidTabType } from './components/AndroidApp/AndroidBottomNav';
import { AndroidHomeScreen } from './components/AndroidApp/AndroidHomeScreen';
import { AndroidServicesScreen } from './components/AndroidApp/AndroidServicesScreen';
import { AndroidOrdersScreen } from './components/AndroidApp/AndroidOrdersScreen';
import { AndroidNotificationsScreen } from './components/AndroidApp/AndroidNotificationsScreen';
import { AndroidProfileScreen } from './components/AndroidApp/AndroidProfileScreen';
import { AndroidTrackingModal } from './components/AndroidApp/AndroidTrackingModal';
import { getStoredOrders, saveStoredOrders } from './utils/storage';
import { OrkeitServiceOrder } from './types';
import { soundNotifier } from './utils/soundNotifications';
import { getDaysRemaining } from './utils/date';
import { 
  fetchDatabaseData,
  apiSaveUser,
  apiToggleUser,
  apiSaveSite,
  apiApproveSite,
  apiUpdateSiteStatus,
  apiSaveVisit,
  apiSaveFollowUp,
  apiSaveSettings,
  apiSaveIncident,
  apiUpdateIncident,
  apiSaveInquiry,
  apiAnswerInquiry,
  apiSaveRenewal,
  apiUpdateRenewal,
  apiSaveCDAlert
} from './utils/api';
import {
  bootstrapFirestore,
  subscribeToSites,
  subscribeToUsers,
  subscribeToVisits,
  subscribeToFollowups,
  subscribeToSettings,
  subscribeToIncidents,
  subscribeToInquiries,
  subscribeToRenewals,
  subscribeToCDAlerts
} from './utils/firestoreService';
import { 
  Home, 
  MapPin, 
  Bell, 
  Award, 
  PlusCircle, 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet,
  Flame,
  Layers,
  Clock,
  X
} from 'lucide-react';

export default function App() {
  // Persistent data state
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredCurrentUser);
  const [sites, setSites] = useState<Site[]>(getStoredSites);
  const [visits, setVisits] = useState<Visit[]>(getStoredVisits);
  const [followups, setFollowups] = useState<FollowUpLog[]>(getStoredFollowups);
  const [settings, setSettings] = useState<IncentiveSettings>(getStoredSettings);
  const [incidents, setIncidents] = useState<ClientIncident[]>(getStoredIncidents);
  const [inquiries, setInquiries] = useState<ClientInquiry[]>(getStoredInquiries);
  const [renewals, setRenewals] = useState<ContractRenewalRequest[]>(getStoredRenewals);
  const [civilDefenseAlerts, setCivilDefenseAlerts] = useState<CivilDefenseInspectionAlert[]>(getStoredCivilDefenseAlerts);

  // View mode: 'mobile_agent' for agents, 'admin_dashboard' for admin
  const [currentViewMode, setCurrentViewMode] = useState<'mobile_agent' | 'admin_dashboard'>(
    currentUser?.role === 'admin' ? 'admin_dashboard' : 'mobile_agent'
  );

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<'home' | 'sites' | 'map' | 'alerts' | 'profile'>('home');

  // Unified Android Mobile App Navigation & Orders State
  const [activeAndroidTab, setActiveAndroidTab] = useState<AndroidTabType>('home');
  const [orders, setOrders] = useState<OrkeitServiceOrder[]>(getStoredOrders);
  const [showAdminCRM, setShowAdminCRM] = useState(false);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrkeitServiceOrder | null>(null);

  // Never expose legacy demonstration sites in the production application.
  const DEMO_SITE_IDS = new Set([
    'site_salam_mall',
    'site_shawayah_gulf',
    'site_yamama_warehouses',
    'site_palace_hotel',
  ]);

  // Admin dashboard navigation tabs
  const [adminTab, setAdminTab] = useState<'dashboard' | 'sites' | 'extinguishers' | 'agents' | 'clients' | 'incentives' | 'reports' | 'alerts'>('dashboard');
  const [isAdminMoreOpen, setIsAdminMoreOpen] = useState(false);

  // Track notified urgent incident IDs so alarm only fires once per new urgent incident
  const notifiedUrgentIncidentIdsRef = useRef<Set<string>>(new Set());

  // Navigation Hub: Opened when clicking on company logo
  const [isHubOpen, setIsHubOpen] = useState(false);

  // Modals
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [selectedSiteToVisit, setSelectedSiteToVisit] = useState<Site | null>(null);
  const [selectedSiteForDetail, setSelectedSiteForDetail] = useState<Site | null>(null);

  // Initial load and real-time cloud sync across all devices via Firestore + Server
  useEffect(() => {
    // 1. Initialize Firestore cloud database
    bootstrapFirestore();

    // 2. Real-time Firestore cloud subscriptions (instant multi-device sync)
    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        saveStoredUsers(cloudUsers);
      }
    });

    const unsubSites = subscribeToSites((cloudSites) => {
      const normalized = cloudSites.filter((site) => !DEMO_SITE_IDS.has(site.id)).map(normalizeSite);
      setSites(normalized);
      saveStoredSites(normalized);
    });

    const unsubVisits = subscribeToVisits((cloudVisits) => {
      setVisits(cloudVisits);
      saveStoredVisits(cloudVisits);
    });

    const unsubFollowups = subscribeToFollowups((cloudFollowups) => {
      setFollowups(cloudFollowups);
      saveStoredFollowups(cloudFollowups);
    });

    const unsubSettings = subscribeToSettings((cloudSettings) => {
      setSettings(cloudSettings);
      saveStoredSettings(cloudSettings);
    });

    const unsubIncidents = subscribeToIncidents((cloudIncidents) => {
      setIncidents(cloudIncidents);
      saveStoredIncidents(cloudIncidents);
    });

    const unsubInquiries = subscribeToInquiries((cloudInquiries) => {
      setInquiries(cloudInquiries);
      saveStoredInquiries(cloudInquiries);
    });

    const unsubRenewals = subscribeToRenewals((cloudRenewals) => {
      setRenewals(cloudRenewals);
      saveStoredRenewals(cloudRenewals);
    });

    const unsubCDAlerts = subscribeToCDAlerts((cloudAlerts) => {
      setCivilDefenseAlerts(cloudAlerts);
      saveStoredCivilDefenseAlerts(cloudAlerts);
    });

    // 3. Fallback server sync
    const doSync = () => {
      fetchDatabaseData().then((dbData) => {
        if (dbData) {
          if (dbData.users && dbData.users.length > 0) setUsers(dbData.users);
          if (dbData.sites) setSites(dbData.sites.filter((site) => !DEMO_SITE_IDS.has(site.id)).map(normalizeSite));
          if (dbData.visits) setVisits(dbData.visits);
          if (dbData.followups) setFollowups(dbData.followups);
          if (dbData.incidents) setIncidents(dbData.incidents);
          if (dbData.inquiries) setInquiries(dbData.inquiries);
          if (dbData.renewals) setRenewals(dbData.renewals);
          if (dbData.civilDefenseAlerts) setCivilDefenseAlerts(dbData.civilDefenseAlerts);
          if (dbData.settings) setSettings(dbData.settings);
        }
      });
    };

    doSync();
    const interval = setInterval(doSync, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        doSync();
      }
    };
    window.addEventListener('focus', doSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubUsers();
      unsubSites();
      unsubVisits();
      unsubFollowups();
      unsubSettings();
      unsubIncidents();
      unsubInquiries();
      unsubRenewals();
      unsubCDAlerts();
      clearInterval(interval);
      window.removeEventListener('focus', doSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save changes to storage whenever states change
  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    saveStoredSites(sites);
  }, [sites]);

  useEffect(() => {
    saveStoredVisits(visits);
  }, [visits]);

  useEffect(() => {
    saveStoredFollowups(followups);
  }, [followups]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredIncidents(incidents);
  }, [incidents]);

  // Ensure seamless vertical scroll position resetting on tab navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeAndroidTab, showAdminCRM, isHubOpen]);

  // Real-time Emergency Audio Alarm for System Administrator on incoming client emergency visits & urgent maintenance
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) return;

    const unhandledUrgent = incidents.filter(
      (i) =>
        i.status === 'pending' &&
        (i.priority === 'urgent' ||
          i.priority === 'high' ||
          i.title.includes('زيارة طارئة') ||
          i.title.includes('صيانة عاجلة') ||
          i.description.includes('زيارة طارئة') ||
          i.description.includes('صيانة عاجلة'))
    );

    let hasNewUrgent = false;
    let latestUrgent: ClientIncident | null = null;

    for (const inc of unhandledUrgent) {
      if (!notifiedUrgentIncidentIdsRef.current.has(inc.id)) {
        notifiedUrgentIncidentIdsRef.current.add(inc.id);
        hasNewUrgent = true;
        latestUrgent = inc;
      }
    }

    if (hasNewUrgent && latestUrgent) {
      soundNotifier.sendEmergencyNotification({
        title: `🚨 إنذار طوارئ: بلاغ عميل عاجل!`,
        body: `منشأة ${latestUrgent.siteName}: ${latestUrgent.title}`,
        urgent: true,
        tag: `urgent_${latestUrgent.id}`,
      });
    }
  }, [incidents, currentUser]);

  useEffect(() => {
    saveStoredInquiries(inquiries);
  }, [inquiries]);

  useEffect(() => {
    saveStoredRenewals(renewals);
  }, [renewals]);

  useEffect(() => {
    saveStoredCivilDefenseAlerts(civilDefenseAlerts);
  }, [civilDefenseAlerts]);

  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  // Strict visibility enforcement:
  // - Admin (مدراء النظام): Sees all sites across the entire company.
  // - Agent (المندوب): Sees ONLY the sites they added themselves (مواقع المناديب لا تظهر إلا للمندوب الذي أضافها أو لمدراء النظام).
  // - Client (العميل): Sees only their linked facility site.
  const visibleSites = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return sites;
    }
    if (currentUser.role === 'client') {
      return sites.filter((s) => s.id === currentUser.siteId || s.phone === currentUser.phone);
    }
    // Field sales agent: strictly only their added sites
    return sites.filter(
      (s) =>
        s.createdByAgentId === currentUser.id ||
        (s.createdByAgentName && currentUser.name && s.createdByAgentName.trim() === currentUser.name.trim())
    );
  }, [sites, currentUser]);

  // 1. تنبيهات العقود التي قاربت على الانتهاء
  const expiringContractsCount = useMemo(() => {
    return visibleSites.filter(
      (s) => s?.contract?.hasContract === 'yes' && s?.contract?.endDate && (getDaysRemaining(s.contract.endDate) || 999) <= 60
    ).length;
  }, [visibleSites]);

  // 2. تنبيهات الصيانة العاجلة (المواقع الحرجة وبلاغات الأعطال الطارئة)
  const urgentMaintenanceCount = useMemo(() => {
    const urgentSites = visibleSites.filter((s) => s?.status === 'urgent_maintenance').length;
    const urgentTickets = currentUser?.role === 'admin'
      ? incidents.filter((i) => (i.status !== 'resolved' && i.status !== 'closed') && (i.priority === 'urgent' || i.priority === 'high')).length
      : incidents.filter((i) => {
          if (i.status === 'resolved' || i.status === 'closed') return false;
          if (i.priority !== 'urgent' && i.priority !== 'high') return false;
          if (i.assignedAgentId === currentUser?.id || i.assignedAgentName === currentUser?.name) return true;
          const site = visibleSites.find((s) => s.id === i.siteId);
          return !!site;
        }).length;
    return urgentSites + urgentTickets;
  }, [visibleSites, incidents, currentUser]);

  // 3. تنبيهات زيارات وتفتيش الدفاع المدني
  const civilDefenseVisitsCount = useMemo(() => {
    const upcomingVisits = visibleSites.filter((s) => {
      if (s.civilDefense?.hasRecord && s.civilDefense?.nextVisitDate) {
        const days = getDaysRemaining(s.civilDefense.nextVisitDate);
        return days !== null && days >= 0 && days <= 30;
      }
      return false;
    }).length;

    const cdAlerts = civilDefenseAlerts.filter((a) => {
      if (a.status !== 'upcoming') return false;
      if (currentUser?.role === 'admin') return true;
      const site = visibleSites.find((s) => s.id === a.siteId);
      return !!site;
    }).length;

    return upcomingVisits + cdAlerts;
  }, [visibleSites, civilDefenseAlerts, currentUser]);

  // Unread quick service orders count (requests from client account)
  const unreadOrdersCount = useMemo(() => {
    return orders.filter((o) => !o.isReadByAdmin || o.status === 'received').length;
  }, [orders]);

  // 5. تنبيهات وتزكير صيانة الكفايات والطفايات (أقل من 10 أيام أو منتهية)
  const extinguishers10DaysCount = useMemo(() => {
    return visibleSites.filter((s) => {
      const ext = s.extinguisherMaintenance;
      if (!ext?.expiryDate) return false;
      const days = getDaysRemaining(ext.expiryDate);
      return days !== null && days <= 10;
    }).length;
  }, [visibleSites]);

  // Total alert count for header badges and notification centers
  const totalAlertsCount = expiringContractsCount + urgentMaintenanceCount + civilDefenseVisitsCount + unreadOrdersCount + extinguishers10DaysCount;

  // Urgent client tickets count specifically (Emergency visits & urgent maintenance)
  const urgentClientTicketsCount = useMemo(() => {
    return incidents.filter(
      (i) =>
        i.status !== 'resolved' &&
        i.status !== 'closed' &&
        (i.priority === 'urgent' ||
          i.priority === 'high' ||
          i.title.includes('زيارة طارئة') ||
          i.title.includes('صيانة عاجلة'))
    ).length;
  }, [incidents]);

  // Handlers for authentication
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentViewMode('admin_dashboard');
      setAdminTab('dashboard');
    } else {
      setCurrentViewMode('mobile_agent');
      setMobileTab('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOpenNewVisit = (siteToVisit?: Site) => {
    if (!currentUser) return;
    setSelectedSiteToVisit(siteToVisit || null);
    setIsNewVisitModalOpen(true);
  };

  const handleSaveSiteAndVisit = (newSite: Site, newVisit: Visit) => {
    if (!currentUser) return;
    const cleanSite = normalizeSite(newSite);
    setSites((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === cleanSite.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = cleanSite;
        return copy;
      }
      return [cleanSite, ...prev];
    });

    setVisits((prev) => [newVisit, ...prev]);

    const newFol: FollowUpLog = {
      id: `fol_${Date.now()}`,
      siteId: cleanSite.id,
      agentId: currentUser.id,
      agentName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      action: 'visit',
      summary: `تمت زيارة ميدانية للمنشأة (${newVisit.durationMinutes} دقيقة) - الحالة: ${newVisit.outcomeStatus}`,
    };
    setFollowups((prev) => [newFol, ...prev]);

    // Persist to central database
    apiSaveSite(cleanSite);
    apiSaveVisit(newVisit);
    apiSaveFollowUp(newFol);
  };

  const handleApproveSite = (siteId: string, approved: boolean, reason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const defaultExtMaint: ExtinguisherMaintenanceInfo = s.extinguisherMaintenance || {
            hasMaintenancePlan: true,
            lastMaintenanceDate: today,
            expiryDate: nextYearStr,
            maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
            technicianName: currentUser?.name || 'فني صيانة أوريكيت',
            certificateOrTagNumber: `EXT-${s.id.slice(-6).toUpperCase()}`,
            cylinderPressureChecked: true,
            status: 'valid',
            powderCount: s.equipment?.extinguishers?.totalCount || 0,
            co2Count: 0,
            foamCount: 0,
            waterCount: 0,
            notes: 'تم اعتماد الموقع وتفعيل خطة صيانة الطفايات وتحديد تاريخ الانتهاء',
            logs: [
              {
                id: `log_init_${Date.now()}`,
                maintenanceDate: today,
                expiryDate: nextYearStr,
                companyName: 'شركة أوريكيت للسلامة والوقاية من الحريق',
                technicianName: currentUser?.name || 'فني أوريكيت',
                certificateOrTagNumber: `EXT-${s.id.slice(-6).toUpperCase()}`,
                servicedCount: s.equipment?.extinguishers?.totalCount || 0,
                typesServiced: s.equipment?.extinguishers?.types || ['powder'],
                status: 'completed',
                notes: 'اعتماد أولي وتفعيل جدول الصيانة السنوي',
                createdAt: today,
              },
            ],
          };

          const updatedExtMaint: ExtinguisherMaintenanceInfo = {
            ...defaultExtMaint,
            hasMaintenancePlan: approved ? true : defaultExtMaint.hasMaintenancePlan,
            expiryDate: defaultExtMaint.expiryDate || nextYearStr,
            lastMaintenanceDate: defaultExtMaint.lastMaintenanceDate || today,
          };

          return {
            ...s,
            approvalStatus: approved ? 'approved' : 'rejected',
            rejectionReason: approved ? undefined : reason,
            approvedAt: approved ? today : undefined,
            approvedBy: approved ? currentUser?.name : undefined,
            incentivePaid: approved,
            extinguisherMaintenance: updatedExtMaint,
          };
        }
        return s;
      })
    );

    if (selectedSiteForDetail && selectedSiteForDetail.id === siteId) {
      setSelectedSiteForDetail((prev) => {
        if (!prev) return null;
        const defaultExtMaint: ExtinguisherMaintenanceInfo = prev.extinguisherMaintenance || {
          hasMaintenancePlan: true,
          lastMaintenanceDate: today,
          expiryDate: nextYearStr,
          maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
          technicianName: currentUser?.name || 'فني صيانة أوريكيت',
          certificateOrTagNumber: `EXT-${prev.id.slice(-6).toUpperCase()}`,
          cylinderPressureChecked: true,
          status: 'valid',
          powderCount: prev.equipment?.extinguishers?.totalCount || 0,
          co2Count: 0,
          foamCount: 0,
          waterCount: 0,
          notes: 'تم اعتماد الموقع وتفعيل خطة صيانة الطفايات وتحديد تاريخ الانتهاء',
          logs: [],
        };

        return {
          ...prev,
          approvalStatus: approved ? 'approved' : 'rejected',
          rejectionReason: approved ? undefined : reason,
          approvedAt: approved ? today : undefined,
          approvedBy: approved ? currentUser?.name : undefined,
          incentivePaid: approved,
          extinguisherMaintenance: {
            ...defaultExtMaint,
            hasMaintenancePlan: approved ? true : defaultExtMaint.hasMaintenancePlan,
            expiryDate: defaultExtMaint.expiryDate || nextYearStr,
            lastMaintenanceDate: defaultExtMaint.lastMaintenanceDate || today,
          },
        };
      });
    }

    // Persist approval to central database
    apiApproveSite(siteId, approved, reason, currentUser?.name);
  };

  const handleUpdateStatus = (siteId: string, newStatus: SiteStatus) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : s))
    );
    if (selectedSiteForDetail && selectedSiteForDetail.id === siteId) {
      setSelectedSiteForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // Persist status change to central database
    apiUpdateSiteStatus(siteId, newStatus);
  };

  const handleUpdateSiteExtinguisherMaintenance = (
    siteId: string,
    maintenance: ExtinguisherMaintenanceInfo
  ) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const updated: Site = {
            ...s,
            extinguisherMaintenance: maintenance,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          apiSaveSite(updated);
          return updated;
        }
        return s;
      })
    );

    if (selectedSiteForDetail && selectedSiteForDetail.id === siteId) {
      setSelectedSiteForDetail((prev) => {
        if (prev && prev.id === siteId) {
          return {
            ...prev,
            extinguisherMaintenance: maintenance,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return prev;
      });
    }

    const newFol: FollowUpLog = {
      id: `fol_${Date.now()}`,
      siteId,
      agentId: currentUser?.id || 'admin',
      agentName: currentUser?.name || 'الإدارة',
      date: new Date().toISOString().split('T')[0],
      action: 'note',
      summary: `تم تحديث صيانة كفايات وطفايات الحريق - تاريخ الانتهاء المعتمد: ${maintenance.expiryDate} (ملصق رقم: ${maintenance.certificateOrTagNumber})`,
    };
    setFollowups((prev) => [newFol, ...prev]);
    apiSaveFollowUp(newFol);
  };

  const handleSaveNewExtinguisherSite = (newSite: Site) => {
    const cleanSite = normalizeSite(newSite);
    setSites((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === cleanSite.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = cleanSite;
        return copy;
      }
      return [cleanSite, ...prev];
    });
    apiSaveSite(cleanSite);
  };

  const handleOrderCreated = (newOrder: OrkeitServiceOrder) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveStoredOrders(updated);
      return updated;
    });

    // Notify administration with live sound & system notification
    try {
      soundNotifier.playChime();
      soundNotifier.sendEmergencyNotification({
        title: `⚡ طلب خدمة سريعة جديد: ${newOrder.serviceType}`,
        body: `المنشأة: ${newOrder.siteName} • العميل: ${newOrder.clientName} (${newOrder.clientPhone})`,
        urgent: Boolean(newOrder.urgent),
        tag: `order_${newOrder.id}`,
      });
    } catch (e) {
      console.log('Notification error', e);
    }
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<OrkeitServiceOrder>) => {
    setOrders((prev) => {
      const updated = prev.map((ord) => (ord.id === orderId ? { ...ord, ...updates } : ord));
      saveStoredOrders(updated);
      return updated;
    });
  };

  const handleAddFollowUp = (
    siteId: string,
    note: string,
    action: 'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note'
  ) => {
    if (!currentUser) return;
    const newFol: FollowUpLog = {
      id: `fol_${Date.now()}`,
      siteId,
      agentId: currentUser.id,
      agentName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      action,
      summary: note,
    };
    setFollowups((prev) => [newFol, ...prev]);

    // Persist follow-up to central database
    apiSaveFollowUp(newFol);
  };

  const handleSaveAgent = (agent: User) => {
    setUsers((prev) => {
      const existsIndex = prev.findIndex((u) => u.id === agent.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = agent;
        return copy;
      }
      return [...prev, agent];
    });

    // Persist agent to central database
    apiSaveUser(agent);
  };

  const handleToggleAgentStatus = (agentId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === agentId ? { ...u, active: !u.active } : u))
    );

    // Persist status toggle to central database
    apiToggleUser(agentId);
  };

  // Client Portal Handlers
  const handleSaveIncident = (incident: ClientIncident) => {
    setIncidents((prev) => [incident, ...prev.filter((i) => i.id !== incident.id)]);
    apiSaveIncident(incident);

    // Trigger emergency audible siren and outside notification
    const isUrgent = incident.priority === 'urgent' || incident.priority === 'high';
    soundNotifier.sendEmergencyNotification({
      title: `${isUrgent ? '🚨 إنذار طوارئ عاجل' : '🔔 بلاغ صيانة جديد'}: ${incident.siteName}`,
      body: `${incident.title} - ${incident.description.slice(0, 100)}...`,
      urgent: isUrgent,
      tag: `incident_${incident.id}`,
    });
  };

  const handleUpdateIncident = (incidentId: string, updates: Partial<ClientIncident>) => {
    const now = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === incidentId) {
          const updatedHistory = i.statusHistory ? [...i.statusHistory] : [];
          if (updates.status || updates.assignedTechnician || updates.adminNotes) {
            updatedHistory.push({
              status: updates.status || i.status,
              changedAt: now,
              changedBy: currentUser?.name || 'مدير النظام',
              notes: updates.adminNotes !== undefined ? updates.adminNotes : i.adminNotes,
              technicianName: updates.assignedTechnician !== undefined ? updates.assignedTechnician : i.assignedTechnician,
            });
          }
          return {
            ...i,
            ...updates,
            updatedAt: now,
            statusHistory: updatedHistory,
          };
        }
        return i;
      })
    );
    apiUpdateIncident(incidentId, {
      ...updates,
      updatedAt: now,
    });
    soundNotifier.playChime();
  };

  const handleSaveInquiry = (inquiry: ClientInquiry) => {
    setInquiries((prev) => [inquiry, ...prev.filter((i) => i.id !== inquiry.id)]);
    apiSaveInquiry(inquiry);
    soundNotifier.sendEmergencyNotification({
      title: `❓ استفسار فني جديد: ${inquiry.siteName}`,
      body: inquiry.subject,
      urgent: false,
    });
  };

  const handleAnswerInquiry = (inquiryId: string, answer: string, answeredBy: string) => {
    setInquiries((prev) =>
      prev.map((i) =>
        i.id === inquiryId
          ? {
              ...i,
              status: 'answered',
              answer,
              answeredBy,
              answeredAt: new Date().toISOString(),
            }
          : i
      )
    );
    apiAnswerInquiry(inquiryId, answer, answeredBy);
    soundNotifier.playChime();
  };

  const handleSaveRenewal = (renewal: ContractRenewalRequest) => {
    setRenewals((prev) => [renewal, ...prev.filter((r) => r.id !== renewal.id)]);
    apiSaveRenewal(renewal);
    soundNotifier.sendEmergencyNotification({
      title: `📄 طلب تجديد عقد صيانة: ${renewal.siteName}`,
      body: `طلب تجديد لمدة ${renewal.requestedDurationYears} سنوات لمنشأة ${renewal.siteName}`,
      urgent: true,
    });
  };

  const handleUpdateRenewal = (
    renewalId: string,
    updates: Partial<ContractRenewalRequest>
  ) => {
    setRenewals((prev) =>
      prev.map((r) => (r.id === renewalId ? { ...r, ...updates } : r))
    );
    apiUpdateRenewal(renewalId, updates);
  };

  const handleSaveCDAlert = (alert: CivilDefenseInspectionAlert) => {
    setCivilDefenseAlerts((prev) => [
      alert,
      ...prev.filter((a) => a.id !== alert.id),
    ]);
    apiSaveCDAlert(alert);
  };

  // If user is not logged in, show the login portal
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onRegisterClientSuccess={(newUser, newSite) => {
            setUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id && u.phone !== newUser.phone)]);
            if (newSite) {
              setSites((prev) => [newSite, ...prev.filter((s) => s.id !== newSite.id)]);
            }
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-full m-0 p-0 bg-[#070B1C] text-[#F5F7FF] flex flex-col font-['Cairo',sans-serif] selection:bg-[#20A9FF] selection:text-[#070B1C]">
      
      {/* Android Top App Bar */}
      <AndroidTopBar
        currentUser={currentUser}
        activeTab={activeAndroidTab}
        onNavigateTab={(tab) => {
          setShowAdminCRM(false);
          setIsHubOpen(false);
          setActiveAndroidTab(tab);
        }}
        unreadNotificationsCount={totalAlertsCount}
        onOpenHub={() => setIsHubOpen((prev) => !prev)}
      />

      {/* Emergency Alarm & Outside Notification Strip */}
      <EmergencyAlarmBar
        expiringContractsCount={expiringContractsCount}
        urgentMaintenanceCount={urgentMaintenanceCount}
        civilDefenseVisitsCount={civilDefenseVisitsCount}
        newServiceOrdersCount={unreadOrdersCount}
        extinguishers10DaysAlertCount={extinguishers10DaysCount}
        onOpenAlerts={(target) => {
          setIsHubOpen(false);
          if (target === 'extinguishers') {
            setAdminTab('extinguishers');
            setShowAdminCRM(true);
            return;
          }
          setShowAdminCRM(false);
          setActiveAndroidTab('notifications');
        }}
      />

      {/* Mobile App Standalone & Fullscreen Mode Prompt */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <MobileAppModeBanner />
      </div>

      {/* APP MODULES NAVIGATION HUB (When clicking on company logo) */}
      {isHubOpen ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-24">
          <AppModulesHub
            currentUser={currentUser}
            onClose={() => setIsHubOpen(false)}
            onNavigate={({ view, adminTab: targetAdminTab, openNewVisit }) => {
              setIsHubOpen(false);
              if (openNewVisit) {
                handleOpenNewVisit();
                return;
              }
              if (targetAdminTab) {
                setAdminTab(targetAdminTab);
                setShowAdminCRM(true);
              }
            }}
            sitesCount={visibleSites.length}
            criticalAlertsCount={totalAlertsCount}
            expiringContractsCount={expiringContractsCount}
          />
        </main>
      ) : showAdminCRM && (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? (
        /* ADMIN CRM DRILLDOWN (Sites CRM, Extinguishers, Agents, Reports) */
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-28">
          <div className="p-3 bg-[#10172B] border border-[#1E2945] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💼</span>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#F5F7FF]">إدارة المنظومة الميدانية CRM</h3>
                <span className="text-[10px] text-[#8992AA]">إدارة المواقع، المندوبين، الطفايات، والتقارير</span>
              </div>
            </div>
            <button
              onClick={() => setShowAdminCRM(false)}
              className="py-1.5 px-3 rounded-xl bg-[#20A9FF] text-[#070B1C] font-bold text-xs flex items-center gap-1.5 active:scale-95"
            >
              <span>العودة للتطبيق</span>
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex bg-[#10172B] p-1.5 rounded-2xl border border-[#1E2945] text-xs overflow-x-auto gap-1 no-scrollbar scroll-smooth">
            {[
              { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
              { id: 'alerts', label: `التنبيهات والإشعارات (${totalAlertsCount})`, icon: Bell },
              { id: 'sites', label: `سجل المواقع CRM (${sites.length})`, icon: Building2 },
              { id: 'extinguishers', label: `صيانة الكفاية والطفايات (${extinguishers10DaysCount > 0 ? `🔔 ${extinguishers10DaysCount}` : sites.filter(s => s.approvalStatus === 'approved').length})`, icon: Flame },
              { id: 'clients', label: `بوابة العملاء (${users.filter(u => u.role === 'client').length})`, icon: Users },
              { id: 'agents', label: `فريق المندوبين (${users.filter(u => u.role === 'agent').length})`, icon: Users },
              { id: 'incentives', label: `الحوافز (${settings.ratePerApprovedSiteSAR} ر.س)`, icon: Award },
              { id: 'reports', label: 'التقارير وExcel', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition shrink-0 ${
                    isActive
                      ? 'bg-[#20A9FF] text-[#070B1C] font-bold shadow-sm'
                      : 'text-[#8992AA] hover:text-[#F5F7FF] hover:bg-[#1E2945]/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Admin Tab Content */}
          {adminTab === 'dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              sites={sites}
              visits={visits}
              agents={users}
              settings={settings}
              incidents={incidents}
              inquiries={inquiries}
              renewals={renewals}
              orders={orders}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
              onNavigateTab={(tab) => setAdminTab(tab)}
              onApproveSite={handleApproveSite}
              onUpdateOrder={handleUpdateOrder}
              onOpenTracking={(order) => setTrackingModalOrder(order)}
            />
          )}

          {adminTab === 'alerts' && (
            <AdminNotifications
              currentUser={currentUser}
              sites={sites}
              incidents={incidents}
              civilDefenseAlerts={civilDefenseAlerts}
              renewals={renewals}
              inquiries={inquiries}
              orders={orders}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onUpdateIncident={handleUpdateIncident}
              onUpdateOrder={handleUpdateOrder}
              onOpenTracking={(order) => setTrackingModalOrder(order)}
            />
          )}

          {adminTab === 'sites' && (
            <SitesManagement
              currentUser={currentUser}
              sites={sites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
              onApproveSite={handleApproveSite}
            />
          )}

          {adminTab === 'extinguishers' && (
            <ExtinguishersManagement
              currentUser={currentUser}
              sites={sites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onUpdateSiteMaintenance={handleUpdateSiteExtinguisherMaintenance}
              onOpenNewVisit={handleOpenNewVisit}
              onSaveNewSite={handleSaveNewExtinguisherSite}
            />
          )}

          {adminTab === 'clients' && (
            <ClientsManagement
              currentUser={currentUser}
              clients={users.filter((u) => u.role === 'client')}
              sites={sites}
              incidents={incidents}
              inquiries={inquiries}
              renewals={renewals}
              civilDefenseAlerts={civilDefenseAlerts}
              onSaveClient={handleSaveAgent}
              onToggleClientStatus={handleToggleAgentStatus}
              onUpdateIncident={handleUpdateIncident}
              onAnswerInquiry={handleAnswerInquiry}
              onUpdateRenewal={handleUpdateRenewal}
              onSaveCDAlert={handleSaveCDAlert}
            />
          )}

          {adminTab === 'agents' && (
            <AgentsManagement
              currentUser={currentUser}
              agents={users.filter((u) => u.role === 'agent')}
              sites={sites}
              visits={visits}
              settings={settings}
              onSaveAgent={handleSaveAgent}
              onToggleAgentStatus={handleToggleAgentStatus}
              onSelectAgentForSites={() => {
                setAdminTab('sites');
              }}
            />
          )}

          {adminTab === 'incentives' && (
            <IncentivesManagement
              currentUser={currentUser}
              sites={sites}
              agents={users}
              settings={settings}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                apiSaveSettings(newSettings);
              }}
              onApproveSite={handleApproveSite}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
            />
          )}

          {adminTab === 'reports' && (
            <ReportsManagement
              currentUser={currentUser}
              sites={sites}
              visits={visits}
              agents={users}
              settings={settings}
            />
          )}
        </div>
      ) : (
        /* NATIVE ANDROID APP MAIN VIEWS (100% Mobile First, Full Screen) */
        <main 
          className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 pb-24"
          style={{ minHeight: 'calc(100dvh - 3.5rem)', boxSizing: 'border-box' }}
        >
          {activeAndroidTab === 'home' && (
            <AndroidHomeScreen
              currentUser={currentUser}
              sites={visibleSites}
              visits={visits}
              orders={orders}
              incidents={incidents}
              onNavigateTab={(tab) => {
                setShowAdminCRM(false);
                setActiveAndroidTab(tab);
              }}
              onOpenNewVisit={handleOpenNewVisit}
              onOpenTracking={(order) => setTrackingModalOrder(order)}
              onOrderCreated={handleOrderCreated}
              onUpdateOrder={handleUpdateOrder}
              onOpenAdminCRM={() => setShowAdminCRM(true)}
            />
          )}

          {activeAndroidTab === 'services' && currentUser.role === 'client' && (
            <AndroidServicesScreen
              currentUser={currentUser}
              sites={visibleSites}
              onOrderCreated={handleOrderCreated}
              onOpenNewVisit={handleOpenNewVisit}
              onNavigateTab={(tab) => {
                setShowAdminCRM(false);
                setActiveAndroidTab(tab);
              }}
            />
          )}

          {activeAndroidTab === 'orders' && (
            <AndroidOrdersScreen
              currentUser={currentUser}
              orders={orders}
              onNavigateTab={(tab) => {
                setShowAdminCRM(false);
                setActiveAndroidTab(tab);
              }}
              onOpenTracking={(order) => setTrackingModalOrder(order)}
            />
          )}

          {activeAndroidTab === 'notifications' && (
            <AndroidNotificationsScreen
              currentUser={currentUser}
              incidents={incidents}
              civilDefenseAlerts={civilDefenseAlerts}
              renewals={renewals}
              orders={orders}
              onNavigateTab={(tab) => {
                setShowAdminCRM(false);
                setActiveAndroidTab(tab);
              }}
              onOpenTracking={(order) => setTrackingModalOrder(order)}
              onUpdateOrder={handleUpdateOrder}
            />
          )}

          {activeAndroidTab === 'profile' && (
            <AndroidProfileScreen
              currentUser={currentUser}
              sites={visibleSites}
              onLogout={handleLogout}
              onNavigateTab={(tab) => {
                setShowAdminCRM(false);
                setActiveAndroidTab(tab);
              }}
              onOpenAdminCRM={() => setShowAdminCRM(true)}
            />
          )}
        </main>
      )}

      {/* Fixed Android Bottom Navigation (5 items) */}
      <AndroidBottomNav
        currentUser={currentUser}
        activeTab={activeAndroidTab}
        onSelectTab={(tab) => {
          setShowAdminCRM(false);
          setIsHubOpen(false);
          setActiveAndroidTab(tab);
        }}
        urgentAlertsCount={totalAlertsCount}
        activeOrdersCount={orders.filter((o) => o.status !== 'completed').length}
      />

      {/* Interactive Android Order Tracking Modal */}
      <AndroidTrackingModal
        order={trackingModalOrder}
        isOpen={Boolean(trackingModalOrder)}
        onClose={() => setTrackingModalOrder(null)}
      />

      {/* MULTI-STEP NEW VISIT & REGISTRATION MODAL */}
      {currentUser && (
        <NewVisitModal
          currentUser={currentUser}
          existingSites={sites}
          isOpen={isNewVisitModalOpen}
          onClose={() => {
            setIsNewVisitModalOpen(false);
            setSelectedSiteToVisit(null);
          }}
          onSaveSiteAndVisit={handleSaveSiteAndVisit}
          defaultSiteToVisit={selectedSiteToVisit}
        />
      )}

      {/* 360-DEGREE SITE CRM PROFILE MODAL */}
      {currentUser && (
        <SiteDetailModal
          site={selectedSiteForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedSiteForDetail(null)}
          onUpdateStatus={handleUpdateStatus}
          onApproveSite={handleApproveSite}
          onAddFollowUp={handleAddFollowUp}
          onOpenNewVisitForSite={(site) => handleOpenNewVisit(site)}
          onUpdateMaintenance={handleUpdateSiteExtinguisherMaintenance}
          followups={followups}
          visits={visits}
        />
      )}

      {/* Real-time Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Floating Smooth Vertical Scroll Control (Top & Bottom quick movement) */}
      <VerticalScrollControl />

    </div>
  );
}
