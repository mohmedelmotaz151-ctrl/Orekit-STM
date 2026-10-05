import React from 'react';

export const CompanyStamp: React.FC<{ size?: number; className?: string; rotation?: number }> = ({
  size = 135,
  className = '',
  rotation = -5,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
      className={`relative inline-block select-none pointer-events-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="w-full h-full text-[#1b3168] drop-shadow-[0_1px_2px_rgba(27,49,104,0.18)]"
      >
        <defs>
          {/* Upper arc path for "شركة أوريكيت" */}
          <path
            id="stampTopArc"
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
          />

          {/* Lower arc path for "للمقاولات العامة" */}
          <path
            id="stampBottomArc"
            d="M 175 100 A 75 75 0 0 1 25 100"
            fill="none"
          />
        </defs>

        {/* Outer Circular Rim */}
        <circle
          cx="100"
          cy="100"
          r="93"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
        />

        {/* Inner Dotted / Decorative Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3.5 2"
        />

        {/* Inner Solid Border Ring */}
        <circle
          cx="100"
          cy="100"
          r="67"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        {/* Top Text: شركة أوريكيت */}
        <text
          fill="currentColor"
          fontSize="17.5"
          fontWeight="900"
          fontFamily="Cairo, sans-serif"
        >
          <textPath href="#stampTopArc" xlinkHref="#stampTopArc" startOffset="50%" textAnchor="middle">
            شركة أوريكيت
          </textPath>
        </text>

        {/* Bottom Text: للمقاولات العامة */}
        <text
          fill="currentColor"
          fontSize="16.5"
          fontWeight="900"
          fontFamily="Cairo, sans-serif"
        >
          <textPath href="#stampBottomArc" xlinkHref="#stampBottomArc" startOffset="50%" textAnchor="middle">
            للمقاولات العامة
          </textPath>
        </text>

        {/* Left & Right Decorative Asterisks / Stars as in original stamp */}
        <text
          x="21"
          y="105"
          fill="currentColor"
          fontSize="17"
          fontWeight="bold"
          textAnchor="middle"
        >
          ✶
        </text>
        <text
          x="179"
          y="105"
          fill="currentColor"
          fontSize="17"
          fontWeight="bold"
          textAnchor="middle"
        >
          ✶
        </text>

        {/* Center Box with rounded corners */}
        <rect
          x="44"
          y="74"
          width="112"
          height="52"
          rx="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        {/* Center Content: الرقم الموحد */}
        <text
          x="100"
          y="93"
          fill="currentColor"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Cairo, sans-serif"
        >
          الرقم الموحد
        </text>

        {/* Center Content: Number in Arabic Eastern digits ٧٠٥٤٨٧٥٥٧٥ matching the letterhead */}
        <text
          x="100"
          y="114"
          fill="currentColor"
          fontSize="17"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="0.08em"
          fontFamily="Cairo, sans-serif"
        >
          ٧٠٥٤٨٧٥٥٧٥
        </text>
      </svg>
    </div>
  );
};
