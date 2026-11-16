'use client';

import { Suspense, useEffect, useState } from 'react';
import { CompetitionCard } from '@/components/competition-card';
import { CompetitionFilters } from '@/components/competition-filters';
import type { Competition, FirestoreCursor } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getCompetitions } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { searchCompetitions } from '@/lib/search-actions';
import { mergeUniqueById } from '@/lib/utils';

const ITEMS_PER_PAGE = 16;

function CompetitionFiltersSkeleton() {
  return <div className="h-14 bg-muted rounded-xl w-full animate-pulse" />;
}

export function PageContent({ initialCompetitions = [] }: { initialCompetitions?: Competition[] }) {
  const searchParams = useSearchParams();
  
  // Search links must not flash the full list first.
  const hasUrlFilters = !!searchParams.get('q');
  const [competitions, setCompetitions] = useState<Competition[]>(hasUrlFilters ? [] : initialCompetitions);
  const [lastDoc, setLastDoc] = useState<FirestoreCursor>(null);
  
  const [loading, setLoading] = useState(hasUrlFilters || initialCompetitions.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const q = searchParams.get('q');

  useEffect(() => {
    const isInitialState = !q && initialCompetitions.length > 0;

    if (isInitialState) {
        setCompetitions(initialCompetitions);
        setLastDoc(null);
        setLoading(false);
        setHasMore(initialCompetitions.length >= ITEMS_PER_PAGE);
        return;
    }

    setCompetitions([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    fetchCompetitions(null, true);
  }, [q, initialCompetitions]);

  const fetchCompetitions = async (cursor: FirestoreCursor, isReset: boolean) => {
    try {
      // Text search runs on the server against a cached pool (0 Firestore reads per search).
      const { data: newComps, lastDoc: nextCursor, more } = q
        ? await searchCompetitions({ q, offset: isReset ? 0 : competitions.length })
            .then(r => ({ data: r.data, lastDoc: null as FirestoreCursor, more: r.hasMore }))
        : await getCompetitions({ limit: ITEMS_PER_PAGE, lastDoc: cursor })
            .then(r => ({ data: r.data, lastDoc: r.lastDoc, more: r.data.length >= ITEMS_PER_PAGE }));

      if (isReset) {
        setCompetitions(newComps);
      } else {
        setCompetitions(prev => mergeUniqueById(prev, newComps));
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

    if (!cursorToUse && competitions.length > 0) {
      const lastComp = competitions[competitions.length - 1];
      if (lastComp.createdAtISO) {
         cursorToUse = Timestamp.fromDate(new Date(lastComp.createdAtISO));
      }
    }

    fetchCompetitions(cursorToUse, false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm md:top-20">
        <div className="container py-3">
          <Suspense fallback={<CompetitionFiltersSkeleton />}>
            <CompetitionFilters />
          </Suspense>
        </div>
      </div>

      <div className="container pt-3 pb-12">
        <div className="flex justify-center">
        </div>
        {loading && competitions.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : competitions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {competitions.map((comp) => <CompetitionCard key={comp.id} competition={comp} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-8 space-y-8">

                <Button onClick={loadMore} disabled={loadingMore} size="lg" variant="outline" className="active:scale-95 transition-transform">
                  {loadingMore ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    'تحميل المزيد'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-10">لا توجد مباريات تطابق بحثك.</p>
        )}
      </div>
    </>
  );
}
