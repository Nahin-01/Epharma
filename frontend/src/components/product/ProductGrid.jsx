import React from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import EmptyState from '../common/EmptyState';

export default function ProductGrid({ products, loading, emptyTitle = 'No products found', skeletonCount = 8 }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!products || products.length === 0) {
    return <EmptyState title={emptyTitle} description="Try adjusting your filters or search terms." />;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product, i) => (
        <div key={product._id} className="animate-slide-up" style={{ animationDelay: `${(i % 8) * 40}ms` }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
