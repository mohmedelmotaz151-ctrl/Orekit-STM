import { 
  User, 
  Site, 
  Visit, 
  FollowUpLog, 
  IncentiveSettings,
  ClientIncident,
  ClientInquiry,
  ContractRenewalRequest,
  CivilDefenseInspectionAlert
} from '../types';

const USERS_KEY = 'oriket_users_v3';
const SITES_KEY = 'oriket_sites_v3';
const VISITS_KEY = 'oriket_visits_v3';
const FOLLOWUPS_KEY = 'oriket_followups_v3';
const SETTINGS_KEY = 'oriket_settings_v3';
const CURRENT_USER_KEY = 'oriket_current_user_v3';
const INCIDENTS_KEY = 'oriket_incidents_v3';
const INQUIRIES_KEY = 'oriket_inquiries_v3';
const RENEWALS_KEY = 'oriket_renewals_v3';
const CD_ALERTS_KEY = 'oriket_cd_alerts_v3';

// Clear legacy v1 & v2 test/mock data from localStorage
try {
  ['v1', 'v2'].forEach((v) => {
    localStorage.removeItem(`oriket_users_${v}`);
    localStorage.removeItem(`oriket_sites_${v}`);
    localStorage.removeItem(`oriket_visits_${v}`);
    localStorage.removeItem(`oriket_followups_${v}`);
    localStorage.removeItem(`oriket_current_user_${v}`);
    localStorage.removeItem(`oriket_settings_${v}`);
  });
} catch {
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
// الهاتف / اسم المستخدم: 0555334577
// كلمة المرور: 5520
export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_oriket',
    name: 'إدارة شركة أوريكيت',
    username: '0555334577',
    phone: '0555334577',
    password: '5520',
    role: 'admin',
    active: true,
    targetSitesMonth: 0,
    assignedCity: 'المملكة العربية السعودية',
    joinedDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'user_client_demo',
    name: 'عبدالله السبيعي (مسؤول السلامة)',
    username: '0500112233',
    phone: '0500112233',
    password: '1234',
    role: 'client',
    active: true,
    targetSitesMonth: 0,
    assignedCity: 'الرياض',
    facilityName: 'مجمع أسواق السلام التجاري',
    joinedDate: new Date().toISOString().split('T')[0],
  },
];

