import React from 'react';

function BrandMark({ compact = false }) {
  return (
    <span className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none" role="img">
        <path d="M8 25.5 24 9l16 16.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 24v13.5h24V24" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="17" cy="20" r="3.25" fill="currentColor" />
        <circle cx="31" cy="20" r="3.25" fill="currentColor" />
        <path d="M13.5 31.5c1.2-3.5 5.7-4.5 8.1-1.4M26.4 30.1c2.4-3.1 6.9-2.1 8.1 1.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20 38h8M24 34.5V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default BrandMark;
