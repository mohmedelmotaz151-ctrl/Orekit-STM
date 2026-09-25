import { 
  User, 
  Site, 
  Visit, 
  FollowUpLog, 
  IncentiveSettings 
} from '../types';

const USERS_KEY = 'oriket_users_v2';
const SITES_KEY = 'oriket_sites_v2';
const VISITS_KEY = 'oriket_visits_v2';
const FOLLOWUPS_KEY = 'oriket_followups_v2';
const SETTINGS_KEY = 'oriket_settings_v2';
const CURRENT_USER_KEY = 'oriket_current_user_v2';

// Clear legacy v1 mock data if present
try {
  localStorage.removeItem('oriket_users_v1');
  localStorage.removeItem('oriket_sites_v1');
  localStorage.removeItem('oriket_visits_v1');
  localStorage.removeItem('oriket_followups_v1');
  localStorage.removeItem('oriket_current_user_v1');
} catch (e) {
  // ignore
}

export const INITIAL_SETTINGS: IncentiveSettings = {
  ratePerApprovedSiteSAR: 1.50,
  minTargetSites: 300,
  targetBonusSAR: 100.0,
  tier2TargetSites: 500,
  tier2BonusSAR: 250.0,
};

// ONLY the Admin user requested by user:
// الهاتف / اسم المستخدم: 0555335477
// كلمة المرور: 5520
export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_oriket',
    name: 'إدارة شركة أوريكيت',
    username: '0555335477',
    phone: '0555335477',
    password: '5520',
    role: 'admin',
    active: true,
    targetSitesMonth: 0,
    assignedCity: 'المملكة العربية السعودية',
    joinedDate: new Date().toISOString().split('T')[0],
  },
];

// Clean slate: 0 sites, 0 visits, 0 followups
export const INITIAL_SITES: Site[] = [];
export const INITIAL_VISITS: Visit[] = [];
export const INITIAL_FOLLOWUPS: FollowUpLog[] = [];

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    // Ensure our admin user with 0555335477 / 5520 always exists
    const hasAdmin = parsed.some((u: User) => u.phone === '0555335477' || u.username === '0555335477');
    if (!hasAdmin) {
      parsed.unshift(INITIAL_USERS[0]);
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function getStoredSites(): Site[] {
  try {
    const raw = localStorage.getItem(SITES_KEY);
    if (!raw) {
      localStorage.setItem(SITES_KEY, JSON.stringify(INITIAL_SITES));
      return INITIAL_SITES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SITES;
  }
}

export function saveStoredSites(sites: Site[]): void {
  try {
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  } catch (e) {
    console.error('Failed to save sites', e);
  }
}

export function getStoredVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    if (!raw) {
      localStorage.setItem(VISITS_KEY, JSON.stringify(INITIAL_VISITS));
      return INITIAL_VISITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VISITS;
  }
}

export function saveStoredVisits(visits: Visit[]): void {
  try {
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  } catch (e) {
    console.error('Failed to save visits', e);
  }
}

export function getStoredFollowups(): FollowUpLog[] {
  try {
    const raw = localStorage.getItem(FOLLOWUPS_KEY);
    if (!raw) {
      localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(INITIAL_FOLLOWUPS));
      return INITIAL_FOLLOWUPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FOLLOWUPS;
  }
}

export function saveStoredFollowups(followups: FollowUpLog[]): void {
  try {
    localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(followups));
  } catch (e) {
    console.error('Failed to save followups', e);
  }
}

export function getStoredSettings(): IncentiveSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: IncentiveSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveStoredCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save current user', e);
  }
}

/**
 * Calculates financial incentives for an agent
 */
export function calculateAgentIncentives(
  agentId: string,
  sites: Site[],
  settings: IncentiveSettings
): {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalApprovedSAR: number;
  pendingPotentialSAR: number;
  targetCount: number;
  bonusEarnedSAR: number;
  grandTotalSAR: number;
  progressPercent: number;
} {
  const agentSites = sites.filter((s) => s.createdByAgentId === agentId);
  const approvedSites = agentSites.filter((s) => s.approvalStatus === 'approved');
  const pendingSites = agentSites.filter((s) => s.approvalStatus === 'pending');
  const rejectedSites = agentSites.filter((s) => s.approvalStatus === 'rejected');

  const rate = settings.ratePerApprovedSiteSAR || 1.50;
  
  const totalApprovedSAR = approvedSites.reduce(
    (sum, s) => sum + (s.incentiveAmount || rate),
    0
  );

  const pendingPotentialSAR = pendingSites.length * rate;

  let bonusEarnedSAR = 0;
  if (approvedSites.length >= settings.tier2TargetSites) {
    bonusEarnedSAR = settings.tier2BonusSAR;
  } else if (approvedSites.length >= settings.minTargetSites) {
    bonusEarnedSAR = settings.targetBonusSAR;
  }

  const grandTotalSAR = totalApprovedSAR + bonusEarnedSAR;
  const targetCount = settings.minTargetSites || 300;
  const progressPercent = Math.min(
    100,
    Math.round((approvedSites.length / targetCount) * 100)
  );

  return {
    approvedCount: approvedSites.length,
    pendingCount: pendingSites.length,
    rejectedCount: rejectedSites.length,
    totalApprovedSAR: Number(totalApprovedSAR.toFixed(2)),
    pendingPotentialSAR: Number(pendingPotentialSAR.toFixed(2)),
    targetCount,
    bonusEarnedSAR,
    grandTotalSAR: Number(grandTotalSAR.toFixed(2)),
    progressPercent,
  };
}

/**
 * Exports data to CSV formatted with UTF-8 BOM for Microsoft Excel (Arabic supported)
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === undefined || val === null) val = '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