// Production mode: no demonstration/test sites are seeded.
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
    // Ensure our admin user with 0555334577 (or previous 0555335477) / 5520 always exists and is up to date
    const adminIdx = parsed.findIndex((u: User) => u.phone === '0555334577' || u.username === '0555334577' || u.phone === '0555335477' || u.username === '0555335477' || u.id === 'user_admin_oriket');
    if (adminIdx >= 0) {
      parsed[adminIdx].phone = '0555334577';
      parsed[adminIdx].username = '0555334577';
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    } else {
      parsed.unshift(INITIAL_USERS[0]);
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    }
    const hasClient = parsed.some((u: User) => u.phone === '0500112233' || u.username === '0500112233');
    if (!hasClient && INITIAL_USERS[1]) {
      parsed.push(INITIAL_USERS[1]);
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

export function normalizeSite(raw: any): Site {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }
  return {
    ...raw,
    id: raw.id || `site_${Date.now()}`,
    name: raw.name || 'موقع بدون اسم',
    type: raw.type || 'أخرى',
    managerName: raw.managerName || 'المسؤول',
    phone: raw.phone || '',
    altPhone: raw.altPhone || '',
    city: raw.city || 'الرياض',
    district: raw.district || '',
    address: raw.address || '',
    latitude: typeof raw.latitude === 'number' ? raw.latitude : 24.7136,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : 46.6753,
    sitePhoto: raw.sitePhoto || '',
    license: {
      hasLicense: raw.license?.hasLicense || 'unknown',
      licenseType: raw.license?.licenseType || 'رخصة سلامة الدفاع المدني',
      licenseNumber: raw.license?.licenseNumber || '',
      expiryDate: raw.license?.expiryDate || '',
      licensePhoto: raw.license?.licensePhoto || '',
      ...(raw.license || {}),
    },
    contract: {
      hasContract: raw.contract?.hasContract || 'no',
      companyName: raw.contract?.companyName || '',
      startDate: raw.contract?.startDate || '',
      endDate: raw.contract?.endDate || '',
      annualValue: raw.contract?.annualValue,
      contractPhoto: raw.contract?.contractPhoto || '',
      ...(raw.contract || {}),
    },
    equipment: {
      extinguishers: {
        totalCount: Number(raw.equipment?.extinguishers?.totalCount) || 0,
        types: Array.isArray(raw.equipment?.extinguishers?.types) ? raw.equipment.extinguishers.types : ['powder'],
        needsMaintenance: Boolean(raw.equipment?.extinguishers?.needsMaintenance),
        needsReplacement: Boolean(raw.equipment?.extinguishers?.needsReplacement),
        needsNewInstall: Boolean(raw.equipment?.extinguishers?.needsNewInstall),
        notes: raw.equipment?.extinguishers?.notes || '',
      },
      alarmSystem: {
        exists: Boolean(raw.equipment?.alarmSystem?.exists ?? true),
        working: Boolean(raw.equipment?.alarmSystem?.working ?? true),
        needsMaintenance: Boolean(raw.equipment?.alarmSystem?.needsMaintenance),
        needsInstall: Boolean(raw.equipment?.alarmSystem?.needsInstall),
        detectorCount: Number(raw.equipment?.alarmSystem?.detectorCount) || 0,
        callPointCount: Number(raw.equipment?.alarmSystem?.callPointCount) || 0,
        panelType: raw.equipment?.alarmSystem?.panelType || 'معنون Addressable',
      },
      waterAndPumps: {
        sprinklersExist: Boolean(raw.equipment?.waterAndPumps?.sprinklersExist),
        sprinklersCount: Number(raw.equipment?.waterAndPumps?.sprinklersCount) || 0,
        sprinklersCondition: raw.equipment?.waterAndPumps?.sprinklersCondition || 'not_working',
        pumpsExist: Boolean(raw.equipment?.waterAndPumps?.pumpsExist),
        pumpsType: raw.equipment?.waterAndPumps?.pumpsType || 'كهربائية',
        pumpsWorking: Boolean(raw.equipment?.waterAndPumps?.pumpsWorking),
        fireHoseReelsCount: Number(raw.equipment?.waterAndPumps?.fireHoseReelsCount) || 0,
        fireCabinetsCount: Number(raw.equipment?.waterAndPumps?.fireCabinetsCount) || 0,
        specialSuppressionSystem: raw.equipment?.waterAndPumps?.specialSuppressionSystem || 'لا يوجد',
        specialSuppressionWorking: Boolean(raw.equipment?.waterAndPumps?.specialSuppressionWorking),
      },
      ...(raw.equipment || {}),
    },
    civilDefense: {
      hasRecord: Boolean(raw.civilDefense?.hasRecord ?? true),
      lastVisitDate: raw.civilDefense?.lastVisitDate || '',
      nextVisitDate: raw.civilDefense?.nextVisitDate || '',
      reportNumber: raw.civilDefense?.reportNumber || '',
      inspectorName: raw.civilDefense?.inspectorName || '',
      notes: raw.civilDefense?.notes || '',
      reportPhoto: raw.civilDefense?.reportPhoto || '',
      ...(raw.civilDefense || {}),
    },
    extinguisherMaintenance: {
      hasMaintenancePlan: Boolean(raw.extinguisherMaintenance?.hasMaintenancePlan ?? (raw.approvalStatus === 'approved')),
      lastMaintenanceDate: raw.extinguisherMaintenance?.lastMaintenanceDate || (raw.approvedAt ? raw.approvedAt.split('T')[0] : (raw.createdAt || new Date().toISOString().split('T')[0])),
      expiryDate: raw.extinguisherMaintenance?.expiryDate || (raw.approvalStatus === 'approved' ? (() => {
        const base = new Date(raw.approvedAt ? raw.approvedAt.split('T')[0] : (raw.createdAt || new Date().toISOString().split('T')[0]));
        if (!isNaN(base.getTime())) {
          base.setFullYear(base.getFullYear() + 1);
          return base.toISOString().split('T')[0];
        }
        return '';
      })() : ''),
      maintenanceCompany: raw.extinguisherMaintenance?.maintenanceCompany || 'شركة أوريكيت للسلامة والوقاية من الحريق',
      technicianName: raw.extinguisherMaintenance?.technicianName || 'فني صيانة أوريكيت',
      certificateOrTagNumber: raw.extinguisherMaintenance?.certificateOrTagNumber || (raw.id ? `EXT-${raw.id.slice(-6).toUpperCase()}` : 'EXT-ORIKET'),
      cylinderPressureChecked: Boolean(raw.extinguisherMaintenance?.cylinderPressureChecked ?? true),
      hydrostaticTestDate: raw.extinguisherMaintenance?.hydrostaticTestDate || '',
      status: raw.extinguisherMaintenance?.status || 'valid',
      powderCount: Number(raw.extinguisherMaintenance?.powderCount ?? (raw.equipment?.extinguishers?.totalCount || 0)),
      co2Count: Number(raw.extinguisherMaintenance?.co2Count ?? 0),
      foamCount: Number(raw.extinguisherMaintenance?.foamCount ?? 0),
      waterCount: Number(raw.extinguisherMaintenance?.waterCount ?? 0),
      wetChemicalCount: Number(raw.extinguisherMaintenance?.wetChemicalCount ?? 0),
      cleanAgentCount: Number(raw.extinguisherMaintenance?.cleanAgentCount ?? 0),
      reminder10DaysNotified: Boolean(raw.extinguisherMaintenance?.reminder10DaysNotified ?? false),
      notes: raw.extinguisherMaintenance?.notes || '',
      logs: Array.isArray(raw.extinguisherMaintenance?.logs) ? raw.extinguisherMaintenance.logs : [],
      ...(raw.extinguisherMaintenance || {}),
    },
    status: raw.status || 'new_opportunity',
    approvalStatus: raw.approvalStatus || 'pending',
    createdByAgentId: raw.createdByAgentId || '',
    createdByAgentName: raw.createdByAgentName || '',
    createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: raw.updatedAt || new Date().toISOString().split('T')[0],
    incentiveAmount: Number(raw.incentiveAmount) || 1.5,
    incentivePaid: Boolean(raw.incentivePaid),
    visitsCount: Number(raw.visitsCount) || 1,
  };
}

