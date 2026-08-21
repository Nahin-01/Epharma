import React from 'react';

const GRADIENTS = [
  ['#2dd4bf', '#0d9488'],
  ['#fb923c', '#ea580c'],
  ['#5eead4', '#14b8a6'],
  ['#fdba74', '#f97316'],
  ['#134e4a', '#0f766e'],
  ['#9a3412', '#c2410c'],
];

// Deterministic (same product always gets the same look) so the same item
// doesn't flicker between colors across the grid, the detail page, and the
// cart. Shown only when a product has no real photo yet (product.images),
// so the storefront never looks broken or plain.
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function ProductImagePlaceholder({ seed, iconSize = 44, className = '' }) {
  const [from, to] = gradientFor(seed || 'product');
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="opacity-90">
        <rect
          x="2.5"
          y="8.5"
          width="19"
          height="7"
          rx="3.5"
          transform="rotate(-30 12 12)"
          fill="#ffffff"
          fillOpacity="0.35"
        />
        <path d="M6.6 15.9a4.9 4.9 0 1 1 6.93-6.93l1.5 1.5-6.93 6.93-1.5-1.5Z" fill="#ffffff" />
      </svg>
    </div>
  );
}
