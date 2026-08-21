import React from 'react';
import HeroBanner from '../components/home/HeroBanner';
import TrustMarquee from '../components/home/TrustMarquee';
import ActionCards from '../components/home/ActionCards';
import CategoryStrip from '../components/home/CategoryStrip';
import HowItWorks from '../components/home/HowItWorks';
import WhyChooseUs from '../components/home/WhyChooseUs';
import DoctorBanner from '../components/home/DoctorBanner';
import ProductRail from '../components/home/ProductRail';

export default function Home() {
  return (
    <div className="pb-16">
      <HeroBanner />
      <TrustMarquee />
      <ActionCards />
      <CategoryStrip />
      <HowItWorks />
      <ProductRail
        title="Best Sellers"
        params={{ isBestSeller: true, sort: 'best_selling' }}
        viewAllHref="/products?isBestSeller=true"
      />
      <WhyChooseUs />
      <DoctorBanner />
      <ProductRail
        title="Featured Products"
        params={{ isFeatured: true }}
        viewAllHref="/products?isFeatured=true"
      />
      <ProductRail title="New In" params={{ sort: 'newest' }} viewAllHref="/products?sort=newest" />
    </div>
  );
}
