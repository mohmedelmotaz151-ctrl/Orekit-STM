import React from 'react';
import { ContractData } from '../types/contract';
import { COMPANY_DETAILS, STANDARD_CLAUSES } from '../constants/defaultContract';
import { LetterheadHeader } from './LetterheadHeader';
import { LetterheadFooter } from './LetterheadFooter';
import { CompanyStamp } from './CompanyStamp';
import { LetterheadWatermark } from './Watermark';
import { ContractQrCode } from './ContractQrCode';
import { ShieldCheck, Calendar, Building2 } from 'lucide-react';

interface ContractDocumentProps {
  contract: ContractData;
  id?: string;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({ contract, id = 'printable-contract' }) => {
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
    startDate,
    endDate,
    totalAmount,
    isVatIncluded,
    clauses,
    options,
  } = contract;

  // Ensure all 20 official clauses are always present
  const activeClauses = (clauses && clauses.length >= 20 && clauses[0]?.includes('التمهيد'))
    ? clauses
    : STANDARD_CLAUSES;

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

      {/* Top Section: Either Digital Letterhead or Empty Spacing for Physical Paper */}
      <div className="relative z-10 shrink-0">
        {options.showLetterhead && !options.customLetterheadImage ? (
          <LetterheadHeader />
        ) : (
          // Spacing for pre-printed letterhead paper
          <div className="h-[28mm] w-full" />
        )}
      </div>

      {/* Contract Main Body */}
      <div className="relative z-10 px-8 py-1 flex-1 flex flex-col gap-1.5 text-[11px] leading-relaxed">
        {/* Title & Metadata Header Box - Unified & Compact */}
        <div className="border-2 border-[#992621]/30 rounded-lg p-2 bg-gradient-to-b from-red-50/70 via-white to-slate-50/50 shadow-2xs">
          {/* Centered Main Document Title */}
          <div className="text-center pb-1.5 border-b border-[#992621]/20">
            <div className="inline-flex items-center justify-center gap-1.5 text-[#992621]">
              <span className="p-1 rounded-full bg-[#992621] text-white">
                <ShieldCheck size={14} />
              </span>
              <h1 className="text-[15px] font-black font-['Cairo',sans-serif] leading-tight">
                عقد صيانة دورية لأنظمة السلامة والوقاية من الحريق
              </h1>
            </div>
            <p className="text-[10px] text-slate-600 font-bold mt-0.5">
              معتمد لدى المديرية العامة للدفاع المدني بالمملكة العربية السعودية لمتطلبات منصة سلامة والتراخيص البلدية
            </p>
          </div>

