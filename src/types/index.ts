export type UserRole = 'admin' | 'supervisor' | 'agent';

export interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  password?: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  targetSitesMonth: number;
  assignedCity: string;
  joinedDate: string;
}

export const SAUDI_CITIES = [
  'الرياض',
  'جدة',
  'الدمام',
  'خميس مشيط',
  'أبها',
  'الخبر',
  'مكة المكرمة',
  'المدينة المنورة',
  'القصيم / بريدة',
  'تبوك',
  'حائل',
  'نجران',
  'جازان',
  'أخرى',
] as const;

export type SiteType = 
  | 'مطعم'
  | 'فندق'
  | 'مستشفى'
  | 'مدرسة'
  | 'مستودع'
  | 'مصنع'
  | 'مكتب'
  | 'مجمع تجاري'
  | 'محطة وقود'
  | 'أخرى';

export type SiteStatus = 
  | 'new_opportunity'     // 🟢 فرصة جديدة
  | 'needs_followup'      // 🟡 يحتاج متابعة
  | 'competitor_contract' // 🔵 لديه عقد مع شركة أخرى
  | 'expiring_soon'       // 🟠 العقد قريب الانتهاء
  | 'urgent_maintenance'  // 🔴 يحتاج صيانة عاجلة
  | 'no_opportunity';     // ⚫ لا توجد فرصة حاليًا

export type SiteApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ExtinguisherDetails {
  totalCount: number;
  types: ('powder' | 'co2' | 'foam' | 'water')[];
  needsMaintenance: boolean;
  needsReplacement: boolean;
  needsNewInstall: boolean;
  notes?: string;
  photos?: string[];
}

export interface AlarmSystemDetails {
  exists: boolean;
  working: boolean;
  needsMaintenance: boolean;
  needsInstall: boolean;
  detectorCount: number;
  callPointCount: number;
  panelType: string; // تقليدي / معنون (Addressable / Conventional)
  notes?: string;
  photos?: string[];
}

export interface SprinklerAndPumpDetails {
  sprinklersExist: boolean;
  sprinklersCount: number;
  sprinklersCondition: 'good' | 'maintenance_required' | 'not_working';
  pumpsExist: boolean;
  pumpsType: string; // ديزل، كهرباء، جوكي
  pumpsWorking: boolean;
  fireHoseReelsCount: number;
  fireCabinetsCount: number;
  specialSuppressionSystem: string; // كيتشن هود للطهي، FM200، Novec، لا يوجد
  specialSuppressionWorking: boolean;
  notes?: string;
  photos?: string[];
}

export interface SafetyEquipment {
  extinguishers: ExtinguisherDetails;
  alarmSystem: AlarmSystemDetails;
  waterAndPumps: SprinklerAndPumpDetails;
}

export interface LicenseInfo {
  hasLicense: 'yes' | 'no' | 'unknown';
  licenseType: string; // رخصة بلدي، صناعي، دفاع مدني
  licenseNumber: string;
  expiryDate: string;
  licensePhoto?: string;
}

export interface ContractInfo {
  hasContract: 'yes' | 'no' | 'unknown';
  companyName: string;
  startDate: string;
  endDate: string;
  annualValue?: number;
  contractPhoto?: string;
}

export interface CivilDefenseInfo {
  hasRecord: boolean;
  lastVisitDate?: string;
  nextVisitDate?: string;
  reportNumber?: string;
  inspectorName?: string;
  notes?: string;
  reportPhoto?: string;
}

export interface Site {
  id: string;
  name: string;
  type: SiteType;
  managerName: string;
  phone: string;
  altPhone?: string;
  city: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  sitePhoto?: string;
  license: LicenseInfo;
  contract: ContractInfo;
  equipment: SafetyEquipment;
  civilDefense: CivilDefenseInfo;
  status: SiteStatus;
  approvalStatus: SiteApprovalStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdByAgentId: string;
  createdByAgentName: string;
  createdAt: string;
  updatedAt: string;
  incentiveAmount: number; // e.g. 1.50 SAR
  incentivePaid: boolean;
  notes?: string;
  visitsCount: number;
  lastVisitDate?: string;
}

export interface Visit {
  id: string;
  siteId: string;
  siteName: string;
  agentId: string;
  agentName: string;
  visitDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  deviceModel: string;
  notes: string;
  outcomeStatus: SiteStatus;
  photos: string[];
  civilDefenseInspectionDate?: string;
  nextFollowupDate?: string;
  status: 'completed' | 'in_progress';
}

export interface FollowUpLog {
  id: string;
  siteId: string;
  agentId: string;
  agentName: string;
  date: string;
  action: 'call' | 'visit' | 'quotation_sent' | 'contract_signed' | 'note';
  summary: string;
}

export interface IncentiveSettings {
  ratePerApprovedSiteSAR: number; // Default: 1.50 SAR
  minTargetSites: number;         // e.g. 300
  targetBonusSAR: number;         // e.g. 100 SAR bonus
  tier2TargetSites: number;       // e.g. 500
  tier2BonusSAR: number;          // e.g. 250 SAR bonus
}

export interface ProximityAlert {
  existingSite: Site;
  distanceMeters: number;
}
