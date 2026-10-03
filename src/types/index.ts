export type UserRole = 'admin' | 'supervisor' | 'agent' | 'client';

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
  siteId?: string;       // Linked facility / site ID for client accounts
  facilityName?: string; // Facility name
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

export interface ExtinguisherMaintenanceLog {
  id: string;
  maintenanceDate: string; // YYYY-MM-DD
  expiryDate: string;      // YYYY-MM-DD
  technicianName?: string;
  companyName?: string;
  certificateOrTagNumber?: string;
  servicedCount: number;
  typesServiced: string[];
  status: 'completed' | 'scheduled' | 'refilled' | 'tested';
  costSAR?: number;
  notes?: string;
  createdAt: string;
}

export interface ExtinguisherMaintenanceInfo {
  hasMaintenancePlan: boolean;
  lastMaintenanceDate?: string;    // تاريخ آخر صيانة / تعبئة
  expiryDate?: string;             // تاريخ انتهاء الصلاحية / موعد الفحص القادم
  maintenanceCompany?: string;     // شركة الصيانة المسؤولة
  technicianName?: string;         // الفني المعتمد
  certificateOrTagNumber?: string; // رقم ملصق / كارت الصيانة
  cylinderPressureChecked?: boolean; // فحص مقياس الضغط
  hydrostaticTestDate?: string;    // تاريخ الفحص الهيدروستاتيكي للاسطوانات
  status: 'valid' | 'expiring_soon' | 'expired' | 'needs_refill';
  powderCount?: number;            // عدد طفايات البودرة 6 كجم
  co2Count?: number;               // عدد طفايات CO2
  foamCount?: number;              // عدد طفايات الرغوة
  waterCount?: number;             // عدد طفايات الماء / مواد رطبة
  notes?: string;
  logs?: ExtinguisherMaintenanceLog[]; // سجل دورات الصيانة السابقة
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
  extinguisherMaintenance?: ExtinguisherMaintenanceInfo;
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

// Client Portal: Incident / Maintenance Ticket (بلاغات الأعطال والصيانة)
export interface ClientIncident {
  id: string;
  siteId: string;
  siteName: string;
  clientUserId: string;
  clientName: string;
  clientPhone: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  title: string;
  category: 'extinguisher' | 'alarm' | 'pumps' | 'sprinklers' | 'emergency_light' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  locationDetails?: string; // e.g. الطابق الأول، المطبخ الرئيسي
  photo?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  assignedTechnician?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  statusHistory?: Array<{
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    changedAt: string;
    changedBy: string;
    notes?: string;
    technicianName?: string;
  }>;
}

// Client Portal: Inquiries & Consultations (الاستفسارات الفنية والاستشارات)
export interface ClientInquiry {
  id: string;
  siteId: string;
  siteName: string;
  clientUserId: string;
  clientName: string;
  clientPhone: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  subject: string;
  category: 'safety_regulations' | 'civil_defense' | 'extinguishers' | 'pricing' | 'technical';
  question: string;
  status: 'pending' | 'answered';
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}

// Client Portal: Contract Renewal Request (طلب تجديد عقد الصيانة)
export interface ContractRenewalRequest {
  id: string;
  siteId: string;
  siteName: string;
  clientUserId: string;
  clientName: string;
  clientPhone: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  currentContractEndDate?: string;
  requestedDurationYears: number; // 1 or 2 years
  notes?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'quote_sent' | 'completed';
  quotedPriceSAR?: number;
  adminResponse?: string;
  createdAt: string;
}

// Client Portal: Civil Defense Inspection Alert (تنبيهات ومواعيد زيارات الدفاع المدني)
export interface CivilDefenseInspectionAlert {
  id: string;
  siteId: string;
  siteName: string;
  scheduledDate: string; // YYYY-MM-DD
  inspectionType: 'annual' | 'license_renewal' | 'surprise_audit' | 'safety_compliance';
  inspectorNotes?: string;
  preInspectionVisitRequested: boolean;
  preInspectionVisitDate?: string;
  checklistStatus: {
    extinguishersReady: boolean;
    alarmSystemReady: boolean;
    exitsAndLightingClear: boolean;
    pumpsReady: boolean;
    contractValid: boolean;
  };
  status: 'upcoming' | 'completed' | 'passed' | 'violations_found';
  updatedAt: string;
}

// Android App: Unified Service Order & Tracking Model
export type OrderTrackingStep = 'received' | 'review' | 'pricing' | 'quote_sent' | 'in_progress' | 'completed';

export interface OrkeitServiceOrder {
  id: string;
  orderNumber: string; // e.g. ORKEIT-2026-1042
  serviceType: string; // e.g. عقد صيانة، تمديد شهادة الدفاع المدني، فحص أنظمة الإنذار، فحص أنظمة الإطفاء، زيارة فنية، طلب عرض سعر، طوارئ 24/7
  serviceCategory: 'contract' | 'civil_defense' | 'alarm' | 'fire_fighting' | 'visit' | 'quotation' | 'emergency';
  siteName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  status: OrderTrackingStep;
  statusLabel: string;
  estimatedCompletion?: string;
  notes?: string;
  costSAR?: number;
  assignedTechnician?: string;
  urgent?: boolean;
}
