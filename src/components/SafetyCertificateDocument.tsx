import React from 'react';
import { ContractData } from '../types/contract';
import { COMPANY_DETAILS } from '../constants/defaultContract';
import { LetterheadHeader } from './LetterheadHeader';
import { LetterheadFooter } from './LetterheadFooter';
import { CompanyStamp } from './CompanyStamp';
import { LetterheadWatermark } from './Watermark';
import { ContractQrCode } from './ContractQrCode';
import { ShieldCheck, Flame, Calendar, Building2, UserCheck, CheckCircle2, ClipboardList } from 'lucide-react';

interface SafetyCertificateDocumentProps {
  contract: ContractData;
  id?: string;
}

export const SafetyCertificateDocument: React.FC<SafetyCertificateDocumentProps> = ({
  contract,
  id = 'printable-safety-certificate',
}) => {
  const {
    contractNumber,
    contractDate,
    contractHijriDate,
    clientName,
    facilityName,
    commercialRegOrId,
    clientPhone,
    city,
    district,
    street,
    activityType,
    buildingFloors,
    safetyItems,
    inspectorName,
    inspectorLicense,
    certificateNotes,
    options,
  } = contract;

  const certificateNumber = contractNumber.replace('ORK-CD', 'ORK-SAF');

  return (
    <div
      id={id}
      className="a4-page a4-print-page relative shadow-2xl rounded-xs overflow-hidden flex flex-col justify-between text-slate-800 font-['Cairo',sans-serif] bg-white border border-slate-200"
      style={{
        boxSizing: 'border-box',
        minHeight: '297mm',
        height: '297mm', // exact A4 height
        width: '210mm',
        position: 'relative',
        ...(options.customLetterheadImage
          ? {
              backgroundImage: `url(${options.customLetterheadImage})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }
          : {}),
      }}
    >
      {/* Background Watermark */}
      {options.showWatermark && !options.customLetterheadImage && (
        <LetterheadWatermark />
      )}

      {/* Top Section: Digital Letterhead or Empty Spacing */}
      <div className="relative z-10 shrink-0">
        {options.showLetterhead && !options.customLetterheadImage ? (
          <LetterheadHeader />
        ) : (
          <div className="h-[28mm] w-full" />
        )}
      </div>

      {/* Main Body */}
      <div className="relative z-10 px-8 py-1 flex-1 flex flex-col gap-1.5 text-[11px] leading-relaxed">
        {/* Certificate Title Header Box - Unified & Compact */}
        <div className="border-2 border-[#992621]/30 rounded-lg p-2 bg-gradient-to-b from-red-50/70 via-white to-slate-50/50 shadow-2xs">
          {/* Centered Main Certificate Title */}
          <div className="text-center pb-1.5 border-b border-[#992621]/20">
            <div className="inline-flex items-center justify-center gap-1.5 text-[#992621]">
              <span className="p-1 rounded-full bg-[#992621] text-white">
                <ShieldCheck size={14} />
              </span>
              <h1 className="text-[15px] font-black font-['Cairo',sans-serif] leading-tight">
                مشهد سلامة وشهادة كشف وصلاحية أدوات الوقاية من الحريق
              </h1>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px]">
              <span className="font-bold text-slate-700">موجّه إلى السادة /</span>
              <span className="font-extrabold text-[#992621] bg-red-100/60 border border-red-200 px-2 py-0.2 rounded">
                المديرية العامة للدفاع المدني - منصة سلامة وتراخيص بلدي المحترمين
              </span>
            </div>
          </div>

          {/* Integrated Metadata Row */}
          <div className="flex items-center justify-between pt-1.5 px-1 text-[10px]">
            {/* Certificate Number */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">رقم المشهد:</span>
              <span className="font-mono font-black text-[#992621] text-[11px] bg-white border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                {certificateNumber}
              </span>
            </div>

            {/* Inspection Date */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">تاريخ الكشف:</span>
              <span className="font-semibold text-slate-800 font-mono">{contractDate} م</span>
              {contractHijriDate && (
                <span className="text-slate-500 mr-1 font-sans">({contractHijriDate})</span>
              )}
            </div>

            {/* Associated Contract */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">رقم عقد الصيانة:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                {contractNumber}
              </span>
            </div>

            {/* QR Code */}
            {options.showQrCode && (
              <div className="flex items-center gap-1 shrink-0">
                <ContractQrCode
                  contractNumber={certificateNumber}
                  clientName={clientName}
                  date={contractDate}
                  size={36}
                />
              </div>
            )}
          </div>
        </div>

        {/* Facility Information Box */}
        <div className="border border-slate-200 rounded-md p-2 bg-slate-50/70 mt-0.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1 text-[11px] font-bold">
            <span className="text-slate-900 flex items-center gap-1">
              <Building2 size={13} className="text-[#992621]" />
              بيانات المنشأة والموقع المفحوص:
            </span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[9.5px] px-1.5 py-0.2 rounded font-bold">
              معاينة ميدانية مكتملة
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500 block">اسم المنشأة / العميل:</span>
              <span className="font-bold text-slate-900 text-[10.5px]">
                {clientName} {facilityName ? `(${facilityName})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">السجل التجاري / الهوية:</span>
              <span className="font-mono font-bold text-slate-800">{commercialRegOrId || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">نوع النشاط التجاري:</span>
              <span className="font-semibold text-slate-800">{activityType || 'نشاط تجاري'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">عدد أدوار المنشأة:</span>
              <span className="font-bold text-[#992621] bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-block text-[9.5px]">
                {buildingFloors || 'دور أرضي'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">العنوان والموقع:</span>
              <span className="text-slate-800">{[city, district, street].filter(Boolean).join(' - ') || 'خميس مشيط'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">رقم الجوال:</span>
              <span className="font-mono font-bold text-slate-800">{clientPhone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">الجهة الفاحصة:</span>
              <span className="font-bold text-[#992621]">{COMPANY_DETAILS.nameAr}</span>
            </div>
          </div>
        </div>

        {/* Formal Endorsement Statement */}
        <div className="border-r-4 border-[#992621] bg-red-50/30 p-2 rounded-l-md text-[10px] text-justify leading-relaxed mt-1 text-slate-800">
          <strong className="text-[#992621] font-black">إفادة وإقرار فني: </strong>
          تشهد شركة أوريكيت للمقاولات العامة (الرقم الموحد: <span className="font-mono font-bold">{COMPANY_DETAILS.unifiedNumber}</span>) والمؤهلة والمعتمدة لدى المديرية العامة للدفاع المدني، بأنه تم إجراء الكشف والفحص الفني والاختبار الميداني لكافة أجهزة ومعدات السلامة ومكافحة الحريق في منشأة الطرف الثاني المذكورة أعلاه، وتفيد الشركة بأن أدوات وأنظمة السلامة الموضحة بالجدول أدناه مركبة ومطابقة لاشتراطات ولوائح الدفاع المدني السعودي وكود البناء السعودي (SBC-801) وتعمل بكفاءة تامة وخالية من أي ملاحظات فنية، وصالحة للاستخدام.
        </div>

        {/* Detailed Safety Tools Table */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white mt-1 shadow-2xs">
          <div className="bg-slate-100/90 px-3 py-1 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-800">
            <span className="flex items-center gap-1 text-[#992621]">
              <ClipboardList size={12} />
              بيان وجدول أدوات ومعدات السلامة ومكافحة الحريق المفحوصة والمعتمدة:
            </span>
            <span className="text-slate-500 text-[9px]">
              الحالة التشغيلية: 100% صالحة للاستخدام
            </span>
          </div>

          <table className="w-full text-right text-[9.5px] border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-1 px-2 w-7 text-center">م</th>
                <th className="py-1 px-2">اسم الأداة / النظام</th>
                <th className="py-1 px-2">المواصفة والسعة الفنية</th>
                <th className="py-1 px-2 text-center w-12">العدد</th>
                <th className="py-1 px-2 text-center w-12">الوحدة</th>
                <th className="py-1 px-2 text-center w-24">الحالة الفنية</th>
                <th className="py-1 px-2 text-center w-24">صلاحية الفحص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {safetyItems.slice(0, 10).map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}>
                  <td className="py-1 px-2 text-center font-bold font-mono text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-2 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-1 px-2 text-slate-600 font-medium">
                    {item.spec}
                  </td>
                  <td className="py-1 px-2 text-center font-bold font-mono text-[#992621]">
                    {item.quantity}
                  </td>
                  <td className="py-1 px-2 text-center text-slate-500">
                    {item.unit}
                  </td>
                  <td className="py-1 px-2 text-center">
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[8.5px] border border-emerald-200">
                      <CheckCircle2 size={10} />
                      {item.status || 'سليم ويعمل'}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center text-slate-600 font-medium text-[9px]">
                    {item.expiryDate || 'ساري الصلاحية'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate Notes & Safety Guidance */}
        <div className="border border-slate-200 rounded-md p-1.5 px-2 bg-amber-50/20 text-[9.5px] mt-1 space-y-0.5 text-slate-700">
          <p>
            <strong className="text-amber-900 font-bold">ملاحظات واعتماد الفحص: </strong>
            {certificateNotes || 'تم فحص جميع أدوات السلامة المذكورة أعلاه واختبار كفاءتها التشغيلية ومطابقتها للمواصفات واللوائح الفنية للمديرية العامة للدفاع المدني، ويوصى بالصيانة الوقائية المستمرة.'}
          </p>
          <p className="text-[9px] text-slate-500 leading-tight">
            * هذا المشهد صادر بناءً على عقد الصيانة المبرم برقم ({contractNumber}) وهو صالح لمدة عام من تاريخ تحريره لتقديمه للجهات المختصة.
          </p>
        </div>

        {/* Signatures & Seal Section */}
        <div className="mt-auto border-t-2 border-slate-300 pt-2 pb-1">
          <div className="grid grid-cols-3 gap-3 items-end relative">
            {/* Inspector Details */}
            <div className="text-center text-[10px]">
              <p className="font-extrabold text-slate-900 mb-0.5 flex items-center justify-center gap-1">
                <UserCheck size={12} className="text-[#992621]" />
                المهندس / الفاحص الفني
              </p>
              <p className="text-[9.5px] text-slate-700 font-bold">
                {inspectorName || 'م. أحمد خالد الشهري'}
              </p>
              <p className="text-[8.5px] text-slate-500 font-mono">
                رقم الاعتماد: {inspectorLicense || 'SE-98421'}
              </p>
              <div className="mt-4 border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-[9px] text-slate-400">
                التوقيع الفني
              </div>
            </div>

            {/* Official Company Seal & Manager Signature */}
            <div className="text-center relative">
              <p className="font-extrabold text-[#992621] text-[11px] mb-0.5">
                شركة أوريكيت للمقاولات العامة
              </p>
              <p className="text-[9px] text-slate-600 font-semibold mb-6">
                الختم والاعتماد الرسمي المعتمد
              </p>

              {/* Digital Stamp Overlay */}
              {options.showStamp && (
                <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 z-20 pointer-events-none">
                  <CompanyStamp size={110} rotation={-4} />
                </div>
              )}

              <div className="mt-8 border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 flex justify-center">
                {options.showSignature && (
                  <span className="font-serif italic text-blue-900 font-black text-sm tracking-wider">
                    Orekit Gen. Cont.
                  </span>
                )}
              </div>
              <p className="text-[8.5px] text-slate-500 mt-0.5">الاعتماد الرسمي</p>
            </div>

            {/* Facility Representative */}
            <div className="text-center text-[10px]">
              <p className="font-extrabold text-amber-950 text-[10.5px] mb-0.5">
                المستلم / صاحب المنشأة
              </p>
              <p className="text-[9.5px] text-slate-700 font-bold">
                الاسم: {clientName || '...............................'}
              </p>
              <p className="text-[8.5px] text-slate-500">
                الصفة: المفوض النظامي
              </p>
              <div className="mt-4 border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-[9px] text-slate-400">
                التوقيع والختم
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Digital Letterhead Footer or Empty Spacing */}
      <div className="relative z-10 shrink-0">
        {options.showLetterhead && !options.customLetterheadImage ? (
          <LetterheadFooter />
        ) : (
          <div className="h-[22mm] w-full" />
        )}
      </div>
    </div>
  );
};
