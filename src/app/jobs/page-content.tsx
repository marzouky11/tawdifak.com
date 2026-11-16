'use client';

import { Suspense, useEffect, useState } from 'react';
import { JobCard } from '@/components/job-card';
import { JobFilters } from '@/components/job-filters';
import type { FirestoreCursor, Job } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getJobOffers } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { searchJobs } from '@/lib/search-actions';
import { mergeUniqueById } from '@/lib/utils';

const ITEMS_PER_PAGE = 16;

function JobFiltersSkeleton() {
  return <div className="h-14 bg-muted rounded-lg w-full animate-pulse" />;
}

export function PageContent({ initialJobs = [] }: { initialJobs?: Job[] }) {
  const searchParams = useSearchParams();
  
  // Search links must not flash the full list first.
  const hasUrlFilters = !!searchParams.get('q');
  const [jobs, setJobs] = useState<Job[]>(hasUrlFilters ? [] : initialJobs);
  const [lastDoc, setLastDoc] = useState<FirestoreCursor>(null);
  
  const [loading, setLoading] = useState(hasUrlFilters || initialJobs.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const q = searchParams.get('q');

  useEffect(() => {
    const isInitialState = !q && initialJobs.length > 0;
    
    if (isInitialState) {
      setJobs(initialJobs);
      setLastDoc(null);
      setLoading(false);
      setHasMore(initialJobs.length >= ITEMS_PER_PAGE);
      return;
    }

    setJobs([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    fetchAndSetJobs(null, true);
  }, [q, initialJobs]);

  const fetchAndSetJobs = async (cursor: FirestoreCursor, isReset: boolean) => {
    try {
      // Text search runs on the server against a cached pool (0 Firestore reads per search);
      // plain browsing keeps using cursor pagination (16 docs per page).
      const { data: newJobs, lastDoc: nextCursor, more } = q
        ? await searchJobs({ q, offset: isReset ? 0 : jobs.length }).then(r => ({ data: r.data, lastDoc: null as FirestoreCursor, more: r.hasMore }))
        : await getJobOffers({ limit: ITEMS_PER_PAGE, lastDoc: cursor }).then(r => ({ data: r.data, lastDoc: r.lastDoc, more: r.data.length >= ITEMS_PER_PAGE }));

      if (isReset) {
        setJobs(newJobs);
      } else {
        setJobs(prev => mergeUniqueById(prev, newJobs));
      }

      setLastDoc(nextCursor);

      setHasMore(more);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    setLoadingMore(true);

    let cursorToUse = lastDoc;

    if (!cursorToUse && jobs.length > 0) {
      const lastJob = jobs[jobs.length - 1];
      if (lastJob.createdAtISO) {
        cursorToUse = Timestamp.fromDate(new Date(lastJob.createdAtISO));
      }
    }

    fetchAndSetJobs(cursorToUse, false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm md:top-20">
        <div className="container py-3">
          <Suspense fallback={<JobFiltersSkeleton />}>
            <JobFilters />
          </Suspense>
        </div>
      </div>

      <div className="container pt-3 pb-12">
        <div className="flex justify-center">
        </div>
        {loading && jobs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8 space-y-8">
  
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="lg"
                  variant="outline"
                  className="active:scale-95 transition-transform"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : 'تحميل المزيد'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-10">
            لا توجد عروض عمل تطابق بحثك.
          </p>
        )}
      </div>
    </>
  );
}
