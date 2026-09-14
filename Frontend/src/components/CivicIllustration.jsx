import React from 'react';

function CivicIllustration({ variant = 'community' }) {
  const isNetwork = variant === 'network';

  return (
    <div className={`civic-illustration civic-illustration--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 560 300" fill="none" role="presentation">
        <path d="M0 253c85-34 139-28 213-3 78 26 151 22 219-7 51-22 87-26 128-13v70H0v-47Z" fill="#d1fae5" />
        <path d="M0 269c98-25 162-18 237 3 71 20 130 14 204-13 52-19 83-17 119-4v45H0v-31Z" fill="#bbf7d0" opacity=".72" />

        <g className="civic-illustration__network">
          <path d="M110 128 242 82l118 54 106-32" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5 7" />
          <path d="M110 128 201 208l159-72 106 68" stroke="#0f766e" strokeWidth="2" strokeDasharray="5 7" />
          <circle cx="110" cy="128" r="8" fill="#f59e0b" />
          <circle cx="242" cy="82" r="8" fill="#0284c7" />
          <circle cx="360" cy="136" r="8" fill="#0f766e" />
          <circle cx="466" cy="104" r="8" fill="#166534" />
          <circle cx="201" cy="208" r="8" fill="#14b8a6" />
          <circle cx="466" cy="204" r="8" fill="#f59e0b" />
        </g>

        <g transform="translate(231 34)">
          <path d="M0 31 49 4l49 27v8H0v-8Z" fill="#0f766e" />
          <path d="M12 43h74v55H12z" fill="#ecfdf5" stroke="#0f766e" strokeWidth="3" />
          <path d="M4 99h90M5 43h88" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 48v45m25-45v45m25-45v45" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
          <path d="M49 4v-9" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
          <circle cx="49" cy="-12" r="5" fill="#f59e0b" />
        </g>

        <g transform="translate(55 150)">
          <circle cx="28" cy="18" r="14" fill="#f3c7a3" />
          <path d="M14 17c2-19 27-20 30 0-9-5-19-5-30 0Z" fill="#334155" />
          <path d="M7 83c1-32 7-50 21-50s22 18 23 50H7Z" fill="#0f766e" />
          <path d="m48 49 31-22" stroke="#f3c7a3" strokeWidth="8" strokeLinecap="round" />
          <path d="m81 27 14-5" stroke="#f3c7a3" strokeWidth="7" strokeLinecap="round" />
          <path d="M17 83v30m23-30v30" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          <circle cx="95" cy="22" r="13" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
          <path d="m89 22 4 4 8-9" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(389 153)">
          <circle cx="32" cy="15" r="14" fill="#b97852" />
          <path d="M18 14c0-18 26-22 31-3-10-2-19 0-31 3Z" fill="#1e293b" />
          <path d="M8 84c1-32 9-50 24-50s23 18 24 50H8Z" fill="#0284c7" />
          <path d="m14 50-28 17" stroke="#b97852" strokeWidth="8" strokeLinecap="round" />
          <path d="m-13 67-14-4" stroke="#b97852" strokeWidth="7" strokeLinecap="round" />
          <path d="M22 84v30m24-30v30" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          <path d="m55 42 22-18" stroke="#b97852" strokeWidth="8" strokeLinecap="round" />
          <path d="m75 25 13 3" stroke="#b97852" strokeWidth="7" strokeLinecap="round" />
          <path d="M78 9h20l-10 18H68L78 9Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
        </g>

        <g transform="translate(261 202)">
          <path d="M0 30h51" stroke="#166534" strokeWidth="4" strokeLinecap="round" />
          <path d="M25 30V3" stroke="#166534" strokeWidth="4" strokeLinecap="round" />
          <path d="M25 7c-18-7-20-22-20-22 13-2 22 7 20 22Zm2 1c18-7 20-22 20-22-13-2-22 7-20 22Z" fill="#16a34a" />
          <path d="M11 30c-5-15 0-23 14-27 14 4 19 12 14 27" fill="#86efac" opacity=".75" />
        </g>

        <g transform="translate(475 52)">
          <circle r="22" fill="#ecfdf5" stroke="#0f766e" strokeWidth="3" />
          <path d="m-10 1 7 7L11-8" stroke="#166534" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <div className="civic-illustration__caption">
        <span>{isNetwork ? 'Connected institutions, one public purpose' : 'Your voice helps move a community forward'}</span>
      </div>
    </div>
  );
}

export default CivicIllustration;
