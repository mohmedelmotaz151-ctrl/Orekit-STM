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
      const normalized = cloudSites.map(normalizeSite);
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
          if (dbData.sites) setSites(dbData.sites.map(normalizeSite));
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

  // Total alert count for header badges
  const totalAlertsCount = expiringContractsCount + urgentMaintenanceCount + civilDefenseVisitsCount;

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
      summary: `تم تحديث صيانة طفايات الحريق - تاريخ الانتهاء المعتمد: ${maintenance.expiryDate} (ملصق رقم: ${maintenance.certificateOrTagNumber})`,
    };
    setFollowups((prev) => [newFol, ...prev]);
    apiSaveFollowUp(newFol);
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
    <div className="min-h-screen bg-[#070B1C] text-[#F5F7FF] flex flex-col font-['Cairo',sans-serif]">
      
      {/* Top Header - Clicking logo opens AppModulesHub */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        alertsCount={totalAlertsCount}
        onOpenHub={() => setIsHubOpen((prev) => !prev)}
        isHubActive={isHubOpen}
        onOpenAlerts={() => {
          setIsHubOpen(false);
          if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
            setAdminTab('alerts');
          } else {
            setMobileTab('alerts');
          }
        }}
      />

      {/* Emergency Alarm & Outside Notification Strip: Active ONLY on contracts nearing expiration, urgent maintenance, or civil defense visits */}
      <EmergencyAlarmBar
        expiringContractsCount={expiringContractsCount}
        urgentMaintenanceCount={urgentMaintenanceCount}
        civilDefenseVisitsCount={civilDefenseVisitsCount}
        onOpenAlerts={(target) => {
          setIsHubOpen(false);
          if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
            setAdminTab('alerts');
          } else {
            setMobileTab('alerts');
          }
        }}
      />

      {/* Mobile App Standalone & Fullscreen Mode Prompt */}
      <div className="max-w-md sm:max-w-lg mx-auto w-full sm:border-x sm:border-[#1E2945]/30">
        <MobileAppModeBanner />
      </div>

      {/* APP MODULES NAVIGATION HUB (When clicking on company logo) */}
      {isHubOpen ? (
        <main className="flex-1 w-full max-w-md sm:max-w-lg mx-auto sm:border-x sm:border-[#1E2945]/30 pb-16">
          <AppModulesHub
            currentUser={currentUser}
            onClose={() => setIsHubOpen(false)}
            onNavigate={({ view, adminTab: targetAdminTab, mobileTab: targetMobileTab, openNewVisit }) => {
              setIsHubOpen(false);
              if (openNewVisit) {
                handleOpenNewVisit();
                return;
              }
              if (targetAdminTab) {
                setAdminTab(targetAdminTab);
              }
              if (targetMobileTab) {
                setMobileTab(targetMobileTab);
              }
            }}
            sitesCount={visibleSites.length}
            criticalAlertsCount={totalAlertsCount}
            expiringContractsCount={expiringContractsCount}
          />
        </main>
      ) : (
        <>
          {/* VIEW MODE 1: MOBILE AGENT APPLICATION (For field sales agents) */}
          {currentUser.role === 'agent' && (
        <div className="flex-1 flex flex-col justify-between max-w-md sm:max-w-lg mx-auto w-full px-3 py-3 pb-28 sm:border-x sm:border-[#1E2945]/30 sm:shadow-2xl">
          
          {/* Main Mobile Screen Tabs */}
          {mobileTab === 'home' && (
            <AgentHome
              currentUser={currentUser}
              sites={visibleSites}
              visits={visits}
              settings={settings}
              onOpenNewVisit={handleOpenNewVisit}
              onNavigateTab={(tab) => setMobileTab(tab)}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
            />
          )}

          {mobileTab === 'sites' && (
            <AgentSitesList
              currentUser={currentUser}
              sites={visibleSites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
            />
          )}

          {mobileTab === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">الخريطة الميدانية لمواقعي</h2>
                  <p className="text-xs text-slate-400">استكشف مواقع منشآتك المسجلة ومسافات الأمان</p>
                </div>
                <button
                  onClick={() => handleOpenNewVisit()}
                  className="px-3 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
                >
                  + تسجيل موقع
                </button>
              </div>

              <LeafletMap
                sites={visibleSites}
                onSelectSite={(site) => setSelectedSiteForDetail(site)}
                center={[24.7136, 46.6753]}
                zoom={13}
                className="w-full h-[65vh] rounded-3xl border border-slate-700 shadow-xl"
              />
            </div>
          )}

          {mobileTab === 'alerts' && (
            <AgentAlerts
              currentUser={currentUser}
              sites={visibleSites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
            />
          )}

          {mobileTab === 'profile' && (
            <AgentIncentives
              currentUser={currentUser}
              sites={visibleSites}
              settings={settings}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
            />
          )}

          {/* Sticky Bottom Navigation Bar for Agents */}
          <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070B1C]/95 backdrop-blur-md border-t border-[#1E2945] shadow-2xl py-1.5 px-3 pb-safe flex items-center justify-around max-w-lg mx-auto">
            <button
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'home' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">الرئيسية</span>
            </button>

            <button
              onClick={() => setMobileTab('sites')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'sites' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px]">المواقع</span>
            </button>

            {/* Quick Action: Start Visit In Bottom Bar */}
            <button
              onClick={() => handleOpenNewVisit()}
              className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#20A9FF] text-[#070B1C] shadow-lg shadow-[#20A9FF]/30 border-2 border-[#070B1C] hover:scale-105 active:scale-95 transition"
              title="بدء زيارة جديدة"
            >
              <PlusCircle className="w-7 h-7" />
            </button>

            <button
              onClick={() => setMobileTab('alerts')}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'alerts' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px]">التنبيهات</span>
              {totalAlertsCount > 0 && (
                <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-[#EF3340] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'profile' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA] hover:text-[#F5F7FF]'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px]">الحوافز</span>
            </button>
          </nav>

        </div>
      )}

      {/* VIEW MODE 2: CLIENT PORTAL (For facility owners & clients) */}
      {currentUser.role === 'client' && (
        <div className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-3 py-3 pb-28 sm:border-x sm:border-[#1E2945]/30 sm:shadow-2xl">
          <ClientPortal
            currentUser={currentUser}
            linkedSite={sites.find(
              (s) =>
                s.id === currentUser.siteId ||
                (currentUser.facilityName &&
                  s.name.toLowerCase().includes(currentUser.facilityName.toLowerCase()))
            )}
            incidents={incidents}
            inquiries={inquiries}
            renewals={renewals}
            civilDefenseAlerts={civilDefenseAlerts}
            onSaveIncident={handleSaveIncident}
            onSaveInquiry={handleSaveInquiry}
            onSaveRenewal={handleSaveRenewal}
            onSaveCDAlert={handleSaveCDAlert}
          />
        </div>
      )}

      {/* VIEW MODE 3: ADMIN / SUPERVISOR DASHBOARD (Exclusively for Admin) */}
      {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
        <div className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-3 py-3 space-y-4 pb-28 sm:border-x sm:border-[#1E2945]/30 sm:shadow-2xl">
          
          {/* Fixed Mobile Bottom Navigation for Admin & Supervisor (Always Active in Mobile Mode) */}
          <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070B1C]/95 backdrop-blur-md border-t border-[#1E2945] shadow-2xl py-1.5 px-2 pb-safe flex items-center justify-around max-w-md sm:max-w-lg mx-auto">
            <button
              onClick={() => {
                setAdminTab('dashboard');
                setIsAdminMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                adminTab === 'dashboard' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px]">الرئيسية</span>
            </button>

            <button
              onClick={() => {
                setAdminTab('agents');
                setIsAdminMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                adminTab === 'agents' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA]'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px]">المندوبون</span>
            </button>

            <button
              onClick={() => {
                setAdminTab('sites');
                setIsAdminMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                adminTab === 'sites' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA]'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px]">الزيارات</span>
            </button>

            <button
              onClick={() => {
                setAdminTab('alerts');
                setIsAdminMoreOpen(false);
              }}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                adminTab === 'alerts' ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA]'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px]">الطوارئ</span>
              {urgentClientTicketsCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-[#EF3340] text-white text-[9px] font-bold flex items-center justify-center">
                  {urgentClientTicketsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAdminMoreOpen((prev) => !prev)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                ['extinguishers', 'clients', 'incentives', 'reports'].includes(adminTab) || isAdminMoreOpen ? 'text-[#20A9FF] font-bold' : 'text-[#8992AA]'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px]">المزيد</span>
            </button>
          </nav>

          {/* Mobile "المزيد" Drawer */}
          {isAdminMoreOpen && (
            <div 
              className="fixed inset-0 z-30 bg-[#070B1C]/80 backdrop-blur-sm flex flex-col justify-end"
              onClick={() => setIsAdminMoreOpen(false)}
            >
              <div 
                className="bg-[#10172B] border-t border-[#1E2945] rounded-t-3xl p-5 space-y-3 pb-24 shadow-2xl animate-fadeIn max-w-md sm:max-w-lg mx-auto w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#1E2945] pb-2.5">
                  <h3 className="font-bold text-sm text-[#F5F7FF]">أقسام المنظومة الإضافية</h3>
                  <button 
                    onClick={() => setIsAdminMoreOpen(false)}
                    className="p-1 rounded-lg text-[#8992AA] hover:text-[#F5F7FF]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setAdminTab('extinguishers');
                      setIsAdminMoreOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center gap-2 ${
                      adminTab === 'extinguishers' 
                        ? 'bg-[#20A9FF]/15 border-[#20A9FF] text-[#20A9FF] font-bold' 
                        : 'bg-[#070B1C] border-[#1E2945] text-[#F5F7FF]'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-[#EF3340] shrink-0" />
                    <span>صيانة الطفايات</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('clients');
                      setIsAdminMoreOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center gap-2 ${
                      adminTab === 'clients' 
                        ? 'bg-[#20A9FF]/15 border-[#20A9FF] text-[#20A9FF] font-bold' 
                        : 'bg-[#070B1C] border-[#1E2945] text-[#F5F7FF]'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#20A9FF] shrink-0" />
                    <span>بوابة العملاء</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('incentives');
                      setIsAdminMoreOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center gap-2 ${
                      adminTab === 'incentives' 
                        ? 'bg-[#20A9FF]/15 border-[#20A9FF] text-[#20A9FF] font-bold' 
                        : 'bg-[#070B1C] border-[#1E2945] text-[#F5F7FF]'
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#FFB020] shrink-0" />
                    <span>نظام الحوافز</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('reports');
                      setIsAdminMoreOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center gap-2 ${
                      adminTab === 'reports' 
                        ? 'bg-[#20A9FF]/15 border-[#20A9FF] text-[#20A9FF] font-bold' 
                        : 'bg-[#070B1C] border-[#1E2945] text-[#F5F7FF]'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#19C7A0] shrink-0" />
                    <span>التقارير والتصدير</span>
                  </button>
                </div>
              </div>
            </div>
          )}

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
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
              onNavigateTab={(tab) => setAdminTab(tab)}
              onApproveSite={handleApproveSite}
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
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onUpdateIncident={handleUpdateIncident}
              onUpdateSiteStatus={handleUpdateStatus}
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
              agents={users.filter(u => u.role === 'agent')}
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
      )}
        </>
      )}

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

    </div>
  );
}
