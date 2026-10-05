export interface SafetyEquipmentItem {
  id: string;
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  status: 'سليم ويعمل' | 'تم تركيبه وفحصه' | 'تمت إعادة التعبئة';
  expiryDate?: string;
}

export interface ContractData {
  id: string;
  contractNumber: string;
  contractDate: string; // e.g. 2026-10-05
  contractHijriDate?: string;
  
  // Client details
  clientName: string;
  clientType: 'individual' | 'company' | 'establishment';
  facilityName: string;
  commercialRegOrId: string;
  clientPhone: string;
  clientEmail?: string;
  city: string;
  district: string;
  street: string;
  activityType: string;
  buildingFloors?: string; // عدد الأدوار في المنشأة (مثل: دور أرضي، دورين، 3 أدوار...)

  // Contract duration
  durationYears: number; // default 1
  startDate: string;
  endDate: string;

  // Financial
  totalAmount?: number | null; // SAR (اختياري)
  isVatIncluded: boolean;
  paymentMethod: string;

  // Safety Equipment & Systems
  coveredSystems: {
    fireAlarms: boolean; // أجهزة وكواشف الإنذار المبكر
    fireExtinguishers: boolean; // طفايات الحريق اليدوية والآلية
    fireHoseCabinets: boolean; // صناديق وخراطيم الحريق
    sprinklerNetwork: boolean; // شبكة الرش الآلي
    firePumps: boolean; // مضخات الحريق الرئيسية والمساعدة
    emergencyLights: boolean; // كشافات الطوارئ ولوحات مخارج الطوارئ
    fm200System: boolean; // نظام الإطفاء بالغاز FM200
    fireHydrant: boolean; // عساكر الحريق الخارجية
  };

  // Detailed Safety Tools List for "مشهد السلامة"
  safetyItems: SafetyEquipmentItem[];

  // Safety Certificate Inspector details
  inspectorName?: string;
  inspectorLicense?: string;
  certificateNotes?: string;

  // Custom notes or quantities
  equipmentNotes?: string;

  // Custom or standard clauses
  clauses: string[];

  // Display toggles
  options: {
    showLetterhead: boolean; // إظهار الترويسة المطبوعة
    showStamp: boolean; // إظهار ختم الشركة
    showSignature: boolean; // إظهار توقيع الإدارة
    showWatermark: boolean; // إظهار العلامة المائية
    showQrCode: boolean; // إظهار باركود التحقق
    showFinancialAmount?: boolean; // إظهار أو إخفاء القيمة المالية للعقد (اختياري)
    compactMode?: boolean; // وضع الصفحة الواحدة المضغوطة لتناسب صفحة A4 واحدة
    clausesFormat?: 'flowing' | 'list'; // نمط عرض البنود: نص متصل شامل لكامل العرض أو أسطر منفصلة
    customLetterheadImage?: string | null; // صورة ترويسة مخصصة مرفوعة
  };

  createdAt: string;
  updatedAt: string;
}

export type PresetTemplateId = 'commercial' | 'restaurant' | 'warehouse' | 'residential';

export interface ContractPreset {
  id: PresetTemplateId;
  name: string;
  activityType: string;
  defaultAmount: number;
  systems: ContractData['coveredSystems'];
  defaultItems: SafetyEquipmentItem[];
}
