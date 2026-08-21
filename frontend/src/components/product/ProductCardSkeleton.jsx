import React from 'react';

// Shown in place of ProductCard while a listing is loading — a shimmering
// outline of the real card layout reads as far more "designed" than a
// single spinner, and avoids the page jumping around once data arrives.
export default function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="skeleton h-2.5 w-16 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-2/3 rounded-full" />
        <div className="skeleton mt-1 h-4 w-20 rounded-full" />
        <div className="skeleton mt-2 h-8 w-full rounded-full" />
      </div>
    </div>
  );
}
