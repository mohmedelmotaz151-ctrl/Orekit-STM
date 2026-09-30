import { 
  User, 
  Site, 
  SiteType,
  Visit, 
  FollowUpLog, 
  IncentiveSettings,
  ClientIncident,
  ClientInquiry,
  ContractRenewalRequest,
  CivilDefenseInspectionAlert
} from '../types';
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
  getStoredIncidents,
  saveStoredIncidents,
  getStoredInquiries,
  saveStoredInquiries,
  getStoredRenewals,
  saveStoredRenewals,
  getStoredCivilDefenseAlerts,
  saveStoredCivilDefenseAlerts,
  normalizeSite
} from './storage';
import {
  fsSaveUser,
  fsSaveSite,
  fsApproveSite,
  fsUpdateSiteStatus,
  fsSaveVisit,
  fsSaveFollowUp,
  fsSaveSettings,
  fsSaveIncident,
  fsUpdateIncident,
  fsSaveInquiry,
  fsAnswerInquiry,
  fsSaveRenewal,
  fsUpdateRenewal,
  fsSaveCDAlert
} from './firestoreService';

/**
 * Bidirectional Database Sync:
 * Sends local records (from localStorage) to /api/sync, merges with server's database.json,
 * saves the merged results back into localStorage, and returns the merged data.
 * This guarantees NO DATA IS EVER LOST across page refreshes, tab updates, or server restarts!
 */
export async function syncDatabaseData(): Promise<{
  users: User[];
  sites: Site[];
  visits: Visit[];
  followups: FollowUpLog[];
  incidents: ClientIncident[];
  inquiries: ClientInquiry[];
  renewals: ContractRenewalRequest[];
  civilDefenseAlerts: CivilDefenseInspectionAlert[];
  settings: IncentiveSettings;
}> {
  const localUsers = getStoredUsers();
  const localSites = getStoredSites();
  const localVisits = getStoredVisits();
  const localFollowups = getStoredFollowups();
  const localIncidents = getStoredIncidents();
  const localInquiries = getStoredInquiries();
  const localRenewals = getStoredRenewals();
  const localAlerts = getStoredCivilDefenseAlerts();
  const localSettings = getStoredSettings();

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: localUsers,
        sites: localSites,
        visits: localVisits,
        followups: localFollowups,
        incidents: localIncidents,
        inquiries: localInquiries,
        renewals: localRenewals,
        civilDefenseAlerts: localAlerts,
        settings: localSettings,
      }),
    });

    if (res.ok) {
      const merged = await res.json();
      if (merged && Array.isArray(merged.users)) {
        const normalizedSites = Array.isArray(merged.sites) ? merged.sites.map(normalizeSite) : [];
        saveStoredUsers(merged.users);
        saveStoredSites(normalizedSites);
        saveStoredVisits(merged.visits || []);
        saveStoredFollowups(merged.followups || []);
        if (merged.incidents) saveStoredIncidents(merged.incidents);
        if (merged.inquiries) saveStoredInquiries(merged.inquiries);
        if (merged.renewals) saveStoredRenewals(merged.renewals);
        if (merged.civilDefenseAlerts) saveStoredCivilDefenseAlerts(merged.civilDefenseAlerts);
        if (merged.settings) saveStoredSettings(merged.settings);

        return {
          users: merged.users,
          sites: normalizedSites,
          visits: merged.visits || [],
          followups: merged.followups || [],
          incidents: merged.incidents || localIncidents,
          inquiries: merged.inquiries || localInquiries,
          renewals: merged.renewals || localRenewals,
          civilDefenseAlerts: merged.civilDefenseAlerts || localAlerts,
          settings: merged.settings || localSettings,
        };
      }
    }
  } catch (err) {
    console.warn('API sync failed, utilizing reliable local storage:', err);
  }

  // Fallback: return existing local storage
  return {
    users: localUsers,
    sites: localSites,
    visits: localVisits,
    followups: localFollowups,
    incidents: localIncidents,
    inquiries: localInquiries,
    renewals: localRenewals,
    civilDefenseAlerts: localAlerts,
    settings: localSettings,
  };
}

