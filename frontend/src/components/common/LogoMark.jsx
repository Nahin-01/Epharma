import React from 'react';

// The brand mark — a two-tone capsule on a gradient tile. Used in the
// header, footer, and as the browser favicon (public/favicon.svg mirrors
// this markup so the tab icon matches exactly).
export default function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <clipPath id="logo-capsule">
          <rect x="6" y="15" width="28" height="10" rx="5" transform="rotate(-45 20 20)" />
        </clipPath>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#logo-bg)" />
      <g clipPath="url(#logo-capsule)">
        <rect x="4" y="13" width="16" height="14" fill="#fff7ed" />
        <rect x="20" y="13" width="16" height="14" fill="#f97316" />
      </g>
    </svg>
  );
}