          {/* Integrated Metadata Row */}
          <div className="flex items-center justify-between pt-1.5 px-1 text-[10px]">
            {/* Contract Number */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">رقم العقد:</span>
              <span className="font-mono font-black text-[#992621] text-[11px] bg-white border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                {contractNumber}
              </span>
            </div>

            {/* Contract Date */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">تاريخ العقد:</span>
              <span className="font-semibold text-slate-800 font-mono">{contractDate} م</span>
              {contractHijriDate && (
                <span className="text-slate-500 mr-1 font-sans">({contractHijriDate})</span>
              )}
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">مدة السريان:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9.5px]">
                سنة كاملة (زيارة كل 6 أشهر)
              </span>
            </div>

            {/* QR Code */}
            {options.showQrCode && (
              <div className="flex items-center gap-1 shrink-0">
                <ContractQrCode
                  contractNumber={contractNumber}
                  clientName={clientName}
                  date={contractDate}
                  size={36}
                />
              </div>
            )}
          </div>
        </div>

        {/* Contract Parties Section */}
        <div className="grid grid-cols-2 gap-2 mt-0.5">
          {/* First Party (Oriket) */}
          <div className="border border-slate-200 rounded-md p-2 bg-slate-50/70">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
              <span className="font-extrabold text-[#992621] text-[11px] flex items-center gap-1">
                <Building2 size={12} className="text-[#992621]" />
                الطرف الأول (الشركة المنفذة):
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                معتمدة دفاع مدني
              </span>
            </div>
            <div className="space-y-0.5 text-[10px] text-slate-700">
              <p className="font-bold text-slate-900">{COMPANY_DETAILS.nameAr}</p>
              <p>
                <span className="text-slate-500">الرقم الموحد / السجل:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{COMPANY_DETAILS.unifiedNumber}</span>
              </p>
              <p>
                <span className="text-slate-500">العنوان:</span>{' '}
                <span>{COMPANY_DETAILS.addressAr}</span>
              </p>
              <p>
                <span className="text-slate-500">الهاتف:</span>{' '}
                <span className="font-mono">{COMPANY_DETAILS.phone1} - {COMPANY_DETAILS.phone2}</span>
              </p>
            </div>
          </div>

          {/* Second Party (Client) */}
          <div className="border border-amber-200 rounded-md p-2 bg-amber-50/30">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1 mb-1">
              <span className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1">
                <Building2 size={12} className="text-amber-800" />
                الطرف الثاني (العميل / المنشأة):
              </span>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-100/60 px-1 rounded">
                المستفيد من الخدمة
              </span>
            </div>
            <div className="space-y-0.5 text-[10px] text-slate-700">
              <p className="font-bold text-slate-900">
                {clientName || 'اسم العميل / المؤسسة'} {facilityName ? `(${facilityName})` : ''}
              </p>
              <p className="flex justify-between">
                <span>
                  <span className="text-slate-500">السجل / الهوية:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{commercialRegOrId || '—'}</span>
                </span>
                <span>
                  <span className="text-slate-500">النشاط:</span>{' '}
                  <span className="font-semibold text-slate-800">{activityType || 'نشاط تجاري'}</span>
                  {buildingFloors && (
                    <span className="text-[#992621] font-bold mr-1 text-[9.5px]">({buildingFloors})</span>
                  )}
                </span>
              </p>
              <p>
                <span className="text-slate-500">الموقع:</span>{' '}
                <span>{[city, district, street].filter(Boolean).join(' - ') || 'خميس مشيط'}</span>
              </p>
              <p>
                <span className="text-slate-500">الجوال:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{clientPhone || '—'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contract Duration & Financial Value */}
        <div className="flex items-center justify-between border border-slate-200 rounded-md p-1.5 px-3 bg-white mt-1 text-[10.5px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar size={13} className="text-[#992621]" />
              <span>فترة سريان العقد:</span>
              <span className="font-mono font-normal text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                من {startDate || contractDate} م
              </span>
              <span className="text-slate-400">إلى</span>
              <span className="font-mono font-normal text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {endDate || contractDate} م
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold">قيمة العقد:</span>
            {options.showFinancialAmount !== false && totalAmount && Number(totalAmount) > 0 ? (
              <>
                <span className="font-mono font-black text-[12.5px] text-[#992621] bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                  {Number(totalAmount).toLocaleString('ar-SA')} ر.س
                </span>
                <span className="text-[9.5px] text-slate-500 font-medium">
                  ({isVatIncluded ? 'شامل ض.ق.م' : 'غير شامل الضريبة'})
                </span>
              </>
            ) : (
              <span className="text-slate-700 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                حسب الاتفاق ومحضر الفحص الفني
              </span>
            )}
          </div>
        </div>

        {/* Preamble / المقدمة والتمهيد */}
        <div
          className="bg-red-50/40 border border-[#992621]/20 rounded-md p-2 px-2.5 text-[10px] text-justify leading-relaxed text-slate-800"
          style={{ textAlign: 'justify', textJustify: 'inter-word' }}
        >
          <strong className="text-[#992621] font-black ml-1">المقدمة:</strong>
          حيث أن الطرف الثاني يرغب في عمل صيانة دورية لنظام الإطفاء اليدوي ونظام الإنذار الواقع في{' '}
          <strong className="text-slate-900 font-bold">
            {[city, district, street].filter(Boolean).join(' - ') || 'الموقع الموضح أعلاه'}
          </strong>{' '}
          وأبدى الطرف الأول استعداده للقيام بهذا العمل بصفته جهة متخصصة في توريد وتركيب وصيانة جميع أنظمة الوقاية من الحريق ومعتمدة من الإدارة العامة للسلامة بالمديرية العامة للدفاع المدني بمنطقة عسير.
          <div className="font-extrabold text-[#992621] mt-0.5">وقد تم الاتفاق بين الطرفين على الآتي:-</div>
        </div>

        {/* Contract Clauses - Each clause on its own line with enlarged font to fill page naturally */}
        <div className="border border-slate-200 rounded-md p-2 px-2.5 bg-white w-full">
          <div className="space-y-[2.2px] w-full text-[9.3px]">
            {activeClauses.map((clause, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-800 text-justify w-full leading-[1.38]">
                <span className="font-black text-[#992621] shrink-0 font-mono text-[9.5px] min-w-[20px]">
                  {idx + 1}-
                </span>
                <span className="flex-1 text-slate-800 font-medium">
                  {clause.replace(/^\d+[-–.]\s*/, '')}
                </span>
              </div>
            ))}
          </div>

          {/* Closing Duaa */}
          <div className="text-center font-bold text-[#992621] text-[10px] mt-1.5 pt-1 border-t border-slate-100">
            والله ولي التوفيق ،،،،
          </div>
        </div>

        {/* Signatures & Seal Section - Directly under clauses without empty gap */}
        <div className="border-t-2 border-slate-300 pt-2 pb-1 mt-1.5">
          <div className="grid grid-cols-2 gap-6 items-end relative">
            {/* First Party Signature & Stamp (Oriket) */}
            <div className="text-center relative">
              <p className="font-extrabold text-[#992621] text-[11px] mb-0.5">
                الطرف الأول (شركة أوريكيت للمقاولات العامة)
              </p>
              <p className="text-[9.5px] text-slate-600 font-semibold mb-5">
                المدير العام / المفوض بالتوقيع
              </p>

              {/* Digital Stamp Overlay */}
              {options.showStamp && (
                <div className="absolute left-1/2 -top-2 transform -translate-x-1/2 z-20 pointer-events-none">
                  <CompanyStamp size={105} rotation={-5} />
                </div>
              )}

              {/* Signature Line */}
              <div className="mt-6 border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 flex justify-center">
                {options.showSignature && (
                  <span className="font-serif italic text-blue-900 font-black text-sm tracking-wider">
                    Orekit Gen. Cont.
                  </span>
                )}
              </div>
              <p className="text-[8.5px] text-slate-500 mt-0.5">التوقيع والختم الرسمي المعتمد</p>
            </div>

            {/* Second Party Signature & Seal (Client) */}
            <div className="text-center">
              <p className="font-extrabold text-amber-950 text-[11px] mb-0.5">
                الطرف الثاني (العميل / المفوض عن المنشأة)
              </p>
              <p className="text-[9.5px] text-slate-700 font-bold mb-5">
                الاسم: {clientName || '...........................................'}
              </p>

              <div className="mt-6 border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1"></div>
              <p className="text-[8.5px] text-slate-500 mt-0.5">التوقيع وختم المنشأة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Either Digital Letterhead Footer or Empty Spacing for Physical Paper */}
      <div className="relative z-10 shrink-0">
        {options.showLetterhead && !options.customLetterheadImage ? (
          <LetterheadFooter />
        ) : (
          // Spacing for pre-printed letterhead paper
          <div className="h-[22mm] w-full" />
        )}
      </div>
    </div>
  );
};