const DEMO_SITE_IDS = new Set([
  'site_salam_mall',
  'site_shawayah_gulf',
  'site_yamama_warehouses',
  'site_palace_hotel',
]);

export function getStoredSites(): Site[] {
  try {
    const raw = localStorage.getItem(SITES_KEY);
    if (!raw) {
      localStorage.setItem(SITES_KEY, JSON.stringify(INITIAL_SITES));
      return INITIAL_SITES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const productionSites = parsed
        .filter((site: Site) => !DEMO_SITE_IDS.has(site.id))
        .map(normalizeSite);
      localStorage.setItem(SITES_KEY, JSON.stringify(productionSites));
      return productionSites;
    }
    localStorage.setItem(SITES_KEY, JSON.stringify(INITIAL_SITES));
    return INITIAL_SITES;
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

// Client Portal Entities Storage Handlers
export function getStoredIncidents(): ClientIncident[] {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredIncidents(incidents: ClientIncident[]): void {
  try {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
  } catch (e) {
    console.error('Failed to save incidents', e);
  }
}

export function getStoredInquiries(): ClientInquiry[] {
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredInquiries(inquiries: ClientInquiry[]): void {
  try {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch (e) {
    console.error('Failed to save inquiries', e);
  }
}

export function getStoredRenewals(): ContractRenewalRequest[] {
  try {
    const raw = localStorage.getItem(RENEWALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredRenewals(renewals: ContractRenewalRequest[]): void {
  try {
    localStorage.setItem(RENEWALS_KEY, JSON.stringify(renewals));
  } catch (e) {
    console.error('Failed to save renewals', e);
  }
}

export function getStoredCivilDefenseAlerts(): CivilDefenseInspectionAlert[] {
  try {
    const raw = localStorage.getItem(CD_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCivilDefenseAlerts(alerts: CivilDefenseInspectionAlert[]): void {
  try {
    localStorage.setItem(CD_ALERTS_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Failed to save civil defense alerts', e);
  }
}

/**
 * Calculates financial incentives for an agent
 */
export function calculateAgentIncentives(
  agentId: string,
  sites: Site[],
  settings: IncentiveSettings,
  agentName?: string
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
  const agentSites = sites.filter(
    (s) => s.createdByAgentId === agentId || (agentName && s.createdByAgentName === agentName)
  );
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

// =================== SERVICE ORDERS STORAGE ===================
const ORDERS_KEY = 'orkeit_service_orders_v1';

export const INITIAL_ORDERS: import('../types').OrkeitServiceOrder[] = [
  {
    id: 'ord_1042',
    orderNumber: 'ORKEIT-2026-1042',
    serviceType: 'زيارة فحص ومعاينة أنظمة السلامة',
    serviceCategory: 'visit',
    siteName: 'مطعم شواية الخليج الحديث',
    clientName: 'سلمان العتيبي',
    clientPhone: '0555334577',
    date: '03 أكتوبر 2026',
    createdAt: '2026-10-03T14:30:00.000Z',
    status: 'review',
    statusLabel: 'المراجعة والتدقيق',
    estimatedCompletion: 'خلال 24 ساعة',
    notes: 'مطلوب فحص مضخات الحريق وشبكة الرش الآلي وإصدار تقرير كفاءة لمنصة سلامة.',
    urgent: false,
    isReadByAdmin: false,
  },
  {
    id: 'ord_1038',
    orderNumber: 'ORKEIT-2026-1038',
    serviceType: 'عقد صيانة سنوي معتمد للدفاع المدني',
    serviceCategory: 'contract',
    siteName: 'مستودعات السلي اللوجستية',
    clientName: 'عبدالرحمن الشهري',
    clientPhone: '0501234567',
    date: '01 أكتوبر 2026',
    status: 'in_progress',
    statusLabel: 'قيد التنفيذ والتركيب',
    estimatedCompletion: 'غداً الساعة 2:00 م',
    notes: 'تجديد العقد الإلكتروني وربطه بنظام سلامة مع صيانة 48 طفاية بودرة وCO2.',
    urgent: false,
  },
  {
    id: 'ord_1015',
    orderNumber: 'ORKEIT-2026-1015',
    serviceType: 'تمديد وتجديد شهادة الدفاع المدني وبلدي',
    serviceCategory: 'civil_defense',
    siteName: 'مركز الأندلس الطبي',
    clientName: 'د. خالد الزهراني',
    clientPhone: '0544998877',
    date: '28 سبتمبر 2026',
    status: 'completed',
    statusLabel: 'مكتمل وتسليم التقرير',
    estimatedCompletion: 'مكتمل ومسلّم',
    notes: 'تمت الزيارة واختبار أجهزة الإنذار وتسليم التقرير المعتمد وتمديد الرخصة بنجاح.',
    urgent: false,
  },
  {
    id: 'ord_1009',
    orderNumber: 'ORKEIT-2026-1009',
    serviceType: 'فحص وصيانة وتعبئة طفايات الحريق',
    serviceCategory: 'fire_fighting',
    siteName: 'مدارس الرواد النموذجية',
    clientName: 'أ. فهد التميمي',
    clientPhone: '0533221100',
    date: '25 سبتمبر 2026',
    status: 'completed',
    statusLabel: 'مكتمل وتسليم التقرير',
    estimatedCompletion: 'مكتمل',
    notes: 'تعبئة واختبار ضغط لـ 26 طفاية وتركيب كروت الصيانة المعتمدة برقم الملصق.',
    urgent: false,
  },
];

export function getStoredOrders(): import('../types').OrkeitServiceOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: import('../types').OrkeitServiceOrder[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save service orders', e);
  }
}
