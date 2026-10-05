import { ContractData, ContractPreset, SafetyEquipmentItem } from '../types/contract';

export const COMPANY_DETAILS = {
  nameAr: 'شركة أوريكيت للمقاولات العامة',
  nameEn: 'ORKIT Company For General Contracting',
  unifiedNumber: '7054875575',
  crNumber: '7054875575',
  addressAr: 'خميس مشيط - حي الضيافة - الشارع العام',
  addressEn: 'Khamis Mushait - Al-Diyafa District - Main Street',
  phone1: '0555334577',
  phone2: '0500052629',
  email: 'orkitcompany@gmail.com',
  city: 'خميس مشيط',
};

export const STANDARD_CLAUSES = [
  'يعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد.',
  'يتعهد الطرف الأول بعمل صيانة كل وسائل السلامة بالموقع لمدة سنة كاملة بواقع زيارة كل ستة أشهر من بداية توقيع العقد.',
  'يتعهد الطرف الثاني بتسهيل مهمة الطرف الأول لإخلاء المكان قد تعرقل سير العمل.',
  'يتعهد الطرف الثاني بالمصادقة على تقرير الزيارة الخاص بالصيانة.',
  'يخطر الطرف الثاني الطرف الأول في حالة حدوث أي خلل في أنظمة السلامة فور حدوثها حتى يتم إجراء اللازم.',
  'هذا العقد لا يشمل قطع الغيار وتكون على حساب الطرف الثاني بعرض سعر مستقل.',
  'في حالة أي زيادة في تصليح أو قطع غيار خلاف المتفق عليه في عرض السعر يتحمل الطرف الثاني قيمة التكلفة.',
  'طريقة الدفع نقداً أو تحويل على حساب المؤسسة عند توقيع العقد.',
  'يتجدد العقد من تلقاء نفسه ما لم يخطر أحد الطرفين الآخرين برغبته في إنهاء العقد قبل نهاية العقد بشهر على الأقل.',
  'المؤسسة غير مسؤولة عن عدم توفير أو تأخير قطع الغيار المطلوبة للصيانة.',
  'يقر الطرفان باطلاعهما على هذا العقد وعلمهما بمضمون بنود العقد.',
  'حرر هذا العقد من نسختين بيد كل طرف نسخة للعمل بموجب العقد عند الحاجة.',
  'لا يعتبر هذا العقد مشهد ما لم يتم إرفاق مشهد السلامة.',
  'يلتزم الطرف الأول بالمخطط المعتمد بدون زيادة أو نقصان.',
  'يلتزم الطرف الثاني بعدم فصل التيار الكهربائي عن مضخة الحريق ولوح الإنذار.',
  'يلتزم الطرف الثاني بالأوراق المطلوبة لاستخراج تصريح الدفاع المدني.',
  'العقد لا يشمل إضافة أدوات سلامة أو تعديل إنشائي في المباني.',
  'العقد يشمل صيانة طفايات الحريق.',
  'العقد لا يشمل الأضرار الناتجة عن الحوادث أو سوء الاستخدام أو محاولة إصلاح من قبل أشخاص غير متخصصين لدى الطرف الثاني.',
  'العقد لا يشمل الكوارث الطبيعية من سيول أو فيضانات أو سقوط أو تعديل في هيكل البناء المركب فيه أنظمة السلامة.',
];