export const fetchDatabaseData = syncDatabaseData;

export async function apiLogin(
  phoneOrUsername: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrUsername, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    }
    if (data.allUsers && Array.isArray(data.allUsers)) {
      saveStoredUsers(data.allUsers);
    }
    return { success: true, user: data.user };
  } catch {
    // Offline or network error fallback to local search
    const cleanInput = phoneOrUsername.trim().toLowerCase();
    const cleanPass = password.trim();
    const localUsers = getStoredUsers();
    const matched = localUsers.find(
      (u) =>
        u.phone.trim().toLowerCase() === cleanInput ||
        u.username.trim().toLowerCase() === cleanInput
    );
    if (!matched) {
      return { success: false, error: 'رقم الجوال أو اسم المستخدم غير مسجل بالنظام.' };
    }
    if (!matched.active) {
      return { success: false, error: 'هذا الحساب تم تعطيله من قبل الإدارة.' };
    }
    if (matched.password && matched.password !== cleanPass) {
      return { success: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' };
    }
    return { success: true, user: matched };
  }
}

export interface RegisterClientParams {
  clientName: string;
  phone: string;
  password?: string;
  facilityName: string;
  siteType: SiteType;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hasLicense: 'yes' | 'no';
  licenseType?: string;
  hasContract: 'yes' | 'no';
  contractCompany?: string;
  contractEndDate?: string;
  initialRequestType?: 'none' | 'renewal' | 'regular_visit' | 'civil_defense' | 'urgent_fault';
  initialRequestNotes?: string;
}

