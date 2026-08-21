import React from 'react';

const ITEMS = [
  { Icon: TruckIcon, label: 'Same-day delivery in Dhaka' },
  { Icon: ShieldIcon, label: '100% genuine medicine' },
  { Icon: UserCheckIcon, label: 'Licensed pharmacists' },
  { Icon: LockIcon, label: 'Secure checkout' },
  { Icon: PhoneIcon, label: '24/7 support' },
  { Icon: TagIcon, label: 'Best price guarantee' },
];

// A continuously scrolling strip of trust signals — purely decorative
// motion (no data behind it), rendered twice back-to-back so the CSS
// marquee animation loops seamlessly.
export default function TrustMarquee() {
  const row = (keyPrefix) => (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {ITEMS.map(({ Icon, label }) => (
        <div key={`${keyPrefix}-${label}`} className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon />
          </span>
          {label}
        </div>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-slate-100 bg-white py-4">
      <div className="animate-marquee flex w-max">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v9H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6" strokeLinecap="round" />
      <path d="m15 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5c0 8.5 6.5 15 15 15l3-4-6-2-2 2c-2.5-1-4.5-3-5.5-5.5l2-2-2-6-4 .5Z" strokeLinejoin="round" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12 12.5 4.5 4 5l-.5 8.5L11 21z" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
