import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { COMPANY_DETAILS } from '../constants/defaultContract';

export const CornerBuildingLogo: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bronzeGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a3362d" />
          <stop offset="0.6" stopColor="#81241f" />
          <stop offset="1" stopColor="#4f1310" />
        </linearGradient>
      </defs>
      {/* Curved base sweep */}
      <path
        d="M 10 92 C 35 78, 70 78, 92 88"
        stroke="#81241f"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Stepped tiers with 3D bevels */}
      <path d="M 28 78 L 78 78 L 78 70 L 30 70 Z" fill="url(#bronzeGradient)" />
      <path d="M 78 78 L 86 72 L 86 64 L 78 70 Z" fill="#5c1714" />

      <path d="M 33 66 L 75 66 L 75 58 L 36 58 Z" fill="url(#bronzeGradient)" />
      <path d="M 75 66 L 83 60 L 83 52 L 75 58 Z" fill="#5c1714" />

      <path d="M 39 54 L 72 54 L 72 47 L 42 47 Z" fill="url(#bronzeGradient)" />
      <path d="M 72 54 L 79 48 L 79 41 L 72 47 Z" fill="#5c1714" />

      <path d="M 45 43 L 68 43 L 68 37 L 48 37 Z" fill="url(#bronzeGradient)" />
      <path d="M 68 43 L 74 38 L 74 32 L 68 37 Z" fill="#5c1714" />

      <path d="M 51 33 L 64 33 L 64 28 L 54 28 Z" fill="url(#bronzeGradient)" />
      <path d="M 64 33 L 70 29 L 70 24 L 64 28 Z" fill="#5c1714" />
    </svg>
  );
};

export const LetterheadFooter: React.FC = () => {
  return (
    <div className="w-full px-8 pb-3 pt-1 select-none relative">
      {/* Horizontal Divider Line */}
      <div className="w-full mb-2 h-[2px] bg-[#992621]"></div>

      <div className="flex items-center justify-between text-[11px] leading-tight text-slate-800">
        {/* Contact info: Phone & Email */}
        <div className="flex items-center gap-6" dir="ltr">
          {/* Phones */}
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800">
            <span className="p-1 rounded-full bg-[#992621]/10 text-[#992621]">
              <Phone size={11} className="stroke-[2.5]" />
            </span>
            <span>{COMPANY_DETAILS.phone1}</span>
            <span className="text-slate-400 font-normal">-</span>
            <span>{COMPANY_DETAILS.phone2}</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 font-sans">
            <span className="p-1 rounded-full bg-[#992621]/10 text-[#992621]">
              <Mail size={11} className="stroke-[2.5]" />
            </span>
            <span className="text-[10.5px]">{COMPANY_DETAILS.email}</span>
          </div>
        </div>

        {/* Physical Address: Bilingual */}
        <div className="text-right" dir="rtl">
          <p className="font-bold text-slate-800 text-[11.5px]">
            {COMPANY_DETAILS.addressAr}
          </p>
          <p className="text-[9.5px] text-slate-600 font-medium font-sans tracking-tight" dir="ltr">
            {COMPANY_DETAILS.addressEn}
          </p>
        </div>
      </div>

      {/* Decorative corner emblem on bottom-right edge */}
      <div className="absolute -bottom-2 -left-2 opacity-90 pointer-events-none">
        <CornerBuildingLogo size={58} />
      </div>
    </div>
  );
};