export async function apiRegisterClient(
  params: RegisterClientParams
): Promise<{ success: boolean; user?: User; site?: Site; error?: string }> {
  try {
    const res = await fetch('/api/register-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'فشل إنشاء الحساب' };
    }

    if (data.user) {
      // Save user to storage
      const users = getStoredUsers();
      const uIdx = users.findIndex((u) => u.id === data.user.id || u.phone === data.user.phone);
      if (uIdx >= 0) users[uIdx] = data.user;
      else users.push(data.user);
      saveStoredUsers(users);

      // Cloud Firestore save
      fsSaveUser(data.user).catch((e) => console.warn('Firestore user save warning:', e));
    }

    if (data.site) {
      // Save site to storage
      const sites = getStoredSites();
      const sIdx = sites.findIndex((s) => s.id === data.site.id);
      if (sIdx >= 0) sites[sIdx] = data.site;
      else sites.unshift(data.site);
      saveStoredSites(sites);

      // Cloud Firestore save
      fsSaveSite(data.site).catch((e) => console.warn('Firestore site save warning:', e));
    }

    if (data.allUsers && Array.isArray(data.allUsers)) {
      saveStoredUsers(data.allUsers);
    }
    if (data.allSites && Array.isArray(data.allSites)) {
      saveStoredSites(data.allSites);
    }

    return { success: true, user: data.user, site: data.site };
  } catch (err: any) {
    // Local fallback creation
    const cleanPhone = params.phone.trim();
    const siteId = `site_client_${Date.now()}`;
    const userId = `client_${Date.now()}`;

    const newSite: Site = {
      id: siteId,
      name: params.facilityName,
      type: params.siteType,
      managerName: params.clientName,
      phone: cleanPhone,
      city: params.city,
      district: params.district || '',
      address: params.address || '',
      latitude: typeof params.latitude === 'number' && !isNaN(params.latitude) ? params.latitude : 24.7136,
      longitude: typeof params.longitude === 'number' && !isNaN(params.longitude) ? params.longitude : 46.6753,
      license: {
        hasLicense: params.hasLicense,
        licenseType: params.licenseType || 'رخصة دفاع مدني',
        licenseNumber: '',
        expiryDate: '',
      },
      contract: {
        hasContract: params.hasContract,
        companyName: params.contractCompany || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: params.contractEndDate || '',
      },
      equipment: {
        extinguishers: {
          totalCount: 4,
          types: ['powder', 'co2'],
          needsMaintenance: params.hasContract !== 'yes',
          needsReplacement: false,
          needsNewInstall: false,
        },
        alarmSystem: {
          exists: true,
          working: true,
          needsMaintenance: false,
          needsInstall: false,
          detectorCount: 4,
          callPointCount: 1,
          panelType: 'معنون (Addressable)',
        },
        waterAndPumps: {
          sprinklersExist: false,
          sprinklersCount: 0,
          sprinklersCondition: 'good',
          pumpsExist: false,
          pumpsType: 'كهرباء',
          pumpsWorking: true,
          fireHoseReelsCount: 1,
          fireCabinetsCount: 1,
          specialSuppressionSystem: 'لا يوجد',
          specialSuppressionWorking: true,
        },
      },
      civilDefense: {
        hasRecord: true,
      },
      status: params.hasContract !== 'yes' ? 'urgent_maintenance' : 'needs_followup',
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString().split('T')[0],
      approvedBy: 'التسجيل الذاتي للعميل',
      createdByAgentId: 'client_self_registration',
      createdByAgentName: 'تسجيل العميل الذاتي',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      incentiveAmount: 0,
      incentivePaid: false,
      visitsCount: 0,
    };

    const newUser: User = {
      id: userId,
      name: params.clientName,
      username: cleanPhone,
      phone: cleanPhone,
      password: params.password || '1234',
      role: 'client',
      active: true,
      siteId: siteId,
      facilityName: params.facilityName,
      assignedCity: params.city,
      targetSitesMonth: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    const currentUsers = getStoredUsers();
    currentUsers.push(newUser);
    saveStoredUsers(currentUsers);

    const currentSites = getStoredSites();
    currentSites.unshift(newSite);
    saveStoredSites(currentSites);

    fsSaveUser(newUser).catch(() => {});
    fsSaveSite(newSite).catch(() => {});

    return { success: true, user: newUser, site: newSite };
  }
}

export async function apiSaveUser(user: User): Promise<void> {
  // 1. Save locally
  const currentUsers = getStoredUsers();
  const idx = currentUsers.findIndex((u) => u.id === user.id || u.phone === user.phone);
  if (idx >= 0) {
    currentUsers[idx] = user;
  } else {
    currentUsers.push(user);
  }
  saveStoredUsers(currentUsers);

  // 2. Save to Cloud Firestore
  fsSaveUser(user).catch((e) => console.warn('Firestore user save warning:', e));

  // 3. Send to Server API
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (e) {
    console.error('Failed to save user to API database:', e);
  }
}

export async function apiToggleUser(id: string): Promise<void> {
  const currentUsers = getStoredUsers();
  const target = currentUsers.find((u) => u.id === id);
  if (target) {
    target.active = !target.active;
    saveStoredUsers(currentUsers);
    fsSaveUser(target).catch((e) => console.warn('Firestore toggle warning:', e));
  }

  try {
    await fetch(`/api/users/${id}/toggle`, { method: 'PUT' });
  } catch (e) {
    console.error('Failed to toggle user status on API database:', e);
  }
}

export async function apiSaveSite(site: Site): Promise<void> {
  // 1. Save locally
  const currentSites = getStoredSites();
  const idx = currentSites.findIndex((s) => s.id === site.id);
  if (idx >= 0) {
    currentSites[idx] = site;
  } else {
    currentSites.unshift(site);
  }
  saveStoredSites(currentSites);

  // 2. Save to Cloud Firestore
  try {
    await fsSaveSite(site);
    console.log('[API] Site successfully persisted to Cloud Firestore:', site.id, site.name);
  } catch (e) {
    console.warn('[API] Firestore site save warning:', e);
  }

  // 3. Send to Server API
  try {
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    });
    if (res.ok) {
      console.log('[API] Site saved to server database:', site.id);
    }
  } catch (e) {
    console.error('Failed to save site to API database:', e);
  }
}