export const DEFAULT_SAFETY_ITEMS: SafetyEquipmentItem[] = [
  {
    id: 'item_1',
    name: 'طفايات حريق بودرة جافة (DCP)',
    spec: 'سعة 6 كجم معتمدة SASO / دفاع مدني',
    quantity: 6,
    unit: 'حبة',
    status: 'سليم ويعمل',
    expiryDate: 'ساري الصلاحية',
  },
  {
    id: 'item_2',
    name: 'طفايات حريق غاز ثاني أكسيد الكربون (CO2)',
    spec: 'سعة 5 كجم مخصصة للوحات الكهربائية',
    quantity: 2,
    unit: 'حبة',
    status: 'سليم ويعمل',
    expiryDate: 'ساري الصلاحية',
  },
  {
    id: 'item_3',
    name: 'لوحة تحكم وإنذار حريق مبكر',
    spec: 'نظام معنون / تقليدي 4 مناطق مع بطاريات احتياطية',
    quantity: 1,
    unit: 'لوحة',
    status: 'سليم ويعمل',
    expiryDate: 'تم الاختبار',
  },
  {
    id: 'item_4',
    name: 'كواشف دخان ضوئية (Optical Smoke Detectors)',
    spec: 'كواشف سقفية حساسة للدخان مع قاعدة ومؤشر LED',
    quantity: 8,
    unit: 'كاشف',
    status: 'سليم ويعمل',
    expiryDate: 'تم الفحص والاختبار',
  },
  {
    id: 'item_5',
    name: 'كواشف حرارة (Heat Detectors)',
    spec: 'كواشف درجة حرارة ثابتة ومتغيرة 57°C',
    quantity: 2,
    unit: 'كاشف',
    status: 'سليم ويعمل',
    expiryDate: 'تم الفحص والاختبار',
  },
  {
    id: 'item_6',
    name: 'كواسر زجاجية يدوية للإنذار (Manual Call Point)',
    spec: 'كواسر يدوية حمراء مع مطرقة ومفتاح إعادة ضبط',
    quantity: 2,
    unit: 'كاسر',
    status: 'سليم ويعمل',
    expiryDate: 'تم الاختبار',
  },
  {
    id: 'item_7',
    name: 'أجراس وسارينات إنذار مع فلاشات ضوئية (Strobe)',
    spec: 'صوت مرتفع 95dB مع وميض ضوئي فلاش أحمر',
    quantity: 2,
    unit: 'جرس',
    status: 'سليم ويعمل',
    expiryDate: 'تم الاختبار',
  },
  {
    id: 'item_8',
    name: 'كشافات إنارة طوارئ شاحنة ذاتياً (Emergency Lights)',
    spec: 'مزدوجة LED تعمل تلقائياً عند انقطاع التيار لمدة 3 ساعات',
    quantity: 4,
    unit: 'كشاف',
    status: 'سليم ويعمل',
    expiryDate: 'تم اختبار البطاريات',
  },
  {
    id: 'item_9',
    name: 'لوحات مخارج الطوارئ الإرشادية المضيئة (Exit Sign)',
    spec: 'لوحات خروج LED خضراء مع بطارية احتياطية',
    quantity: 2,
    unit: 'لوحة',
    status: 'سليم ويعمل',
    expiryDate: 'جاهزة وتعمل',
  },
  {
    id: 'item_10',
    name: 'صناديق وخراطيم مكافحة الحريق الجدارية',
    spec: 'خرطوم مطاطي 1 بوصة بطول 30 متر مع قاذف متعدد',
    quantity: 1,
    unit: 'صندوق',
    status: 'سليم ويعمل',
    expiryDate: 'تم قياس الضغط',
  },
];

export const CONTRACT_PRESETS: ContractPreset[] = [
  {
    id: 'commercial',
    name: 'محل تجاري / معرض',
    activityType: 'تجارة تجزئة / معرض تجاري',
    defaultAmount: 1200,
    systems: {
      fireAlarms: true,
      fireExtinguishers: true,
      fireHoseCabinets: false,
      sprinklerNetwork: false,
      firePumps: false,
      emergencyLights: true,
      fm200System: false,
      fireHydrant: false,
    },
    defaultItems: [
      DEFAULT_SAFETY_ITEMS[0],
      DEFAULT_SAFETY_ITEMS[1],
      DEFAULT_SAFETY_ITEMS[2],
      DEFAULT_SAFETY_ITEMS[3],
      DEFAULT_SAFETY_ITEMS[5],
      DEFAULT_SAFETY_ITEMS[6],
      DEFAULT_SAFETY_ITEMS[7],
      DEFAULT_SAFETY_ITEMS[8],
    ],
  },
  {
    id: 'restaurant',
    name: 'مطعم / كافيه',
    activityType: 'خدمات إعاشة ومطاعم وكافيهات',
    defaultAmount: 1800,
    systems: {
      fireAlarms: true,
      fireExtinguishers: true,
      fireHoseCabinets: true,
      sprinklerNetwork: false,
      firePumps: false,
      emergencyLights: true,
      fm200System: false,
      fireHydrant: false,
    },
    defaultItems: [
      ...DEFAULT_SAFETY_ITEMS,
      {
        id: 'item_blanket',
        name: 'بطانية إخماد الحرائق (Fire Blanket)',
        spec: 'مقاس 1.8 × 1.2 متر من الألياف الزجاجية المقاومة للحرارة',
        quantity: 2,
        unit: 'بطانية',
        status: 'سليم ويعمل',
        expiryDate: 'صالحة للاستخدام',
      },
    ],
  },
  {
    id: 'warehouse',
    name: 'مستودع / ورشة / مصنع',
    activityType: 'تخزين / مستودع بضائع ومواد',
    defaultAmount: 3500,
    systems: {
      fireAlarms: true,
      fireExtinguishers: true,
      fireHoseCabinets: true,
      sprinklerNetwork: true,
      firePumps: true,
      emergencyLights: true,
      fm200System: false,
      fireHydrant: true,
    },
    defaultItems: [
      ...DEFAULT_SAFETY_ITEMS,
      {
        id: 'item_sprinkler',
        name: 'رؤوس رشاشات مياه الحريق الآلية (Sprinklers)',
        spec: 'رؤوس نحاسية حرارية 68°C مع محابس تحكم وزون كنترول',
        quantity: 24,
        unit: 'رأس رشاش',
        status: 'سليم ويعمل',
        expiryDate: 'تم فحص الشبكة',
      },
      {
        id: 'item_pumps',
        name: 'مضخة حريق رئيسية ومساعدة (UL/FM)',
        spec: 'مضخة كهربائية + ديزل احتياطية + جوكي مع لوحة تحكم آلية',
        quantity: 1,
        unit: 'محطة متكاملة',
        status: 'سليم ويعمل',
        expiryDate: 'تم اختبار التشغيل',
      },
    ],
  },
  {
    id: 'residential',
    name: 'عمارة سكنية / مجمع',
    activityType: 'مبنى سكني تجاري / شقق فندقية',
    defaultAmount: 2500,
    systems: {
      fireAlarms: true,
      fireExtinguishers: true,
      fireHoseCabinets: true,
      sprinklerNetwork: true,
      firePumps: true,
      emergencyLights: true,
      fm200System: false,
      fireHydrant: false,
    },
    defaultItems: DEFAULT_SAFETY_ITEMS,
  },
];

