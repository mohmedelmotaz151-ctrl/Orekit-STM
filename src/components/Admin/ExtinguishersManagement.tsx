import React, { useState } from 'react';
import { Site, User, ExtinguisherMaintenanceInfo, ExtinguisherMaintenanceLog } from '../../types';
import { 
  getDaysRemaining, 
  getExtinguisher10DayReminder, 
  formatDateArabic,
  Extinguisher10DayReminderInfo
} from '../../utils/date';
import { exportToCSV } from '../../utils/storage';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { 
  Flame, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  ExternalLink, 
  Wrench, 
  X, 
  Check, 
  ShieldCheck,
  Plus,
  Bell,
  MessageCircle,
  Printer,
  QrCode,
  Building2,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ExtinguishersManagementProps {
  currentUser: User;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onUpdateSiteMaintenance: (siteId: string, maintenance: ExtinguisherMaintenanceInfo) => void;
  onOpenNewVisit: (site: Site) => void;
  onSaveNewSite?: (newSite: Site) => void;
}

export const ExtinguishersManagement: React.FC<ExtinguishersManagementProps> = ({
  currentUser,
  sites,
  onSelectSite,
  onUpdateSiteMaintenance,
  onOpenNewVisit,
  onSaveNewSite,
}) => {
  // Focus on approved sites, or sites with registered extinguishers
  const allEligibleSites = sites.filter(
    (s) => s.approvalStatus === 'approved' || s.extinguisherMaintenance?.hasMaintenancePlan || s.equipment?.extinguishers?.totalCount > 0
  );

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'due_10_days' | 'expired' | 'expiring_30' | 'valid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  // Modals state
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingTagSite, setViewingTagSite] = useState<Site | null>(null);

  // Edit / Add Form Fields
  const [selectedSiteIdForEdit, setSelectedSiteIdForEdit] = useState<string>('new');
  const [formFacilityName, setFormFacilityName] = useState('');
  const [formFacilityType, setFormFacilityType] = useState('مجمع تجاري');
  const [formCity, setFormCity] = useState('الرياض');
  const [formDistrict, setFormDistrict] = useState('الملز');
  const [formPhone, setFormPhone] = useState('0555334577');
  const [formManagerName, setFormManagerName] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });
  const [tagNumber, setTagNumber] = useState('');
  const [companyName, setCompanyName] = useState('شركة أوريكيت للسلامة والوقاية من الحريق');
  const [techName, setTechName] = useState(currentUser.name || 'فني صيانة أوريكيت');
  
  // Extinguisher counts by type (عدد ونوع الكفايات)
  const [powder, setPowder] = useState<number>(6); // بودرة جافة ABC
  const [co2, setCo2] = useState<number>(2);       // ثاني أكسيد الكربون CO2
  const [foam, setFoam] = useState<number>(0);     // رغوة مائية
  const [water, setWater] = useState<number>(0);   // ماء مضغوط
  const [wetChem, setWetChem] = useState<number>(0); // مواد كيميائية رطبة للمطابخ K-Class
  const [cleanAgent, setCleanAgent] = useState<number>(0); // غاز نظيف FM-200
  const [enable10DayReminder, setEnable10DayReminder] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Total count calculation
  const totalFormExtinguishers = Number(powder || 0) + Number(co2 || 0) + Number(foam || 0) + Number(water || 0) + Number(wetChem || 0) + Number(cleanAgent || 0);

  // Calculate Metrics across all facilities
  let totalValid = 0;
  let totalDue10Days = 0;
  let totalExpiringSoon30 = 0;
  let totalExpired = 0;
  let totalExtinguishersAll = 0;

  allEligibleSites.forEach((site) => {
    const ext = site.extinguisherMaintenance;
    const totalSiteExt = 
      (ext?.powderCount || 0) + 
      (ext?.co2Count || 0) + 
      (ext?.foamCount || 0) + 
      (ext?.waterCount || 0) + 
      (ext?.wetChemicalCount || 0) + 
      (ext?.cleanAgentCount || 0) || 
      site.equipment?.extinguishers?.totalCount || 0;
    
    totalExtinguishersAll += totalSiteExt;

    if (!ext?.expiryDate) {
      totalDue10Days++;
      return;
    }

    const reminder = getExtinguisher10DayReminder(ext.expiryDate);
    if (reminder.isExpired) {
      totalExpired++;
    } else if (reminder.isExpiringIn10Days) {
      totalDue10Days++;
    } else if (reminder.urgency === 'warning_30_days') {
      totalExpiringSoon30++;
    } else {
      totalValid++;
    }
  });

  // Unique cities
  const cities = Array.from(new Set(allEligibleSites.map((s) => s.city).filter(Boolean)));

  // Filter sites based on selected filter, city and search
  const filteredSites = allEligibleSites.filter((site) => {
    const ext = site.extinguisherMaintenance;
    const reminder = getExtinguisher10DayReminder(ext?.expiryDate);

    if (filterType === 'due_10_days') {
      if (!reminder.isExpiringIn10Days && !(!ext?.expiryDate)) return false;
    } else if (filterType === 'expired') {
      if (!reminder.isExpired) return false;
    } else if (filterType === 'expiring_30') {
      if (reminder.urgency !== 'warning_30_days' && !reminder.isExpiringIn10Days) return false;
    } else if (filterType === 'valid') {
      if (reminder.urgency !== 'valid') return false;
    }

    if (selectedCity !== 'all' && site.city !== selectedCity) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = site.name.toLowerCase().includes(q);
      const matchManager = site.managerName?.toLowerCase().includes(q);
      const matchPhone = site.phone?.includes(q);
      const matchTag = ext?.certificateOrTagNumber?.toLowerCase().includes(q);
      const matchCity = site.city?.toLowerCase().includes(q);
      const matchDistrict = site.district?.toLowerCase().includes(q);
      if (!matchName && !matchManager && !matchPhone && !matchTag && !matchCity && !matchDistrict) {
        return false;
      }
    }

    return true;
  });

  // Open Edit Modal for a specific site
  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    const m = site.extinguisherMaintenance;
    const today = new Date().toISOString().split('T')[0];
    const defaultNext = new Date();
    defaultNext.setFullYear(defaultNext.getFullYear() + 1);

    setMaintDate(m?.lastMaintenanceDate || today);
    setExpiryDate(m?.expiryDate || defaultNext.toISOString().split('T')[0]);
    setTagNumber(m?.certificateOrTagNumber || `EXT-${site.id.slice(-6).toUpperCase()}`);
    setCompanyName(m?.maintenanceCompany || 'شركة أوريكيت للسلامة والوقاية من الحريق');
    setTechName(m?.technicianName || currentUser.name || 'فني صيانة أوريكيت');
    setPowder(m?.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0);
    setCo2(m?.co2Count || 0);
    setFoam(m?.foamCount || 0);
    setWater(m?.waterCount || 0);
    setWetChem(m?.wetChemicalCount || 0);
    setCleanAgent(m?.cleanAgentCount || 0);
    setEnable10DayReminder(true);
    setNotes(m?.notes || '');
  };

  // Open Add New Maintenance Record Modal
  const handleOpenAddModal = () => {
    setSelectedSiteIdForEdit('new');
    setFormFacilityName('');
    setFormFacilityType('مجمع تجاري');
    setFormCity('الرياض');
    setFormDistrict('الملز');
    setFormPhone('0555334577');
    setFormManagerName('');
    const today = new Date().toISOString().split('T')[0];
    const defaultNext = new Date();
    defaultNext.setFullYear(defaultNext.getFullYear() + 1);
    setMaintDate(today);
    setExpiryDate(defaultNext.toISOString().split('T')[0]);
    setTagNumber(`EXT-${Date.now().toString().slice(-6)}`);
    setCompanyName('شركة أوريكيت للسلامة والوقاية من الحريق');
    setTechName(currentUser.name || 'فني صيانة أوريكيت');
    setPowder(8);
    setCo2(4);
    setFoam(2);
    setWater(0);
    setWetChem(0);
    setCleanAgent(0);
    setEnable10DayReminder(true);
    setNotes('');
    setShowAddModal(true);
  };

  // Preset Date Handlers
  const handleSetExpiryMonths = (months: number) => {
    const base = maintDate ? new Date(maintDate) : new Date();
    base.setMonth(base.getMonth() + months);
    setExpiryDate(base.toISOString().split('T')[0]);
  };

  // Save changes from Edit Modal
  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    const totalCalculated = Number(powder) + Number(co2) + Number(foam) + Number(water) + Number(wetChem) + Number(cleanAgent);
    const reminder = getExtinguisher10DayReminder(expiryDate);
    let newStatus: 'valid' | 'expiring_soon' | 'expired' | 'needs_refill' = 'valid';
    if (reminder.isExpired) newStatus = 'expired';
    else if (reminder.isExpiringIn10Days || reminder.urgency === 'warning_30_days') newStatus = 'expiring_soon';

    const newLog: ExtinguisherMaintenanceLog = {
      id: `log_ext_${Date.now()}`,
      maintenanceDate: maintDate,
      expiryDate,
      technicianName: techName,
      companyName,
      certificateOrTagNumber: tagNumber,
      servicedCount: totalCalculated,
      typesServiced: [
        powder > 0 ? `بودرة ABC (${powder})` : '',
        co2 > 0 ? `ثاني أكسيد الكربون CO2 (${co2})` : '',
        foam > 0 ? `رغوة (${foam})` : '',
        water > 0 ? `ماء (${water})` : '',
        wetChem > 0 ? `مواد كيميائية رطبة K-Class (${wetChem})` : '',
        cleanAgent > 0 ? `غاز نظيف FM200 (${cleanAgent})` : '',
      ].filter(Boolean),
      status: 'completed',
      notes: notes || 'تم تنفيذ فحص وصيانة كفايات المنشأة وتحديث ملصق الفحص الدوري',
      createdAt: new Date().toISOString(),
    };

    const updatedMaintenance: ExtinguisherMaintenanceInfo = {
      hasMaintenancePlan: true,
      lastMaintenanceDate: maintDate,
      expiryDate,
      maintenanceCompany: companyName,
      technicianName: techName,
      certificateOrTagNumber: tagNumber,
      cylinderPressureChecked: true,
      status: newStatus,
      powderCount: Number(powder),
      co2Count: Number(co2),
      foamCount: Number(foam),
      waterCount: Number(water),
      wetChemicalCount: Number(wetChem),
      cleanAgentCount: Number(cleanAgent),
      reminder10DaysNotified: false,
      notes,
      logs: [newLog, ...(editingSite.extinguisherMaintenance?.logs || [])],
    };

    onUpdateSiteMaintenance(editingSite.id, updatedMaintenance);
    setEditingSite(null);
  };

  // Save changes from Add New Maintenance Record Modal
  const handleSaveAddModal = (e: React.FormEvent) => {
    e.preventDefault();
    const totalCalculated = Number(powder) + Number(co2) + Number(foam) + Number(water) + Number(wetChem) + Number(cleanAgent);
    const reminder = getExtinguisher10DayReminder(expiryDate);
    let newStatus: 'valid' | 'expiring_soon' | 'expired' | 'needs_refill' = 'valid';
    if (reminder.isExpired) newStatus = 'expired';
    else if (reminder.isExpiringIn10Days || reminder.urgency === 'warning_30_days') newStatus = 'expiring_soon';

    const newLog: ExtinguisherMaintenanceLog = {
      id: `log_ext_${Date.now()}`,
      maintenanceDate: maintDate,
      expiryDate,
      technicianName: techName,
      companyName,
      certificateOrTagNumber: tagNumber,
      servicedCount: totalCalculated,
      typesServiced: [
        powder > 0 ? `بودرة ABC (${powder})` : '',
        co2 > 0 ? `ثاني أكسيد الكربون CO2 (${co2})` : '',
        foam > 0 ? `رغوة (${foam})` : '',
        water > 0 ? `ماء (${water})` : '',
        wetChem > 0 ? `مواد كيميائية رطبة K-Class (${wetChem})` : '',
        cleanAgent > 0 ? `غاز نظيف FM200 (${cleanAgent})` : '',
      ].filter(Boolean),
      status: 'completed',
      notes: notes || 'تسجيل دورة صيانة كفايات جديدة مع تفعيل التزكير الدوري',
      createdAt: new Date().toISOString(),
    };

    const newMaint: ExtinguisherMaintenanceInfo = {
      hasMaintenancePlan: true,
      lastMaintenanceDate: maintDate,
      expiryDate,
      maintenanceCompany: companyName,
      technicianName: techName,
      certificateOrTagNumber: tagNumber,
      cylinderPressureChecked: true,
      status: newStatus,
      powderCount: Number(powder),
      co2Count: Number(co2),
      foamCount: Number(foam),
      waterCount: Number(water),
      wetChemicalCount: Number(wetChem),
      cleanAgentCount: Number(cleanAgent),
      reminder10DaysNotified: false,
      notes,
      logs: [newLog],
    };

    if (selectedSiteIdForEdit !== 'new') {
      // Update existing site
      onUpdateSiteMaintenance(selectedSiteIdForEdit, newMaint);
    } else {
      // Create new facility site with extinguisher maintenance
      const facilityNameTrimmed = formFacilityName.trim() || 'منشأة تجارية جديدة';
      const newSiteObj: Site = {
        id: `site_ext_${Date.now()}`,
        name: facilityNameTrimmed,
        type: (formFacilityType as any) || 'مجمع تجاري',
        managerName: formManagerName.trim() || 'مدير المنشأة',
        phone: formPhone.trim() || '0555334577',
        city: formCity || 'الرياض',
        district: formDistrict.trim() || 'الوسط',
        address: `${formCity} - ${formDistrict}`,
        latitude: 24.7136,
        longitude: 46.6753,
        license: {
          hasLicense: 'yes',
          licenseType: 'رخصة بلدي وسلامة',
          licenseNumber: `LIC-${Date.now().toString().slice(-4)}`,
          expiryDate: expiryDate,
        },
        contract: {
          hasContract: 'yes',
          companyName: companyName,
          startDate: maintDate,
          endDate: expiryDate,
          annualValue: 6000,
        },
        equipment: {
          extinguishers: {
            totalCount: totalCalculated,
            types: ['powder', 'co2'],
            needsMaintenance: reminder.isExpiringIn10Days || reminder.isExpired,
            needsReplacement: false,
            needsNewInstall: false,
          },
          alarmSystem: { exists: true, working: true, needsMaintenance: false, needsInstall: false, detectorCount: 12, callPointCount: 4, panelType: 'معنون Addressable' },
          waterAndPumps: { sprinklersExist: false, sprinklersCount: 0, sprinklersCondition: 'good', pumpsExist: false, pumpsType: '', pumpsWorking: false, fireHoseReelsCount: 2, fireCabinetsCount: 2, specialSuppressionSystem: 'لا يوجد', specialSuppressionWorking: false },
        },
        civilDefense: {
          hasRecord: true,
          lastVisitDate: maintDate,
          nextVisitDate: expiryDate,
          reportNumber: `CD-${Date.now().toString().slice(-5)}`,
        },
        extinguisherMaintenance: newMaint,
        status: reminder.isExpired ? 'urgent_maintenance' : reminder.isExpiringIn10Days ? 'expiring_soon' : 'competitor_contract',
        approvalStatus: 'approved',
        createdByAgentId: currentUser.id,
        createdByAgentName: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        incentiveAmount: 1.5,
        incentivePaid: true,
        visitsCount: 1,
      };

      if (onSaveNewSite) {
        onSaveNewSite(newSiteObj);
      } else {
        onUpdateSiteMaintenance(newSiteObj.id, newMaint);
      }
    }

    setShowAddModal(false);
  };

  // WhatsApp 10-Day Reminder Generator
  const handleSendWhatsAppReminder = (site: Site) => {
    const ext = site.extinguisherMaintenance;
    const reminder = getExtinguisher10DayReminder(ext?.expiryDate);
    const totalCount = 
      (ext?.powderCount || 0) + 
      (ext?.co2Count || 0) + 
      (ext?.foamCount || 0) + 
      (ext?.waterCount || 0) + 
      (ext?.wetChemicalCount || 0) + 
      (ext?.cleanAgentCount || 0) || 
      site.equipment?.extinguishers?.totalCount || 0;

    const typesList: string[] = [];
    if (ext?.powderCount) typesList.push(`${ext.powderCount} بودرة ABC`);
    if (ext?.co2Count) typesList.push(`${ext.co2Count} ثاني أكسيد الكربون CO2`);
    if (ext?.foamCount) typesList.push(`${ext.foamCount} رغوة مائية`);
    if (ext?.waterCount) typesList.push(`${ext.waterCount} ماء مضغوط`);
    if (ext?.wetChemicalCount) typesList.push(`${ext.wetChemicalCount} مواد رطبة للطهي K-Class`);
    if (ext?.cleanAgentCount) typesList.push(`${ext.cleanAgentCount} غاز نظيف FM200`);

    const typesStr = typesList.length > 0 ? typesList.join('، ') : 'كفايات وطفايات حريق متنوعة';
    const daysStr = reminder.days !== null ? (reminder.days < 0 ? `منتهية منذ ${Math.abs(reminder.days)} يوم` : `متبقي ${reminder.days} أيام فقط`) : 'الموعد وشيك';

    const message = `السلام عليكم ورحمة الله وبركاته،
الأخ الكريم / ${site.managerName || 'مسؤول المنشأة'} المحترم،
منشأة: *${site.name}*

نود تذكيركم بموجب نظام السلامة وكود البناء السعودي بقرب حلول موعد الصيانة السنوية الإلزامية للكفايات وطفايات الحريق:
📍 المنشأة: ${site.name} (${site.city} - ${site.district})
🧯 عدد الكفايات: ${totalCount} كفاية
📋 أنواع الكفايات: ${typesStr}
📅 تاريخ آخر صيانة: ${ext?.lastMaintenanceDate || 'مسجل بالنظام'}
⏳ تاريخ انتهاء الصلاحية: ${ext?.expiryDate || 'الموعد السنوي'} (${daysStr})
🏷️ رقم ملصق الصيانة: ${ext?.certificateOrTagNumber || 'EXT-ORIKET'}

حرصاً على سلامة منشأتكم وتجنب أي مخالفات أو غرامات من فرق تفتيش الدفاع المدني، يسرنا التنسيق معكم لإجراء الفحص الفني الميداني وإعادة التعبئة وإصدار ملصق الفحص الدوري المعتمد فوراً.

شركة أوريكيت للسلامة والوقاية من الحريق
هاتف التنسيق: 0555334577`;

    const url = createWhatsAppUrl(site.phone || '0555334577', message);
    window.open(url, '_blank');
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const exportRows = filteredSites.map((site) => {
      const ext = site.extinguisherMaintenance;
      const reminder = getExtinguisher10DayReminder(ext?.expiryDate);
      const totalCount = 
        (ext?.powderCount || 0) + 
        (ext?.co2Count || 0) + 
        (ext?.foamCount || 0) + 
        (ext?.waterCount || 0) + 
        (ext?.wetChemicalCount || 0) + 
        (ext?.cleanAgentCount || 0) || 
        site.equipment?.extinguishers?.totalCount || 0;

      return {
        'اسم المنشأة': site.name,
        'نوع المنشأة': site.type,
        'المدينة': site.city,
        'الحي': site.district,
        'المسؤول': site.managerName,
        'الهاتف': site.phone,
        'إجمالي الكفايات والطفايات': totalCount,
        'بودرة جافة ABC': ext?.powderCount ?? 0,
        'ثاني أكسيد الكربون CO2': ext?.co2Count ?? 0,
        'رغوة مائية': ext?.foamCount ?? 0,
        'ماء مضغوط': ext?.waterCount ?? 0,
        'مواد كيميائية رطبة K-Class': ext?.wetChemicalCount ?? 0,
        'غاز نظيف FM200': ext?.cleanAgentCount ?? 0,
        'تاريخ الصيانة': ext?.lastMaintenanceDate || 'غير مسجل',
        'تاريخ الانتهاء': ext?.expiryDate || 'غير محدد',
        'الأيام المتبقية': reminder.days !== null ? reminder.days : 'غير محدد',
        'حالة التزكير قبل 10 أيام': reminder.isExpiringIn10Days ? 'تنبيه: متبقي أقل من 10 أيام' : reminder.isExpired ? 'منتهية الصلاحية' : 'سارية',
        'رقم ملصق الصيانة': ext?.certificateOrTagNumber || '-',
        'شركة الصيانة': ext?.maintenanceCompany || 'أوريكيت للسلامة',
        'الفني المعتمد': ext?.technicianName || '-',
      };
    });

    exportToCSV(`سجل_صيانة_الكفايات_وتزكير_العشرة_أيام_${today}`, exportRows);
  };

  return (
    <div className="space-y-5 pb-12 select-none" dir="rtl">
      
      {/* ==================================================== */}
      {/* 1. TOP HEADER BANNER (قسم صيانة الكفاية وطفايات الحريق) */}
      {/* ==================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0C1222] via-[#101935] to-[#1E112A] p-5 sm:p-6 rounded-3xl border border-[#1E2945] shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5" />
                <span>قسم صيانة الكفاية وطفايات الحريق</span>
              </span>
              <span className="text-[11px] text-[#8992AA] bg-[#10172B] px-2.5 py-0.5 rounded-full border border-[#1E2945]">
                منظومة الفحص المعتمد وكروت الدفاع المدني
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#F5F7FF] tracking-tight">
              سجل صيانة الكفايات والطفايات مع نظام التزكير قبل ١٠ أيام
            </h1>
            <p className="text-xs text-[#8992AA] leading-relaxed">
              إدارة وحصر كفايات المنشآت (اسم المنشأة، عدد ونوع الكفايات، تاريخ الصيانة وتاريخ الانتهاء) مع إشعار وتزكير تلقائي للمنشأة قبل حلول الموعد بـ ١٠ أيام لحمايتها من المخالفات.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start lg:self-auto">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#070B1C] font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/60 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة صيانة كفاية جديدة</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-[#10172B] hover:bg-[#1E2945] text-[#20A9FF] border border-[#1E2945] text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="تصدير كشف Excel شامل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* 4 Statistics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-5 pt-4 border-t border-[#1E2945]/80">
          {/* Total Facilities & Extinguishers */}
          <div className="bg-[#070B1C]/80 p-3 rounded-2xl border border-[#1E2945]">
            <span className="text-[11px] text-[#8992AA] block mb-0.5">المنشآت المسجلة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{allEligibleSites.length}</span>
              <span className="text-[11px] text-[#8992AA]">منشأة ({totalExtinguishersAll} كفاية)</span>
            </div>
          </div>

          {/* 10-Day Reminder KPI (KEY REQUIREMENT) */}
          <div 
            onClick={() => setFilterType('due_10_days')}
            className="cursor-pointer bg-gradient-to-br from-amber-950/40 to-[#070B1C] p-3 rounded-2xl border border-amber-500/50 hover:border-amber-400 transition group shadow-sm shadow-amber-950/40"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>تزكير قبل 10 أيام</span>
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
                عاجل
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{totalDue10Days}</span>
              <span className="text-[11px] text-amber-300/80">منشأة تحتاج متابعة</span>
            </div>
          </div>

          {/* Expired Extinguishers */}
          <div 
            onClick={() => setFilterType('expired')}
            className="cursor-pointer bg-gradient-to-br from-rose-950/30 to-[#070B1C] p-3 rounded-2xl border border-rose-500/40 hover:border-rose-400 transition group"
          >
            <span className="text-[11px] text-rose-300 font-bold block mb-0.5">🔴 منتهية الصلاحية</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{totalExpired}</span>
              <span className="text-[11px] text-rose-300/80">تتطلب تعبئة فورية</span>
            </div>
          </div>

          {/* Valid Extinguishers */}
          <div 
            onClick={() => setFilterType('valid')}
            className="cursor-pointer bg-gradient-to-br from-emerald-950/30 to-[#070B1C] p-3 rounded-2xl border border-emerald-500/40 hover:border-emerald-400 transition group"
          >
            <span className="text-[11px] text-emerald-300 font-bold block mb-0.5">🟢 سارية وصالحة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{totalValid}</span>
              <span className="text-[11px] text-emerald-300/80">كفايات مطابقة</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. URGENT 10-DAY REMINDER BANNER (إذا وجدت منشآت مستحقة) */}
      {/* ==================================================== */}
      {totalDue10Days > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#19150E] to-[#10172B] border-2 border-amber-500/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-[#F5F7FF]">
                  تنبيه تزكير الصيانة الإلزامي (قبل ١٠ أيام من الموعد)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-[#070B1C] font-black">
                  {totalDue10Days} منشآت
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                توجد منشآت اقترب موعد صيانة وتعبئة كفاياتها (متبقي أقل من 10 أيام أو اليوم). بادر بإرسال التزكير المباشر عبر واتساب لتجنب غرامات الدفاع المدني.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterType('due_10_days')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                filterType === 'due_10_days'
                  ? 'bg-amber-500 text-[#070B1C]'
                  : 'bg-[#10172B] text-amber-300 border border-amber-500/40 hover:bg-amber-500/20'
              }`}
            >
              عرض منشآت التزكير فقط ({totalDue10Days})
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. FILTER TABS & SEARCH CONTROLS                     */}
      {/* ==================================================== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Filter Pills */}
          <div className="flex bg-[#10172B] p-1 rounded-2xl border border-[#1E2945] text-xs overflow-x-auto gap-1 no-scrollbar">
            {[
              { id: 'all', label: 'جميع المنشآت', count: allEligibleSites.length, color: 'text-white' },
              { id: 'due_10_days', label: '🔔 تزكير قبل 10 أيام', count: totalDue10Days, color: 'text-amber-300' },
              { id: 'expired', label: '🔴 منتهية الصلاحية', count: totalExpired, color: 'text-rose-300' },
              { id: 'expiring_30', label: '🟠 تنتهي خلال 30 يوم', count: totalExpiringSoon30, color: 'text-yellow-300' },
              { id: 'valid', label: '🟢 سارية الصلاحية', count: totalValid, color: 'text-emerald-300' },
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? tab.id === 'due_10_days'
                        ? 'bg-amber-500 text-[#070B1C] shadow-md shadow-amber-950/50'
                        : 'bg-[#20A9FF] text-[#070B1C] shadow-md'
                      : 'text-[#8992AA] hover:text-white hover:bg-[#1E2945]/50'
                  }`}
                >
                  <span className={isActive ? 'text-[#070B1C]' : tab.color}>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#070B1C]/20 text-[#070B1C]' : 'bg-[#070B1C] text-[#8992AA]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* City Dropdown */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-[#10172B] border border-[#1E2945] rounded-xl px-3 py-1.5 text-xs text-[#F5F7FF] focus:outline-none focus:border-amber-400"
          >
            <option value="all">جميع المدن والمناطق</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8992AA] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المنشأة، نوع الكفايات، هاتف المسؤول، أو رقم ملصق الصيانة..."
            className="w-full bg-[#10172B]/90 border border-[#1E2945] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-[#8992AA] focus:outline-none focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. MAIN RECORDS DISPLAY (TABLE & CARDS)               */}
      {/* ==================================================== */}
      <div className="bg-[#10172B]/90 rounded-3xl border border-[#1E2945] shadow-xl overflow-hidden">
        {filteredSites.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Flame className="w-12 h-12 text-[#8992AA] mx-auto opacity-50" />
            <h3 className="font-bold text-sm text-[#F5F7FF]">لا توجد منشآت مطابقة للتصفية الحالية</h3>
            <p className="text-xs text-[#8992AA] max-w-sm mx-auto">
              جرب تغيير التصفية أو اضغط على "إضافة صيانة كفاية جديدة" لتسجيل فحص كفايات لمنشأة.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-[#070B1C] font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل صيانة كفاية لمنشأة</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#070B1C] text-[#8992AA] border-b border-[#1E2945] font-bold">
                <tr>
                  <th className="p-3.5">اسم المنشأة</th>
                  <th className="p-3.5">عدد ونوع الكفايات</th>
                  <th className="p-3.5">تاريخ الصيانة</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">تزكير قبل ١٠ أيام والحالة</th>
                  <th className="p-3.5">رقم الملصق</th>
                  <th className="p-3.5 text-center">الإجراءات المباشرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2945]/70 text-[#CAD2E0]">
                {filteredSites.map((site) => {
                  const ext = site.extinguisherMaintenance;
                  const totalSiteExt = 
                    (ext?.powderCount || 0) + 
                    (ext?.co2Count || 0) + 
                    (ext?.foamCount || 0) + 
                    (ext?.waterCount || 0) + 
                    (ext?.wetChemicalCount || 0) + 
                    (ext?.cleanAgentCount || 0) || 
                    site.equipment?.extinguishers?.totalCount || 0;

                  const reminder = getExtinguisher10DayReminder(ext?.expiryDate);

                  return (
                    <tr 
                      key={site.id} 
                      className={`hover:bg-[#1E2945]/30 transition ${
                        reminder.isExpiringIn10Days ? 'bg-amber-950/15' : reminder.isExpired ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      {/* اسم المنشأة */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{site.name}</span>
                        </div>
                        <div className="text-[10px] text-[#8992AA] mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[#20A9FF]">{site.type}</span>
                          <span>•</span>
                          <span>{site.city} ({site.district})</span>
                          <span>•</span>
                          <span className="text-white font-mono">{site.managerName}</span>
                        </div>
                        <div className="mt-0.5">
                          <a 
                            href={`tel:${site.phone}`} 
                            className="text-[10px] text-emerald-400 hover:underline font-mono"
                            dir="ltr"
                          >
                            {site.phone}
                          </a>
                        </div>
                      </td>

                      {/* عدد ونوع الكفايات */}
                      <td className="p-3.5">
                        <div className="font-black text-amber-400 font-mono text-sm">
                          {totalSiteExt} كفاية
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                          {(ext?.powderCount ?? site.equipment?.extinguishers?.totalCount ?? 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-amber-300">
                              بودرة: {ext?.powderCount ?? site.equipment?.extinguishers?.totalCount}
                            </span>
                          )}
                          {(ext?.co2Count || 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-cyan-300">
                              CO2: {ext?.co2Count}
                            </span>
                          )}
                          {(ext?.foamCount || 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-purple-300">
                              رغوة: {ext?.foamCount}
                            </span>
                          )}
                          {(ext?.waterCount || 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-blue-300">
                              ماء: {ext?.waterCount}
                            </span>
                          )}
                          {(ext?.wetChemicalCount || 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-orange-300">
                              رطب مطابخ: {ext?.wetChemicalCount}
                            </span>
                          )}
                          {(ext?.cleanAgentCount || 0) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10172B] border border-[#1E2945] text-emerald-300">
                              غاز FM200: {ext?.cleanAgentCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* تاريخ الصيانة */}
                      <td className="p-3.5">
                        <div className="font-mono text-white text-xs">
                          {ext?.lastMaintenanceDate || 'غير مسجل'}
                        </div>
                        <div className="text-[10px] text-[#8992AA] mt-0.5">
                          {ext?.technicianName || 'فني أوريكيت'}
                        </div>
                      </td>

                      {/* تاريخ الانتهاء */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white text-xs">
                          {ext?.expiryDate || 'غير محدد'}
                        </div>
                        <div className="text-[10px] text-[#8992AA] mt-0.5">
                          {formatDateArabic(ext?.expiryDate)}
                        </div>
                      </td>

                      {/* تزكير قبل ١٠ أيام والحالة */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black inline-flex items-center gap-1 whitespace-nowrap ${reminder.badgeClass}`}>
                            {reminder.isExpiringIn10Days && <Bell className="w-3 h-3 animate-pulse" />}
                            <span>{reminder.text}</span>
                          </span>
                          {reminder.isExpiringIn10Days && (
                            <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                              <span>⚡ يلزم إرسال تزكير وتعبئة فورية</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* رقم الملصق */}
                      <td className="p-3.5">
                        <span className="font-mono text-amber-300 text-[11px] bg-[#070B1C] px-2 py-0.5 rounded border border-[#1E2945]">
                          {ext?.certificateOrTagNumber || 'EXT-ORIKET'}
                        </span>
                      </td>

                      {/* الإجراءات المباشرة */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleSendWhatsAppReminder(site)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm active:scale-95"
                            title="إرسال رسالة تزكير وتنبيه عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>تزكير واتساب</span>
                          </button>

                          {/* Call Button */}
                          <a
                            href={`tel:${site.phone}`}
                            className="p-1.5 rounded-lg bg-[#10172B] hover:bg-[#1E2945] text-emerald-400 border border-[#1E2945] transition"
                            title="اتصال هاتفي بالمسؤول"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Update Maintenance Button */}
                          <button
                            onClick={() => handleOpenEdit(site)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#070B1C] font-bold text-[11px] flex items-center gap-1 transition shadow-sm active:scale-95"
                            title="تحديث دورة الصيانة وتاريخ الانتهاء"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>تحديث</span>
                          </button>

                          {/* Print Sticker / Card */}
                          <button
                            onClick={() => setViewingTagSite(site)}
                            className="p-1.5 rounded-lg bg-[#10172B] hover:bg-[#1E2945] text-[#20A9FF] border border-[#1E2945] transition"
                            title="معاينة وطباعة كارت الفحص وملصق الصيانة"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View Facility Site Details */}
                          <button
                            onClick={() => onSelectSite(site)}
                            className="p-1.5 rounded-lg bg-[#10172B] hover:bg-[#1E2945] text-[#8992AA] hover:text-white border border-[#1E2945] transition"
                            title="عرض تفاصيل الموقع الكاملة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 5. ADD NEW MAINTENANCE RECORD MODAL                   */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-[#10172B] border border-[#1E2945] rounded-3xl p-5 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  🧯
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تسجيل صيانة كفاية جديدة لمنشأة</h3>
                  <p className="text-[11px] text-[#8992AA]">
                    حصر اسم المنشأة، أعداد وأنواع الكفايات، تاريخ الصيانة وتاريخ الانتهاء مع التزكير قبل 10 أيام
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#8992AA] hover:text-white rounded-lg hover:bg-[#1E2945]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddModal} className="space-y-3.5 text-xs">
              {/* Site Selection or New Facility */}
              <div className="space-y-1">
                <label className="block text-[#CAD2E0] font-bold">المنشأة المستهدفة:</label>
                <select
                  value={selectedSiteIdForEdit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSiteIdForEdit(val);
                    if (val !== 'new') {
                      const found = sites.find((s) => s.id === val);
                      if (found) {
                        setFormFacilityName(found.name);
                        setFormPhone(found.phone);
                        setFormManagerName(found.managerName);
                        setFormCity(found.city);
                        setFormDistrict(found.district);
                      }
                    }
                  }}
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="new">+ إدخال اسم منشأة جديدة مباشرة</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city} - {s.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* If entering a new facility */}
              {selectedSiteIdForEdit === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[#070B1C]/60 border border-[#1E2945]">
                  <div>
                    <label className="block text-[#CAD2E0] font-bold mb-1">اسم المنشأة: *</label>
                    <input
                      type="text"
                      required
                      value={formFacilityName}
                      onChange={(e) => setFormFacilityName(e.target.value)}
                      placeholder="مثال: مطعم شواية الرافدين، مجمع السلام..."
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl px-3 py-2 text-white placeholder-[#8992AA] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[#CAD2E0] font-bold mb-1">نوع المنشأة:</label>
                    <select
                      value={formFacilityType}
                      onChange={(e) => setFormFacilityType(e.target.value)}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="مطعم">مطعم / كافيه</option>
                      <option value="مجمع تجاري">مجمع تجاري / مول</option>
                      <option value="فندق">فندق / شقق مفروشة</option>
                      <option value="مستودع">مستودع / مخازن</option>
                      <option value="مصنع">مصنع / ورشة</option>
                      <option value="مستشفى">مستشفى / مركز صحي</option>
                      <option value="مدرسة">مدرسة / تعليمي</option>
                      <option value="مكتب">مكتب / شركات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#CAD2E0] font-bold mb-1">المدينة والحي:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="المدينة"
                        className="bg-[#10172B] border border-[#1E2945] rounded-xl px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={formDistrict}
                        onChange={(e) => setFormDistrict(e.target.value)}
                        placeholder="الحي"
                        className="bg-[#10172B] border border-[#1E2945] rounded-xl px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#CAD2E0] font-bold mb-1">اسم وهاتف المسؤول: *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formManagerName}
                        onChange={(e) => setFormManagerName(e.target.value)}
                        placeholder="اسم المسؤول"
                        className="bg-[#10172B] border border-[#1E2945] rounded-xl px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        className="bg-[#10172B] border border-[#1E2945] rounded-xl px-2.5 py-1.5 text-white font-mono text-left"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* أعداد وأنواع الكفايات (Counts & Types) */}
              <div className="p-3 bg-[#070B1C] rounded-2xl border border-[#1E2945] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>عدد ونوع الكفايات والطفايات:</span>
                  </span>
                  <span className="text-[11px] font-mono text-white bg-[#10172B] px-2 py-0.5 rounded-full border border-[#1E2945]">
                    المجموع: {totalFormExtinguishers} كفاية
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">بودرة جافة ABC (6كجم):</label>
                    <input
                      type="number"
                      min="0"
                      value={powder}
                      onChange={(e) => setPowder(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">ثاني أكسيد الكربون CO2:</label>
                    <input
                      type="number"
                      min="0"
                      value={co2}
                      onChange={(e) => setCo2(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">رغوة مائية Foam:</label>
                    <input
                      type="number"
                      min="0"
                      value={foam}
                      onChange={(e) => setFoam(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">ماء مضغوط Water:</label>
                    <input
                      type="number"
                      min="0"
                      value={water}
                      onChange={(e) => setWater(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">رطب للمطابخ K-Class:</label>
                    <input
                      type="number"
                      min="0"
                      value={wetChem}
                      onChange={(e) => setWetChem(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">غاز نظيف FM200:</label>
                    <input
                      type="number"
                      min="0"
                      value={cleanAgent}
                      onChange={(e) => setCleanAgent(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* تاريخ الصيانة وتاريخ الانتهاء */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#CAD2E0] font-bold">تاريخ الصيانة / التعبئة:</label>
                    <button
                      type="button"
                      onClick={() => setMaintDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      اليوم
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#CAD2E0] font-bold">تاريخ الانتهاء / الفحص القادم:</label>
                    <div className="flex gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSetExpiryMonths(6)}
                        className="text-cyan-400 hover:underline"
                      >
                        +6 أشهر
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryMonths(12)}
                        className="text-amber-400 hover:underline"
                      >
                        +1 سنة
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* ملصق الصيانة والفني */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CAD2E0] font-bold mb-1">رقم كارت/ملصق الصيانة:</label>
                  <input
                    type="text"
                    required
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#CAD2E0] font-bold mb-1">الفني المعتمد:</label>
                  <input
                    type="text"
                    required
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* 10-Day Reminder Checkbox */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <input
                  type="checkbox"
                  id="chk10Day"
                  checked={enable10DayReminder}
                  onChange={(e) => setEnable10DayReminder(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 bg-[#070B1C]"
                />
                <label htmlFor="chk10Day" className="text-xs text-amber-200 cursor-pointer font-bold">
                  🔔 تفعيل نظام التزكير التلقائي قبل ١٠ أيام من تاريخ الصيانة والانتهاء
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#CAD2E0] font-bold mb-1">ملاحظات وتوصيات الفحص الفني:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات فحص مقياس الضغط، سلامة الخراطيم، وتوصيات السلامة..."
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2945]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#070B1C] font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>حفظ سجل الصيانة وتفعيل التزكير</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. QUICK EDIT / RENEW MAINTENANCE MODAL              */}
      {/* ==================================================== */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-[#10172B] border border-[#1E2945] rounded-3xl p-5 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  🧯
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تحديث صيانة كفايات المنشأة</h3>
                  <p className="text-[11px] text-[#8992AA]">
                    {editingSite.name} • {editingSite.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSite(null)}
                className="p-1.5 text-[#8992AA] hover:text-white rounded-lg hover:bg-[#1E2945]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#CAD2E0] font-bold">تاريخ الصيانة:</label>
                    <button
                      type="button"
                      onClick={() => setMaintDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      اليوم
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#CAD2E0] font-bold">تاريخ الانتهاء:</label>
                    <button
                      type="button"
                      onClick={() => handleSetExpiryMonths(12)}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      +1 سنة
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="p-3 bg-[#070B1C] rounded-2xl border border-[#1E2945]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-400">عدد ونوع الكفايات:</span>
                  <span className="text-[10px] font-mono text-[#8992AA]">
                    المجموع: {Number(powder || 0) + Number(co2 || 0) + Number(foam || 0) + Number(water || 0) + Number(wetChem || 0) + Number(cleanAgent || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">بودرة ABC:</label>
                    <input
                      type="number"
                      min="0"
                      value={powder}
                      onChange={(e) => setPowder(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">CO2:</label>
                    <input
                      type="number"
                      min="0"
                      value={co2}
                      onChange={(e) => setCo2(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">رغوة:</label>
                    <input
                      type="number"
                      min="0"
                      value={foam}
                      onChange={(e) => setFoam(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">ماء مضغوط:</label>
                    <input
                      type="number"
                      min="0"
                      value={water}
                      onChange={(e) => setWater(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">رطب للمطابخ:</label>
                    <input
                      type="number"
                      min="0"
                      value={wetChem}
                      onChange={(e) => setWetChem(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8992AA] mb-0.5">غاز FM200:</label>
                    <input
                      type="number"
                      min="0"
                      value={cleanAgent}
                      onChange={(e) => setCleanAgent(Number(e.target.value))}
                      className="w-full bg-[#10172B] border border-[#1E2945] rounded-lg p-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CAD2E0] font-bold mb-1">رقم ملصق/كارت الصيانة:</label>
                  <input
                    type="text"
                    required
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#CAD2E0] font-bold mb-1">الفني المعتمد:</label>
                  <input
                    type="text"
                    required
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#CAD2E0] font-bold mb-1">ملاحظات الفحص:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات وتوصيات الفحص الدوري..."
                  className="w-full bg-[#070B1C] border border-[#1E2945] rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2945]">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#070B1C] font-black flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تحديث دورة الصيانة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. PRINTABLE STICKER / INSPECTION TAG MODAL          */}
      {/* ==================================================== */}
      {viewingTagSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-[#10172B] border border-[#1E2945] rounded-3xl p-5 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E2945] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">كارت وملصق فحص كفايات الحريق المعتمد</h3>
              </div>
              <button
                onClick={() => setViewingTagSite(null)}
                className="p-1.5 text-[#8992AA] hover:text-white rounded-lg hover:bg-[#1E2945]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Sticker Preview Card */}
            <div className="bg-white text-slate-900 p-5 rounded-2xl border-4 border-amber-500 shadow-xl space-y-3 font-sans" dir="rtl">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div className="text-right">
                  <div className="font-black text-sm text-slate-900">شركة أوريكيت للسلامة والوقاية</div>
                  <div className="text-[10px] text-slate-600 font-bold">بطاقة فحص وصيانة كفايات الحريق</div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg">
                  🧯
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px]">اسم المنشأة:</span>
                  <span className="font-bold text-slate-950">{viewingTagSite.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">رقم الملصق:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {viewingTagSite.extinguisherMaintenance?.certificateOrTagNumber || 'EXT-ORIKET'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">المدينة والحي:</span>
                  <span className="font-semibold">{viewingTagSite.city} - {viewingTagSite.district}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">رقم هاتف المنشأة:</span>
                  <span className="font-mono text-slate-800">{viewingTagSite.phone}</span>
                </div>
              </div>

              {/* Maintenance & Expiry Dates */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-center">
                <div>
                  <span className="text-[10px] text-slate-600 block">تاريخ الفحص / الصيانة:</span>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {viewingTagSite.extinguisherMaintenance?.lastMaintenanceDate || '2025-10-10'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block">تاريخ انتهاء الصلاحية:</span>
                  <span className="font-mono font-bold text-xs text-rose-700">
                    {viewingTagSite.extinguisherMaintenance?.expiryDate || '2026-10-10'}
                  </span>
                </div>
              </div>

              {/* Counts & Types */}
              <div className="text-[11px] space-y-1">
                <span className="text-slate-500 text-[10px] block font-bold">أعداد وأنواع الكفايات المفحوصة:</span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                    بودرة ABC: {viewingTagSite.extinguisherMaintenance?.powderCount ?? viewingTagSite.equipment?.extinguishers?.totalCount ?? 0}
                  </span>
                  {(viewingTagSite.extinguisherMaintenance?.co2Count || 0) > 0 && (
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      CO2: {viewingTagSite.extinguisherMaintenance?.co2Count}
                    </span>
                  )}
                  {(viewingTagSite.extinguisherMaintenance?.foamCount || 0) > 0 && (
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      رغوة: {viewingTagSite.extinguisherMaintenance?.foamCount}
                    </span>
                  )}
                  {(viewingTagSite.extinguisherMaintenance?.waterCount || 0) > 0 && (
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      ماء: {viewingTagSite.extinguisherMaintenance?.waterCount}
                    </span>
                  )}
                  {(viewingTagSite.extinguisherMaintenance?.wetChemicalCount || 0) > 0 && (
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      رطب: {viewingTagSite.extinguisherMaintenance?.wetChemicalCount}
                    </span>
                  )}
                  {(viewingTagSite.extinguisherMaintenance?.cleanAgentCount || 0) > 0 && (
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      غاز FM200: {viewingTagSite.extinguisherMaintenance?.cleanAgentCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Stamp & QR Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-300 text-[10px]">
                <div>
                  <span className="text-slate-500 block">الفني المعتمد:</span>
                  <span className="font-bold">{viewingTagSite.extinguisherMaintenance?.technicianName || 'فني صيانة معتمد'}</span>
                  <span className="text-emerald-700 font-bold block text-[9px]">✓ مطابق لاشتراطات كود البناء</span>
                </div>
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center p-1">
                  <QrCode className="w-8 h-8 text-slate-800" />
                  <span className="text-[7px] text-slate-500 font-mono">ORIKET-QR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2945]">
              <button
                type="button"
                onClick={() => setViewingTagSite(null)}
                className="px-4 py-2 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-white font-bold text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#070B1C] font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصق الميداني</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
