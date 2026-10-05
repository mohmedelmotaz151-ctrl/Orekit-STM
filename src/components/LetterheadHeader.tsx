import React from 'react';
import { COMPANY_DETAILS } from '../constants/defaultContract';

export const OrekitLogoIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer arched dome framing the building */}
      <path
        d="M 22 96 C 22 42, 38 18, 60 18 C 82 18, 98 42, 98 96"
        stroke="#992621"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Curved ground sweep base */}
      <path
        d="M 12 104 C 42 90, 82 90, 108 100"
        stroke="#992621"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 5 Stepped Architectural building tiers / blocks */}
      {/* Tier 1 (bottom) */}
      <path d="M 32 86 L 86 86 L 86 76 L 34 76 Z" fill="#992621" />
      <path d="M 86 86 L 93 80 L 93 72 L 86 76 Z" fill="#751a16" />

      {/* Tier 2 */}
      <path d="M 37 72 L 82 72 L 82 63 L 40 63 Z" fill="#992621" />
      <path d="M 82 72 L 89 67 L 89 60 L 82 63 Z" fill="#751a16" />

      {/* Tier 3 */}
      <path d="M 43 59 L 78 59 L 78 51 L 46 51 Z" fill="#992621" />
      <path d="M 78 59 L 85 54 L 85 48 L 78 51 Z" fill="#751a16" />

      {/* Tier 4 */}
      <path d="M 49 47 L 74 47 L 74 40 L 52 40 Z" fill="#992621" />
      <path d="M 74 47 L 81 42 L 81 37 L 74 40 Z" fill="#751a16" />

      {/* Tier 5 (top) */}
      <path d="M 55 36 L 70 36 L 70 30 L 58 30 Z" fill="#992621" />
      <path d="M 70 36 L 76 32 L 76 27 L 70 30 Z" fill="#751a16" />
    </svg>
  );
};

export const LetterheadHeader: React.FC = () => {
  return (
    <div className="w-full pt-4 pb-2 px-8 select-none">
      {/* Header Grid: English (Left), Logo (Center), Arabic (Right) */}
      <div className="flex items-center justify-between">
        {/* Left: English text */}
        <div className="text-left" dir="ltr">
          <h2 className="text-[17px] font-black text-[#992621] uppercase leading-tight font-sans tracking-wide">
            ORKIT COMPANY
          </h2>
          <p className="text-[12px] font-bold text-slate-800 leading-tight">
            For General Contracting
          </p>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
            Unified No. <span className="font-mono font-bold text-slate-900">{COMPANY_DETAILS.unifiedNumber}</span>
          </p>
        </div>

        {/* Center: Orekit Brand Logo & Name */}
        <div className="flex flex-col items-center justify-center px-4">
          <OrekitLogoIcon size={56} />
          <div className="text-center mt-1">
            <span className="text-[21px] font-black text-[#992621] block font-['Cairo',sans-serif] leading-none">
              أوريكيت
            </span>
            <span className="text-[10.5px] font-black tracking-[0.25em] text-[#992621] block uppercase font-sans mt-0.5">
              — ORKIT —
            </span>
          </div>
        </div>

        {/* Right: Arabic text */}
        <div className="text-right" dir="rtl">
          <h2 className="text-[21px] font-black text-[#992621] leading-tight font-['Cairo',sans-serif]">
            شركة أوريكيت
          </h2>
          <p className="text-[15px] font-black text-[#992621] leading-tight font-['Cairo',sans-serif]">
            للمقاولات العامة
          </p>
          <p className="text-[11.5px] font-bold text-slate-800 mt-0.5">
            الرقم الموحد : <span className="font-sans font-bold">٧٠٥٤٨٧٥٥٧٥</span>
          </p>
        </div>
      </div>

      {/* Horizontal Divider Line matching letterhead */}
      <div className="w-full mt-2.5 h-[2px] bg-[#992621]"></div>
    </div>
  );
};
