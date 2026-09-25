import { 
  User, 
  Site, 
  Visit, 
  FollowUpLog, 
  IncentiveSettings 
} from '../types';
import { 
  saveStoredUsers, 
  saveStoredSites, 
  saveStoredVisits, 
  saveStoredFollowups, 
  saveStoredSettings 
} from './storage';

export async function fetchDatabaseData(): Promise<{
  users: User[];
  sites: Site[];
  visits: Visit[];
  followups: FollowUpLog[];
  settings: IncentiveSettings;
} | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data && Array.isArray(data.users)) {
      saveStoredUsers(data.users);
      saveStoredSites(data.sites || []);
      saveStoredVisits(data.visits || []);
      saveStoredFollowups(data.followups || []);
      if (data.settings) saveStoredSettings(data.settings);
      return data;
    }
  } catch (err) {
    console.warn('API fetch failed, utilizing cached storage:', err);
  }
  return null;
}

export async function apiSaveUser(user: User): Promise<void> {
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
  try {
    await fetch(`/api/users/${id}/toggle`, { method: 'PUT' });
  } catch (e) {
    console.error('Failed to toggle user status on API database:', e);
  }
}

export async function apiSaveSite(site: Site): Promise<void> {
  try {
    await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    });
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