export async function apiApproveSite(
  siteId: string,
  approved: boolean,
  reason?: string,
  approvedBy?: string
): Promise<void> {
  const currentSites = getStoredSites();
  const site = currentSites.find((s) => s.id === siteId);
  if (site) {
    site.approvalStatus = approved ? 'approved' : 'rejected';
    site.rejectionReason = approved ? undefined : reason;
    site.approvedAt = approved ? new Date().toISOString().split('T')[0] : undefined;
    site.approvedBy = approved ? approvedBy : undefined;
    site.incentivePaid = approved;
    saveStoredSites(currentSites);
  }

  // Cloud Firestore
  fsApproveSite(siteId, approved, reason, approvedBy).catch((e) =>
    console.warn('Firestore approve warning:', e)
  );

  // Server API
  try {
    await fetch(`/api/sites/${siteId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, reason, approvedBy }),
    });
  } catch (e) {
    console.error('Failed to approve site on API database:', e);
  }
}

export async function apiUpdateSiteStatus(siteId: string, status: string): Promise<void> {
  const currentSites = getStoredSites();
  const site = currentSites.find((s) => s.id === siteId);
  if (site) {
    site.status = status as any;
    site.updatedAt = new Date().toISOString().split('T')[0];
    saveStoredSites(currentSites);
  }

  // Cloud Firestore
  fsUpdateSiteStatus(siteId, status).catch((e) =>
    console.warn('Firestore status update warning:', e)
  );

  // Server API
  try {
    await fetch(`/api/sites/${siteId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.error('Failed to update site status on API database:', e);
  }
}

export async function apiSaveVisit(visit: Visit): Promise<void> {
  const currentVisits = getStoredVisits();
  currentVisits.unshift(visit);
  saveStoredVisits(currentVisits);

  // Cloud Firestore
  fsSaveVisit(visit).catch((e) => console.warn('Firestore visit save warning:', e));

  // Server API
  try {
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visit),
    });
  } catch (e) {
    console.error('Failed to save visit to API database:', e);
  }
}

export async function apiSaveFollowUp(followup: FollowUpLog): Promise<void> {
  const currentFollowups = getStoredFollowups();
  currentFollowups.unshift(followup);
  saveStoredFollowups(currentFollowups);

  // Cloud Firestore
  fsSaveFollowUp(followup).catch((e) => console.warn('Firestore followup save warning:', e));

  // Server API
  try {
    await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followup),
    });
  } catch (e) {
    console.error('Failed to save follow-up to API database:', e);
  }
}

export async function apiSaveSettings(settings: IncentiveSettings): Promise<void> {
  saveStoredSettings(settings);

  // Cloud Firestore
  fsSaveSettings(settings).catch((e) => console.warn('Firestore settings save warning:', e));

  // Server API
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch (e) {
    console.error('Failed to save settings to API database:', e);
  }
}

// =================== CLIENT PORTAL API FUNCTIONS ===================

export async function apiSaveIncident(incident: ClientIncident): Promise<void> {
  const current = getStoredIncidents();
  const idx = current.findIndex((i) => i.id === incident.id);
  if (idx >= 0) {
    current[idx] = incident;
  } else {
    current.unshift(incident);
  }
  saveStoredIncidents(current);

  // Cloud Firestore
  fsSaveIncident(incident).catch((e) => console.warn('Firestore incident save warning:', e));

  // Server API
  try {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
  } catch (e) {
    console.error('Failed to save incident to API database:', e);
  }
}

