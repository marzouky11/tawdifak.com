import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { Suspense } from 'react';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';
import { DesktopPageHeader } from '@/components/layout/desktop-page-header';
import { PageContent } from './page-content';
import { getCachedInitialWorkers } from '@/lib/data';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'باحثون عن عمل - تصفح ملفات المرشحين',
  description: 'هل تبحث عن موظفين أو عمال؟ استعرض ملفات الباحثين عن عمل في مختلف المجالات والمهن، وتواصل مع الكفاءات التي تحتاجها لمشروعك.',
  alternates: { canonical: '/workers' },
};

function WorkerListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-muted rounded-lg h-48 animate-pulse" />
      ))}
    </div>
  );
}

// Static + ISR: the page no longer reads searchParams on the server, so it is served from
// the CDN cache (also for links with ?fbclid=... from Facebook/Instagram). Filters and
// search are applied in the browser by PageContent.
export default async function WorkersPage() {
  const initialWorkers = await getCachedInitialWorkers();

  return (
    <>
      <MobilePageHeader title="باحثون عن عمل" sticky={false} className="mb-3">
        <Users className="h-5 w-5 text-primary" />
      </MobilePageHeader>
      <DesktopPageHeader
        icon={Users}
        title="باحثون عن عمل"
        titleAs="h1"
        className="pb-3"
        description="استعرض ملفات الباحثين عن عمل واعثر على الكفاءات التي تحتاجها."
      />
      <Suspense fallback={<div className="container"><WorkerListSkeleton/></div>}>
        <PageContent initialWorkers={initialWorkers} />
      </Suspense>
    </>
  );
}
