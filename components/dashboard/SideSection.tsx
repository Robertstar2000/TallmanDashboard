'use client';

import { SiteDistributionChart } from '@/components/charts/SiteDistributionChart';
import { TopProductsCard } from '@/components/charts/TopProductsCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SideSectionProps {
  siteDistribution: any[];
  products: {
    online: any[];
    inside: any[];
    outside: any[];
  };
  onSiteDistributionUpdate: (data: any[]) => void;
  onProductsUpdate: (data: any) => void;
}

export function SideSection({ 
  siteDistribution, 
  products,
  onSiteDistributionUpdate,
  onProductsUpdate
}: SideSectionProps) {
  return (
    <div className="grid grid-rows-[1fr,1fr,auto] gap-1 h-full">
      <SiteDistributionChart 
        data={siteDistribution} 
        onUpdate={onSiteDistributionUpdate}
      />
      <TopProductsCard 
        products={products}
        onUpdate={onProductsUpdate}
      />
      <div className="flex justify-end p-2">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}