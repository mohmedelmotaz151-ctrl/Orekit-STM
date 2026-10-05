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
const getDynamicSampleSites = (): Site[] => {
  const now = new Date();
  const dIn6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dIn8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dAgo12Days = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dIn250Days = new Date(now.getTime() + 250 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const dLastYear1 = new Date(now.getTime() - (365 - 6) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dLastYear2 = new Date(now.getTime() - (365 - 8) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dLastYear3 = new Date(now.getTime() - (365 + 12) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 'site_salam_mall',
      name: 'مجمع أسواق السلام التجاري',
      type: 'مجمع تجاري',
      managerName: 'أ. فهد التميمي',
      phone: '0555334577',
      city: 'الرياض',
      district: 'الملز',
      address: 'طريق صلاح الدين الأيوبي - الملز',
      latitude: 24.6681,
      longitude: 46.7219,
      license: {
        hasLicense: 'yes',
        licenseType: 'بلدي ودفاع مدني',
        licenseNumber: 'LIC-2024-8841',
        expiryDate: dIn6Days,
      },
      contract: {
        hasContract: 'yes',
        companyName: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        startDate: dLastYear1,
        endDate: dIn6Days,
        annualValue: 8500,
      },
      equipment: {
        extinguishers: {
          totalCount: 16,
          types: ['powder', 'co2', 'foam'],
          needsMaintenance: true,
          needsReplacement: false,
          needsNewInstall: false,
        },
        alarmSystem: { exists: true, working: true, needsMaintenance: false, needsInstall: false, detectorCount: 48, callPointCount: 12, panelType: 'معنون Addressable' },
        waterAndPumps: { sprinklersExist: true, sprinklersCount: 220, sprinklersCondition: 'good', pumpsExist: true, pumpsType: 'ديزل + كهرباء + جوكي', pumpsWorking: true, fireHoseReelsCount: 6, fireCabinetsCount: 6, specialSuppressionSystem: 'لا يوجد', specialSuppressionWorking: true },
      },
      civilDefense: {
        hasRecord: true,
        lastVisitDate: dLastYear1,
        nextVisitDate: dIn6Days,
        reportNumber: 'CD-88419',
        inspectorName: 'ملازم أول خالد الشمري',
        notes: 'المنشأة بحاجة لتجديد كروت الصيانة لكفايات الحريق خلال المهلة',
      },
      extinguisherMaintenance: {
        hasMaintenancePlan: true,
        lastMaintenanceDate: dLastYear1,
        expiryDate: dIn6Days, // ⚡ In 6 days (due for 10-day reminder!)
        maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        technicianName: 'م. حسام العتيبي',
        certificateOrTagNumber: 'EXT-SALAM-8841',
        cylinderPressureChecked: true,
        status: 'expiring_soon',
        powderCount: 8,
        co2Count: 4,
        foamCount: 2,
        waterCount: 0,
        wetChemicalCount: 2,
        cleanAgentCount: 0,
        reminder10DaysNotified: false,
        notes: 'متبقي 6 أيام على انتهاء الصلاحية - مطلوب فحص الضغط وتعبئة فورية',
      },
      status: 'expiring_soon',
      approvalStatus: 'approved',
      createdByAgentId: 'agent_1',
      createdByAgentName: 'أحمد الغامدي',
      createdAt: dLastYear1,
      updatedAt: dLastYear1,
      incentiveAmount: 1.5,
      incentivePaid: true,
      visitsCount: 3,
    },
    {
      id: 'site_shawayah_gulf',
      name: 'مطاعم شواية الخليج والمذاق',
      type: 'مطعم',
      managerName: 'أ. عبدالسلام الشهري',
      phone: '0555334577',
      city: 'الرياض',
      district: 'السليمانية',
      address: 'شارع الملك عبدالعزيز - السليمانية',
      latitude: 24.7082,
      longitude: 46.6983,
      license: {
        hasLicense: 'yes',
        licenseType: 'رخصة أنشطة غذائية وسلامة',
        licenseNumber: 'LIC-2024-5521',
        expiryDate: dIn8Days,
      },
      contract: {
        hasContract: 'yes',
        companyName: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        startDate: dLastYear2,
        endDate: dIn8Days,
        annualValue: 5200,
      },
      equipment: {
        extinguishers: {
          totalCount: 8,
          types: ['powder', 'co2'],
          needsMaintenance: true,
          needsReplacement: false,
          needsNewInstall: false,
        },
        alarmSystem: { exists: true, working: true, needsMaintenance: false, needsInstall: false, detectorCount: 16, callPointCount: 4, panelType: 'تقليدي Conventional' },
        waterAndPumps: { sprinklersExist: false, sprinklersCount: 0, sprinklersCondition: 'good', pumpsExist: false, pumpsType: '', pumpsWorking: false, fireHoseReelsCount: 2, fireCabinetsCount: 2, specialSuppressionSystem: 'كيتشن هود Wet Chemical', specialSuppressionWorking: true },
      },
      civilDefense: {
        hasRecord: true,
        lastVisitDate: dLastYear2,
        nextVisitDate: dIn8Days,
        reportNumber: 'CD-55214',
        inspectorName: 'نقيب سلطان الحربي',
      },
      extinguisherMaintenance: {
        hasMaintenancePlan: true,
        lastMaintenanceDate: dLastYear2,
        expiryDate: dIn8Days, // ⚡ In 8 days (due for 10-day reminder!)
        maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        technicianName: 'فني معتمد طارق النمري',
        certificateOrTagNumber: 'EXT-GULF-5521',
        cylinderPressureChecked: true,
        status: 'expiring_soon',
        powderCount: 4,
        co2Count: 2,
        foamCount: 0,
        waterCount: 0,
        wetChemicalCount: 2,
        cleanAgentCount: 0,
        reminder10DaysNotified: false,
        notes: 'متبقي 8 أيام على انتهاء كفايات المطعم وكيتشن هود المطبخ',
      },
      status: 'expiring_soon',
      approvalStatus: 'approved',
      createdByAgentId: 'agent_1',
      createdByAgentName: 'أحمد الغامدي',
      createdAt: dLastYear2,
      updatedAt: dLastYear2,
      incentiveAmount: 1.5,
      incentivePaid: true,
      visitsCount: 2,
    },
    {
      id: 'site_yamama_warehouses',
      name: 'مستودعات اليمامة المركزية',
      type: 'مستودع',
      managerName: 'م. إبراهيم الدوسري',
      phone: '0555334577',
      city: 'الدمام',
      district: 'الخالدية',
      address: 'المنطقة الصناعية الأولى - مستودع B4',
      latitude: 26.4207,
      longitude: 50.0888,
      license: {
        hasLicense: 'yes',
        licenseType: 'رخصة صناعية ولوجستية',
        licenseNumber: 'LIC-2023-1109',
        expiryDate: dAgo12Days,
      },
      contract: {
        hasContract: 'yes',
        companyName: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        startDate: dLastYear3,
        endDate: dAgo12Days,
        annualValue: 12000,
      },
      equipment: {
        extinguishers: {
          totalCount: 24,
          types: ['powder', 'co2', 'water'],
          needsMaintenance: true,
          needsReplacement: true,
          needsNewInstall: false,
        },
        alarmSystem: { exists: true, working: false, needsMaintenance: true, needsInstall: false, detectorCount: 64, callPointCount: 16, panelType: 'معنون Addressable' },
        waterAndPumps: { sprinklersExist: true, sprinklersCount: 450, sprinklersCondition: 'maintenance_required', pumpsExist: true, pumpsType: 'ديزل + كهرباء', pumpsWorking: true, fireHoseReelsCount: 8, fireCabinetsCount: 8, specialSuppressionSystem: 'لا يوجد', specialSuppressionWorking: true },
      },
      civilDefense: {
        hasRecord: true,
        lastVisitDate: dLastYear3,
        nextVisitDate: dAgo12Days,
        reportNumber: 'CD-11093',
        inspectorName: 'رائد ماجد القحطاني',
        notes: 'إشعار صيانة ومخالفة تأخير فحص كفايات الحريق',
      },
      extinguisherMaintenance: {
        hasMaintenancePlan: true,
        lastMaintenanceDate: dLastYear3,
        expiryDate: dAgo12Days, // 🔴 Expired 12 days ago!
        maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        technicianName: 'فني صيانة معتمد',
        certificateOrTagNumber: 'EXT-YAMAMA-1109',
        cylinderPressureChecked: false,
        status: 'expired',
        powderCount: 14,
        co2Count: 6,
        foamCount: 0,
        waterCount: 4,
        wetChemicalCount: 0,
        cleanAgentCount: 0,
        reminder10DaysNotified: true,
        notes: 'منتهية الصلاحية منذ 12 يوم - بحاجة لتعبئة فورية واستبدال صمامات',
      },
      status: 'urgent_maintenance',
      approvalStatus: 'approved',
      createdByAgentId: 'agent_2',
      createdByAgentName: 'خالد السبيعي',
      createdAt: dLastYear3,
      updatedAt: dLastYear3,
      incentiveAmount: 1.5,
      incentivePaid: true,
      visitsCount: 4,
    },
    {
      id: 'site_palace_hotel',
      name: 'فندق قصر الرياض الدولي',
      type: 'فندق',
      managerName: 'أ. منصور العلي',
      phone: '0555334577',
      city: 'الرياض',
      district: 'العليا',
      address: 'طريق الملك فهد - حي العليا',
      latitude: 24.7136,
      longitude: 46.6753,
      license: {
        hasLicense: 'yes',
        licenseType: 'رخصة فندقية وسياحية',
        licenseNumber: 'LIC-2026-9923',
        expiryDate: dIn250Days,
      },
      contract: {
        hasContract: 'yes',
        companyName: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        startDate: dMonthsAgo,
        endDate: dIn250Days,
        annualValue: 24000,
      },
      equipment: {
        extinguishers: {
          totalCount: 30,
          types: ['powder', 'co2', 'foam'],
          needsMaintenance: false,
          needsReplacement: false,
          needsNewInstall: false,
        },
        alarmSystem: { exists: true, working: true, needsMaintenance: false, needsInstall: false, detectorCount: 120, callPointCount: 24, panelType: 'معنون Addressable' },
        waterAndPumps: { sprinklersExist: true, sprinklersCount: 600, sprinklersCondition: 'good', pumpsExist: true, pumpsType: 'ديزل + كهرباء + جوكي', pumpsWorking: true, fireHoseReelsCount: 12, fireCabinetsCount: 12, specialSuppressionSystem: 'FM-200 بغرف السيرفرات', specialSuppressionWorking: true },
      },
      civilDefense: {
        hasRecord: true,
        lastVisitDate: dMonthsAgo,
        nextVisitDate: dIn250Days,
        reportNumber: 'CD-99231',
        inspectorName: 'عقيد سعد المطيري',
      },
      extinguisherMaintenance: {
        hasMaintenancePlan: true,
        lastMaintenanceDate: dMonthsAgo,
        expiryDate: dIn250Days, // 🟢 Valid (250 days remaining)
        maintenanceCompany: 'شركة أوريكيت للسلامة والوقاية من الحريق',
        technicianName: 'م. حسام العتيبي',
        certificateOrTagNumber: 'EXT-PALACE-9923',
        cylinderPressureChecked: true,
        status: 'valid',
        powderCount: 15,
        co2Count: 8,
        foamCount: 4,
        waterCount: 0,
        wetChemicalCount: 0,
        cleanAgentCount: 3,
        reminder10DaysNotified: false,
        notes: 'كفايات الفندق مفحوصة وسارية ومطابقة لاشتراطات الدفاع المدني',
      },
      status: 'competitor_contract',
      approvalStatus: 'approved',
      createdByAgentId: 'agent_1',
      createdByAgentName: 'أحمد الغامدي',
      createdAt: dMonthsAgo,
      updatedAt: dMonthsAgo,
      incentiveAmount: 1.5,
      incentivePaid: true,
      visitsCount: 1,
    },
  ];
};

export const INITIAL_SITES: Site[] = getDynamicSampleSites();

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

const RESTORED_SITES_MIGRATION_KEY = 'oriket_restored_sites_v1';

export function getStoredSites(): Site[] {
  try {
    const raw = localStorage.getItem(SITES_KEY);
    if (!raw) {
      localStorage.setItem(SITES_KEY, JSON.stringify(INITIAL_SITES));
      localStorage.setItem(RESTORED_SITES_MIGRATION_KEY, '1');
      return INITIAL_SITES.map(normalizeSite);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(SITES_KEY, JSON.stringify(INITIAL_SITES));
      localStorage.setItem(RESTORED_SITES_MIGRATION_KEY, '1');
      return INITIAL_SITES.map(normalizeSite);
    }

    // Restore the four previously removed company sample facilities once.
    // After this migration, normal user additions/deletions remain untouched.
    const migrated = localStorage.getItem(RESTORED_SITES_MIGRATION_KEY) === '1';
    if (parsed.length === 0 && !migrated) {
      const restored = INITIAL_SITES.map(normalizeSite);
      localStorage.setItem(SITES_KEY, JSON.stringify(restored));
      localStorage.setItem(RESTORED_SITES_MIGRATION_KEY, '1');
      return restored;
    }

    return parsed.map(normalizeSite);
  } catch {
    return INITIAL_SITES.map(normalizeSite);
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
