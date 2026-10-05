import React, { useRef, useState, useEffect } from 'react';
import { ContractData, PresetTemplateId, SafetyEquipmentItem } from '../types/contract';
import { CONTRACT_PRESETS, getOneYearLater, generateContractNumber, STANDARD_CLAUSES, DEFAULT_SAFETY_ITEMS } from '../constants/defaultContract';
import { WhatsAppIcon } from './WhatsAppIcon';
import { shareContractViaWhatsApp } from '../utils/whatsapp';
import {
  FileText,
  User,
  Calendar,
  Building,
  DollarSign,
  Shield,
  Settings,
  Sparkles,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  ClipboardList,
  Wrench,
  UserCheck
} from 'lucide-react';

interface ContractFormProps {
  contract: ContractData;
  onChange: (updated: ContractData) => void;
  onApplyPreset: (presetId: PresetTemplateId) => void;
  onSaveContract: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  onChange,
  onApplyPreset,
  onSaveContract,
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'safetyItems' | 'clauses' | 'display'>('primary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically ensure all 20 official clauses are synced
  useEffect(() => {
    if (!contract.clauses || contract.clauses.length < 20 || !contract.clauses[0]?.includes('التمهيد')) {
      onChange({
        ...contract,
        clauses: [...STANDARD_CLAUSES],
      });
    }
  }, []);

  // Quick field updater
  const updateField = <K extends keyof ContractData>(key: K, value: ContractData[K]) => {
    onChange({
      ...contract,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Option updater
  const updateOption = <K extends keyof ContractData['options']>(key: K, value: ContractData['options'][K]) => {
    onChange({
      ...contract,
      options: {
        ...contract.options,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle start date change & auto compute end date (1 year later)
  const handleStartDateChange = (newStartDate: string) => {
    const newEndDate = getOneYearLater(newStartDate);
    onChange({
      ...contract,
      startDate: newStartDate,
      endDate: newEndDate,
      contractDate: newStartDate,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle safety items
  const updateSafetyItem = (index: number, updatedItem: SafetyEquipmentItem) => {
    const newItems = [...contract.safetyItems];
    newItems[index] = updatedItem;
    updateField('safetyItems', newItems);
  };

  const removeSafetyItem = (index: number) => {
    const newItems = contract.safetyItems.filter((_, i) => i !== index);
    updateField('safetyItems', newItems);
  };

  const addSafetyItem = () => {
    const newItem: SafetyEquipmentItem = {
      id: `item_${Date.now()}`,
      name: 'أداة سلامة جديدة',
      spec: 'مواصفة معتمدة',
      quantity: 1,
      unit: 'حبة',
      status: 'سليم ويعمل',
      expiryDate: 'ساري الصلاحية',
    };
    updateField('safetyItems', [...contract.safetyItems, newItem]);
  };

  // Handle custom image upload for letterhead background
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateOption('customLetterheadImage', base64);
      updateOption('showLetterhead', false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Form Header with Quick Actions */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="text-[#992621]" size={18} />
              بيانات العقد ومشهد السلامة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديث بيانات العميل والتواريخ وأدوات السلامة للوثيقتين مباشرة
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                updateField('contractNumber', generateContractNumber());
              }}
              title="توليد رقم عقد جديد"
              className="p-1.5 text-xs text-slate-600 hover:text-[#992621] hover:bg-slate-200/60 rounded-md transition flex items-center gap-1 border border-slate-300"
            >
              <RefreshCw size={13} />
              <span>رقم جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div>
          <span className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            نماذج أنشطة جاهزة سريعة:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {CONTRACT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:border-[#992621] hover:text-[#992621] transition text-center shadow-2xs"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex items-center gap-1 mt-3 border-b border-slate-200 text-xs font-bold -mb-4 pt-1">
          <button
            onClick={() => setActiveTab('primary')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'primary'
                ? 'border-[#992621] text-[#992621]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={14} />
            العميل والتواريخ
          </button>
          <button
            onClick={() => setActiveTab('safetyItems')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'safetyItems'
                ? 'border-[#992621] text-[#992621]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={14} />
            أدوات مشهد السلامة
            <span className="bg-red-100 text-[#992621] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {contract.safetyItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clauses')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'clauses'
                ? 'border-[#992621] text-[#992621]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCheck size={14} />
            شروط وبنود العقد
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'display'
                ? 'border-[#992621] text-[#992621]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings size={14} />
            الترويسة والأختام
          </button>
        </div>
      </div>

      {/* Tab Contents Scrollable Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
        {/* TAB 1: Primary (Client Name, Contract Dates, Basic Info) */}
        {activeTab === 'primary' && (
          <div className="space-y-4">
            {/* Top Priority: Client Name & Dates Highlight Box */}
            <div className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#992621]">
                <Sparkles size={14} />
                <span>البيانات الأساسية المتغيرة (العميل والتواريخ):</span>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم العميل / اسم المنشأة أو الشركة *
                </label>
                <input
                  type="text"
                  value={contract.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  placeholder="مثال: مؤسسة أفق التقنية للتجارة أو محمد أحمد الشهري"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#992621]/20 focus:border-[#992621] bg-white text-slate-900"
                />
              </div>

              {/* Facility Name & CR */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اسم المحل / المعرض (إن وجد)
                  </label>
                  <input
                    type="text"
                    value={contract.facilityName}
                    onChange={(e) => updateField('facilityName', e.target.value)}
                    placeholder="مثال: مطعم شواية الخليج"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رقم السجل التجاري / الهوية *
                  </label>
                  <input
                    type="text"
                    value={contract.commercialRegOrId}
                    onChange={(e) => updateField('commercialRegOrId', e.target.value)}
                    placeholder="1010XXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Contract Date & Start Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-[#992621]" />
                    تاريخ بداية العقد (ميلادي) *
                  </label>
                  <input
                    type="date"
                    value={contract.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-emerald-700" />
                    تاريخ نهاية العقد (سنة كاملة تلقائياً)
                  </label>
                  <input
                    type="date"
                    value={contract.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Hijri Date optional string */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  التاريخ الهجري (اختياري للتوثيق الرسمي)
                </label>
                <input
                  type="text"
                  value={contract.contractHijriDate || ''}
                  onChange={(e) => updateField('contractHijriDate', e.target.value)}
                  placeholder="مثال: 1448/04/24 هـ"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Contract Number & Optional Financial Value */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contract.options.showFinancialAmount !== false}
                    onChange={(e) => updateOption('showFinancialAmount', e.target.checked)}
                    className="w-4 h-4 rounded text-[#992621] focus:ring-[#992621] accent-[#992621]"
                  />
                  <DollarSign size={13} className="text-emerald-600" />
                  <span>تحديد قيمة العقد المالية (اختياري)</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {contract.options.showFinancialAmount !== false ? 'محددة بالريال' : 'حسب الاتفاق (بدون مبلغ)'}
                </span>
              </div>

              {contract.options.showFinancialAmount !== false ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      قيمة العقد (ريال سعودي)
                    </label>
                    <input
                      type="number"
                      value={contract.totalAmount ?? ''}
                      onChange={(e) => updateField('totalAmount', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="أدخل المبلغ (أو اتركه فارغاً)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 font-bold font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      ضريبة القيمة المضافة
                    </label>
                    <select
                      value={contract.isVatIncluded ? 'included' : 'excluded'}
                      onChange={(e) => updateField('isVatIncluded', e.target.value === 'included')}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 text-xs"
                    >
                      <option value="included">شامل ضريبة القيمة المضافة (15%)</option>
                      <option value="excluded">غير شامل ضريبة القيمة المضافة</option>
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                  💡 تم تفعيل العقد كـ <strong>«حسب الاتفاق المبرم ومحضر الفحص الفني»</strong> ولن يُلزم إدخال أي مبلغ مالي.
                </p>
              )}
            </div>

            {/* Location & Contact Information */}
            <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/40">
              <span className="text-[11px] font-extrabold text-slate-800 block flex items-center gap-1">
                <Building size={13} className="text-slate-600" />
                بيانات الموقع والنشاط التجاري:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">نوع النشاط</label>
                  <input
                    type="text"
                    value={contract.activityType}
                    onChange={(e) => updateField('activityType', e.target.value)}
                    placeholder="مطعم، محل بيع ملابس، مقهى، مستودع..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                    <span>جوال العميل للتواصل</span>
                    {contract.clientPhone && (
                      <span className="text-[9px] text-emerald-600 font-bold">جاهز للواتساب ✓</span>
                    )}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={contract.clientPhone}
                      onChange={(e) => updateField('clientPhone', e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => shareContractViaWhatsApp(contract)}
                      title="فتح محادثة واتساب مع العميل مباشرة"
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                    >
                      <WhatsAppIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">المدينة</label>
                  <input
                    type="text"
                    value={contract.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="خميس مشيط"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">الحي</label>
                  <input
                    type="text"
                    value={contract.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="حي الضيافة"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">الشارع</label>
                  <input
                    type="text"
                    value={contract.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="الشارع العام"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Number of Floors (عدد الأدوار) */}
              <div className="pt-1 border-t border-slate-200">
                <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building size={12} className="text-[#992621]" />
                    عدد أدوار المنشأة (يظهر بمشهد السلامة والعقد):
                  </span>
                  <span className="text-[9px] text-slate-400">اختر أو اكتب</span>
                </label>
                <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                  {['دور أرضي', 'أرضي + ميزانين', 'دورين', '3 أدوار', '4 أدوار', 'بدروم + أرضي'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateField('buildingFloors', preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition border ${
                        contract.buildingFloors === preset
                          ? 'bg-[#992621] text-white border-[#992621]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={contract.buildingFloors || ''}
                  onChange={(e) => updateField('buildingFloors', e.target.value)}
                  placeholder="مثال: دور أرضي، دورين، 3 طوابق..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#992621] bg-white text-slate-900 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Safety Items Table for Mashhad Salamah (Page 2) */}
        {activeTab === 'safetyItems' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-[#992621]" />
                  جدول أدوات السلامة (مشهد السلامة - الصفحة 2):
                </h3>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  حدد كميات ومواصفات أدوات السلامة التي تم فحصها واعتمادها بالمنشأة
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateField('safetyItems', [...DEFAULT_SAFETY_ITEMS])}
                className="text-[11px] text-[#992621] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} />
                استعادة الافتراضي
              </button>
            </div>

            {/* Building Floors quick selector in Tab 2 */}
            <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#992621] text-[11px] flex items-center gap-1.5">
                  <Building size={13} />
                  عدد أدوار المنشأة المفحوصة (المعتمد في مشهد السلامة):
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-red-200">
                  {contract.buildingFloors || 'دور أرضي'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['دور أرضي', 'أرضي + ميزانين', 'دورين', '3 أدوار', '4 أدوار', 'بدروم + أرضي', '5 أدوار فأكثر'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateField('buildingFloors', preset)}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition border cursor-pointer ${
                      contract.buildingFloors === preset
                        ? 'bg-[#992621] text-white border-[#992621] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Safety Items */}
            <div className="space-y-2">
              {contract.safetyItems.map((item, idx) => (
                <div key={item.id || idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#992621] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateSafetyItem(idx, { ...item, name: e.target.value })}
                      placeholder="اسم أداة السلامة"
                      className="flex-1 font-bold text-xs text-slate-900 px-2 py-1 bg-white border border-slate-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeSafetyItem(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="حذف الأداة"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.spec}
                        onChange={(e) => updateSafetyItem(idx, { ...item, spec: e.target.value })}
                        placeholder="المواصفة / السعة"
                        className="w-full text-slate-700 px-2 py-1 bg-white border border-slate-200 rounded text-[10.5px]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateSafetyItem(idx, { ...item, quantity: Number(e.target.value) })}
                        placeholder="العدد"
                        className="w-full font-bold font-mono text-center text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded text-[10.5px]"
                      />
                    </div>
                    <div>
                      <select
                        value={item.status}
                        onChange={(e) => updateSafetyItem(idx, { ...item, status: e.target.value as any })}
                        className="w-full text-slate-700 px-1 py-1 bg-white border border-slate-200 rounded text-[10px]"
                      >
                        <option value="سليم ويعمل">سليم ويعمل</option>
                        <option value="تم تركيبه وفحصه">تم تركيبه وفحصه</option>
                        <option value="تمت إعادة التعبئة">تمت إعادة التعبئة</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSafetyItem}
              className="w-full py-2 border border-dashed border-[#992621]/40 rounded-lg text-[#992621] hover:bg-red-50/50 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={14} />
              إضافة أداة سلامة جديدة للجدول
            </button>

            {/* Certifying Inspector Details */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-3">
              <span className="font-extrabold text-slate-800 text-[11px] flex items-center gap-1">
                <UserCheck size={13} className="text-[#992621]" />
                بيانات المهندس / الفاحص الفني المعتمد:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">اسم المهندس / الفاحص</label>
                  <input
                    type="text"
                    value={contract.inspectorName || ''}
                    onChange={(e) => updateField('inspectorName', e.target.value)}
                    placeholder="م. أحمد خالد الشهري"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">رقم الاعتماد المهني</label>
                  <input
                    type="text"
                    value={contract.inspectorLicense || ''}
                    onChange={(e) => updateField('inspectorLicense', e.target.value)}
                    placeholder="SE-98421"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Clauses & Legal Terms */}
        {activeTab === 'clauses' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs">
                  بنود وشروط عقد الصيانة المعتمدة
                </h3>
                <p className="text-[10.5px] text-slate-500">
                  صيغة العقد مطابقة لمتطلبات الدفاع المدني السعودي ومنصة سلامة
                </p>
              </div>
              <button
                onClick={() => updateField('clauses', [...STANDARD_CLAUSES])}
                className="text-[11px] text-[#992621] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} />
                استعادة البنود القياسية
              </button>
            </div>

            {/* Clauses Layout Format Selector */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                طريقة كتابة البنود بالورقة:
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => updateOption('clausesFormat', 'flowing')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${
                    contract.options.clausesFormat !== 'list'
                      ? 'bg-[#992621] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  شاملة من اليمين لليسار (معتمدة)
                </button>
                <button
                  type="button"
                  onClick={() => updateOption('clausesFormat', 'list')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${
                    contract.options.clausesFormat === 'list'
                      ? 'bg-[#992621] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  قائمة أسطر متتالية
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {contract.clauses.map((clause, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#992621]/10 text-[#992621] font-bold flex items-center justify-center text-[10px] shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={clause}
                    onChange={(e) => {
                      const updatedClauses = [...contract.clauses];
                      updatedClauses[idx] = e.target.value;
                      updateField('clauses', updatedClauses);
                    }}
                    className="flex-1 bg-transparent border-0 focus:ring-1 focus:ring-[#992621] rounded p-1 text-[11px] text-slate-800 resize-none leading-relaxed"
                  />
                  <button
                    onClick={() => {
                      const updatedClauses = contract.clauses.filter((_, i) => i !== idx);
                      updateField('clauses', updatedClauses);
                    }}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="حذف البند"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                updateField('clauses', [...contract.clauses, 'بند جديد إضافي متفق عليه بين الطرفين...']);
              }}
              className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-[#992621] hover:text-[#992621] font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <Plus size={13} />
              إضافة بند مخصص
            </button>
          </div>
        )}

        {/* TAB 4: Letterhead, Stamp & Printing Options */}
        {activeTab === 'display' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs mb-1">
                خيارات الورقة المروسة والأختام الرسمية:
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                تحكم في كيفية ظهور الترويسة والختم الرسمي على الوثيقتين
              </p>

              <div className="space-y-2">
                {/* Digital Letterhead Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      إظهار ترويسة شركة أوريكيت الرقمية (Header & Footer)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ترويسة فيكتور رقمية فائقة الدقة متطابقة مع الورقة الرسمية
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={contract.options.showLetterhead}
                    onChange={(e) => updateOption('showLetterhead', e.target.checked)}
                    className="accent-[#992621] w-4 h-4"
                  />
                </label>

                {/* Company Official Stamp */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      إظهار ختم شركة أوريكيت الرسمي
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      الختم الدائري الأزرق المعتمد مع الرقم الموحد ٧٠٥٤٨٧٥٥٧٥
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={contract.options.showStamp}
                    onChange={(e) => updateOption('showStamp', e.target.checked)}
                    className="accent-[#992621] w-4 h-4"
                  />
                </label>

                {/* Signature */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      إظهار توقيع الإدارة المعتمد
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      توقيع مدير الفرع / المفوض بالاعتماد
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={contract.options.showSignature}
                    onChange={(e) => updateOption('showSignature', e.target.checked)}
                    className="accent-[#992621] w-4 h-4"
                  />
                </label>

                {/* Watermark */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      إظهار العلامة المائية في خلفية العقد والمشهد
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      شعار أوريكيت شفاف في منتصف الصفحة
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={contract.options.showWatermark}
                    onChange={(e) => updateOption('showWatermark', e.target.checked)}
                    className="accent-[#992621] w-4 h-4"
                  />
                </label>

                {/* QR Code */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      إظهار باركود التحقق الإلكتروني (QR Code)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      باركود فوري لبيانات العقد لمتطلبات منصة سلامة
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={contract.options.showQrCode}
                    onChange={(e) => updateOption('showQrCode', e.target.checked)}
                    className="accent-[#992621] w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Print on physical paper mode reminder */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-xs">
                <HelpCircle size={14} className="text-amber-700" />
                <span>الطباعة على ورق الشركة المطبوع مسبقاً:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                إذا كنت ستضع أوراق شركة أوريكيت المروسة الحقيقية داخل درج الطابعة، قم بإلغاء خيار
                <strong> "إظهار ترويسة شركة أوريكيت الرقمية"</strong> وسيقوم النظام بترك المسافات العلوية والسفلية فارغة بدقة حتى يُطبع النص فوق ورقتك الحقيقية تماماً.
              </p>
              <button
                type="button"
                onClick={() => {
                  updateOption('showLetterhead', false);
                  updateOption('showWatermark', false);
                }}
                className="text-[11px] font-bold bg-white text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-amber-100/50 transition"
              >
                تجهيز النموذج للطباعة على ورق جاهز (إخفاء الترويسة)
              </button>
            </div>

            {/* Custom letterhead image upload */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-800 block mb-1">
                استخدام صورة ورقة مخصصة كخلفية (اختياري):
              </span>
              <p className="text-[10.5px] text-slate-500 mb-2">
                يمكنك رفع صورة الورقة المروسة مباشرة من جهازك لتكون خلفية للعقد
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:border-[#992621] text-slate-700 hover:text-[#992621] flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Upload size={13} />
                  رفع صورة ورقة مروسة
                </button>

                {contract.options.customLetterheadImage && (
                  <button
                    type="button"
                    onClick={() => {
                      updateOption('customLetterheadImage', null);
                      updateOption('showLetterhead', true);
                      updateOption('showWatermark', true);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition"
                  >
                    إلغاء الصورة المرفوعة
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Footer Save Button */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          آخر تعديل: {new Date(contract.updatedAt).toLocaleTimeString('ar-SA')}
        </span>
        <button
          onClick={onSaveContract}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <CheckCircle2 size={14} />
          حفظ في سجل العقود
        </button>
      </div>
    </div>
  );
};