// Helper to format date YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calculate end date exactly one year later minus 1 day
export function getOneYearLater(startDateStr: string): string {
  try {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  } catch {
    return '';
  }
}

// Generate random or sequential contract code
export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORK-CD-${year}-${randomNum}`;
}

// Default initial contract
export function createDefaultContract(): ContractData {
  const today = new Date();
  const todayStr = formatDate(today);
  const endStr = getOneYearLater(todayStr);

  return {
    id: `contract_${Date.now()}`,
    contractNumber: generateContractNumber(),
    contractDate: todayStr,
    contractHijriDate: '1448/04/24 هـ',
    clientName: 'مؤسسة أفق التقنية للتجارة',
    clientType: 'establishment',
    facilityName: 'معرض أفق التقنية',
    commercialRegOrId: '1010789456',
    clientPhone: '0501234567',
    clientEmail: 'info@client-est.com',
    city: 'خميس مشيط',
    district: 'حي الضيافة',
    street: 'طريق الملك فهد',
    activityType: 'تجارة الأجهزة الإلكترونية والمكتبية',
    buildingFloors: 'دور أرضي',
    durationYears: 1,
    startDate: todayStr,
    endDate: endStr,
    totalAmount: 1500,
    isVatIncluded: true,
    paymentMethod: 'دفعة واحدة عند التوقيع',
    coveredSystems: {
      fireAlarms: true,
      fireExtinguishers: true,
      fireHoseCabinets: true,
      sprinklerNetwork: false,
      firePumps: false,
      emergencyLights: true,
      fm200System: false,
      fireHydrant: false,
    },
    equipmentNotes: 'عدد 6 طفايات حريق بودرة 6 كجم + لوحة إنذار حريق 4 مناطق + 8 كواشف دخان + 2 كاشف كاسر يدوي + 4 كشافات طوارئ',
    clauses: [...STANDARD_CLAUSES],
    safetyItems: [...DEFAULT_SAFETY_ITEMS],
    inspectorName: 'م. أحمد خالد الشهري',
    inspectorLicense: 'SE-98421',
    certificateNotes: 'تم فحص جميع أدوات السلامة المذكورة أعلاه واختبار كفاءتها التشغيلية ومطابقتها للمواصفات واللوائح الفنية للمديرية العامة للدفاع المدني، ويوصى بالصيانة الوقائية المستمرة.',
    options: {
      showLetterhead: true,
      showStamp: true,
      showSignature: true,
      showWatermark: true,
      showQrCode: true,
      showFinancialAmount: true,
      compactMode: true,
      clausesFormat: 'flowing',
      customLetterheadImage: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