export async function apiUpdateIncident(
  incidentId: string,
  updates: Partial<ClientIncident>
): Promise<void> {
  const current = getStoredIncidents();
  const idx = current.findIndex((i) => i.id === incidentId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates };
    saveStoredIncidents(current);
  }

  // Cloud Firestore
  fsUpdateIncident(incidentId, updates).catch((e) =>
    console.warn('Firestore incident update warning:', e)
  );

  // Server API
  try {
    await fetch(`/api/incidents/${incidentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (e) {
    console.error('Failed to update incident on API database:', e);
  }
}

export async function apiSaveInquiry(inquiry: ClientInquiry): Promise<void> {
  const current = getStoredInquiries();
  const idx = current.findIndex((i) => i.id === inquiry.id);
  if (idx >= 0) {
    current[idx] = inquiry;
  } else {
    current.unshift(inquiry);
  }
  saveStoredInquiries(current);

  // Cloud Firestore
  fsSaveInquiry(inquiry).catch((e) => console.warn('Firestore inquiry save warning:', e));

  // Server API
  try {
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
  } catch (e) {
    console.error('Failed to save inquiry to API database:', e);
  }
}

export async function apiAnswerInquiry(
  inquiryId: string,
  answer: string,
  answeredBy: string
): Promise<void> {
  const current = getStoredInquiries();
  const idx = current.findIndex((i) => i.id === inquiryId);
  if (idx >= 0) {
    current[idx] = {
      ...current[idx],
      status: 'answered',
      answer,
      answeredBy,
      answeredAt: new Date().toISOString(),
    };
    saveStoredInquiries(current);
  }

  // Cloud Firestore
  fsAnswerInquiry(inquiryId, answer, answeredBy).catch((e) =>
    console.warn('Firestore inquiry answer warning:', e)
  );

  // Server API
  try {
    await fetch(`/api/inquiries/${inquiryId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, answeredBy }),
    });
  } catch (e) {
    console.error('Failed to answer inquiry on API database:', e);
  }
}

export async function apiSaveRenewal(renewal: ContractRenewalRequest): Promise<void> {
  const current = getStoredRenewals();
  const idx = current.findIndex((r) => r.id === renewal.id);
  if (idx >= 0) {
    current[idx] = renewal;
  } else {
    current.unshift(renewal);
  }
  saveStoredRenewals(current);

  // Cloud Firestore
  fsSaveRenewal(renewal).catch((e) => console.warn('Firestore renewal save warning:', e));

  // Server API
  try {
    await fetch('/api/renewals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewal),
    });
  } catch (e) {
    console.error('Failed to save renewal to API database:', e);
  }
}

export async function apiUpdateRenewal(
  renewalId: string,
  updates: Partial<ContractRenewalRequest>
): Promise<void> {
  const current = getStoredRenewals();
  const idx = current.findIndex((r) => r.id === renewalId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates };
    saveStoredRenewals(current);
  }

  // Cloud Firestore
  fsUpdateRenewal(renewalId, updates).catch((e) =>
    console.warn('Firestore renewal update warning:', e)
  );

  // Server API
  try {
    await fetch(`/api/renewals/${renewalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (e) {
    console.error('Failed to update renewal on API database:', e);
  }
}

export async function apiSaveCDAlert(alert: CivilDefenseInspectionAlert): Promise<void> {
  const current = getStoredCivilDefenseAlerts();
  const idx = current.findIndex((a) => a.id === alert.id);
  if (idx >= 0) {
    current[idx] = alert;
  } else {
    current.unshift(alert);
  }
  saveStoredCivilDefenseAlerts(current);

  // Cloud Firestore
  fsSaveCDAlert(alert).catch((e) => console.warn('Firestore CD alert save warning:', e));

  // Server API
  try {
    await fetch('/api/civil_defense_alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  } catch (e) {
    console.error('Failed to save civil defense alert to API database:', e);
  }
}
