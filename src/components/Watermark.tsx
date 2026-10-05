import React from 'react';
import { OrekitLogoIcon } from './LetterheadHeader';

export const LetterheadWatermark: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden z-0">
      <div className="opacity-[0.05] flex flex-col items-center justify-center transform -translate-y-2">
        {/* Large stylized building with dome watermark */}
        <OrekitLogoIcon size={310} />
        <span className="text-7xl font-black text-slate-800 mt-1 font-['Cairo',sans-serif]">
          أوريكيت
        </span>
        <span className="text-2xl font-extrabold text-slate-700 mt-0.5 font-['Cairo',sans-serif]">
          للمقاولات العامة
        </span>
      </div>
    </div>
  );
};

