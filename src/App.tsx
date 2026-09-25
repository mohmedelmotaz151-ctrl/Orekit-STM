import React, { useState, useEffect } from 'react';
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
  saveStoredCurrentUser 
} from './utils/storage';
import { 
  User, 
  Site, 
  Visit, 
  FollowUpLog, 
  IncentiveSettings, 
  SiteStatus 
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
import { AgentsManagement } from './components/Admin/AgentsManagement';
import { IncentivesManagement } from './components/Admin/IncentivesManagement';
import { ReportsManagement } from './components/Admin/ReportsManagement';
import { SiteDetailModal } from './components/Admin/SiteDetailModal';
import { LeafletMap } from './components/Common/LeafletMap';
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
  apiSaveSettings
} from './utils/api';
import { 
  Home, 
  MapPin, 
  Bell, 
  Award, 
  PlusCircle, 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  // Persistent data state
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredCurrentUser);
  const [sites, setSites] = useState<Site[]>(getStoredSites);
  const [visits, setVisits] = useState<Visit[]>(getStoredVisits);
  const [followups, setFollowups] = useState<FollowUpLog[]>(getStoredFollowups);
  const [settings, setSettings] = useState<IncentiveSettings>(getStoredSettings);

  // View mode: 'mobile_agent' for agents, 'admin_dashboard' for admin
  const [currentViewMode, setCurrentViewMode] = useState<'mobile_agent' | 'admin_dashboard'>(
    currentUser?.role === 'admin' ? 'admin_dashboard' : 'mobile_agent'
  );

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<'home' | 'sites' | 'map' | 'alerts' | 'profile'>('home');

  // Admin dashboard navigation tabs
  const [adminTab, setAdminTab] = useState<'dashboard' | 'sites' | 'agents' | 'incentives' | 'reports'>('dashboard');

  // Modals
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [selectedSiteToVisit, setSelectedSiteToVisit] = useState<Site | null>(null);
  const [selectedSiteForDetail, setSelectedSiteForDetail] = useState<Site | null>(null);

  // Initial load from central API database
  useEffect(() => {
    fetchDatabaseData().then((dbData) => {
      if (dbData) {
        setUsers(dbData.users);
        setSites(dbData.sites);
        setVisits(dbData.visits);
        setFollowups(dbData.followups);
        if (dbData.settings) setSettings(dbData.settings);
      }
    });
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
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  // Counts for alerts
  const totalExpiringContracts = sites.filter(
    (s) => s.contract.hasContract === 'yes' && s.contract.endDate && (getDaysRemaining(s.contract.endDate) || 999) <= 60
  ).length;

  const totalUrgentSites = sites.filter((s) => s.status === 'urgent_maintenance').length;
  const totalAlertsCount = totalExpiringContracts + totalUrgentSites;

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
    setSites((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === newSite.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = newSite;
        return copy;
      }
      return [newSite, ...prev];
    });

    setVisits((prev) => [newVisit, ...prev]);

    const newFol: FollowUpLog = {
      id: `fol_${Date.now()}`,
      siteId: newSite.id,
      agentId: currentUser.id,
      agentName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      action: 'visit',
      summary: `تمت زيارة ميدانية للمنشأة (${newVisit.durationMinutes} دقيقة) - الحالة: ${newVisit.outcomeStatus}`,
    };
    setFollowups((prev) => [newFol, ...prev]);

    // Persist to central database
    apiSaveSite(newSite);
    apiSaveVisit(newVisit);
    apiSaveFollowUp(newFol);
  };

  const handleApproveSite = (siteId: string, approved: boolean, reason?: string) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          return {
            ...s,
            approvalStatus: approved ? 'approved' : 'rejected',
            rejectionReason: approved ? undefined : reason,
            approvedAt: approved ? new Date().toISOString().split('T')[0] : undefined,
            approvedBy: approved ? currentUser?.name : undefined,
            incentivePaid: approved,
          };
        }
        return s;
      })
    );

    if (selectedSiteForDetail && selectedSiteForDetail.id === siteId) {
      setSelectedSiteForDetail((prev) =>
        prev
          ? {
              ...prev,
              approvalStatus: approved ? 'approved' : 'rejected',
              rejectionReason: approved ? undefined : reason,
            }
          : null
      );
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

  // If user is not logged in, show the login portal
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      
      {/* Top Header - No Admin switcher icon! */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        alertsCount={totalAlertsCount}
        onOpenAlerts={() => {
          if (currentUser.role === 'admin') {
            setAdminTab('dashboard');
          } else {
            setMobileTab('alerts');
          }
        }}
      />

      {/* VIEW MODE 1: MOBILE AGENT APPLICATION (For field sales agents) */}
      {currentUser.role === 'agent' && (
        <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-3 py-4 pb-24">
          
          {/* Main Mobile Screen Tabs */}
          {mobileTab === 'home' && (
            <AgentHome
              currentUser={currentUser}
              sites={sites}
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
              sites={sites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
            />
          )}

          {mobileTab === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">الخريطة الميدانية للمواقع</h2>
                  <p className="text-xs text-slate-400">استكشف مواقع العملاء القريبة ومسافات الأمان</p>
                </div>
                <button
                  onClick={() => handleOpenNewVisit()}
                  className="px-3 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
                >
                  + تسجيل موقع
                </button>
              </div>

              <LeafletMap
                sites={sites}
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
              sites={sites}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
            />
          )}

          {mobileTab === 'profile' && (
            <AgentIncentives
              currentUser={currentUser}
              sites={sites}
              settings={settings}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
            />
          )}

          {/* Sticky Bottom Navigation Bar for Agents */}
          <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl py-2 px-3 flex items-center justify-around max-w-lg mx-auto">
            <button
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'home' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">الرئيسية</span>
            </button>

            <button
              onClick={() => setMobileTab('sites')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'sites' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px]">المواقع</span>
            </button>

            {/* Quick Action: Start Visit In Bottom Bar */}
            <button
              onClick={() => handleOpenNewVisit()}
              className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-red-600 text-white shadow-xl shadow-orange-950/80 border-2 border-slate-900 hover:scale-105 active:scale-95 transition"
              title="بدء زيارة جديدة"
            >
              <PlusCircle className="w-7 h-7" />
            </button>

            <button
              onClick={() => setMobileTab('alerts')}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'alerts' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px]">التنبيهات</span>
              {totalAlertsCount > 0 && (
                <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                mobileTab === 'profile' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px]">الحوافز</span>
            </button>
          </nav>

        </div>
      )}

      {/* VIEW MODE 2: ADMIN / SUPERVISOR DASHBOARD (Exclusively for Admin) */}
      {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-6 space-y-6">
          
          {/* Admin Navigation Tabs */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto gap-1">
            {[
              { id: 'dashboard', label: 'لوحة المؤشرات والخريطة', icon: LayoutDashboard },
              { id: 'sites', label: `سجل المواقع المركزي CRM (${sites.length})`, icon: Building2 },
              { id: 'agents', label: `فريق المبيعات والمندوبين (${users.filter(u => u.role === 'agent').length})`, icon: Users },
              { id: 'incentives', label: `نظام الحوافز والاعتمادات (${settings.ratePerApprovedSiteSAR} ر.س)`, icon: Award },
              { id: 'reports', label: 'التقارير المتقدمة وتصدير Excel', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
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

          {/* Admin Tab Content */}
          {adminTab === 'dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              sites={sites}
              visits={visits}
              agents={users}
              settings={settings}
              onSelectSite={(site) => setSelectedSiteForDetail(site)}
              onOpenNewVisit={handleOpenNewVisit}
              onNavigateTab={(tab) => setAdminTab(tab)}
              onApproveSite={handleApproveSite}
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
          followups={followups}
          visits={visits}
        />
      )}

    </div>
  );
}
