'use client';

import { useEffect, useState } from 'react';
import { ImmigrationCard } from '@/components/immigration-card';
import { ImmigrationFilters } from '@/components/immigration-filters';
import type { ImmigrationPost, FirestoreCursor } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getImmigrationPosts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { searchImmigration } from '@/lib/search-actions';
import { mergeUniqueById } from '@/lib/utils';

const ITEMS_PER_PAGE = 16;

export function PageContent({ initialPosts = [] }: { initialPosts?: ImmigrationPost[] }) {
  const searchParams = useSearchParams();
  
  // Search links must not flash the full list first.
  const hasUrlFilters = !!searchParams.get('q');
  const [posts, setPosts] = useState<ImmigrationPost[]>(hasUrlFilters ? [] : initialPosts);
  const [lastDoc, setLastDoc] = useState<FirestoreCursor>(null);
  
  const [loading, setLoading] = useState(hasUrlFilters || initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const q = searchParams.get('q');

  useEffect(() => {
    const isInitialState = !q && initialPosts.length > 0;

    if (isInitialState) {
        setPosts(initialPosts);
        setLastDoc(null);
        setLoading(false);
        setHasMore(initialPosts.length >= ITEMS_PER_PAGE);
        return;
    }

    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    fetchPosts(null, true);
  }, [q, initialPosts]);

  const fetchPosts = async (cursor: FirestoreCursor, isReset: boolean) => {
    try {
      // Text search runs on the server against a cached pool (0 Firestore reads per search).
      const { data: newPosts, lastDoc: nextCursor, more } = q
        ? await searchImmigration({ q, offset: isReset ? 0 : posts.length })
            .then(r => ({ data: r.data, lastDoc: null as FirestoreCursor, more: r.hasMore }))
        : await getImmigrationPosts({ limit: ITEMS_PER_PAGE, lastDoc: cursor })
            .then(r => ({ data: r.data, lastDoc: r.lastDoc, more: r.data.length >= ITEMS_PER_PAGE }));

      if (isReset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => mergeUniqueById(prev, newPosts));
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

    if (!cursorToUse && posts.length > 0) {
      const lastPost = posts[posts.length - 1];
      if (lastPost.createdAtISO) {
         cursorToUse = Timestamp.fromDate(new Date(lastPost.createdAtISO));
      }
    }

    fetchPosts(cursorToUse, false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm md:top-20">
        <div className="container py-3">
          <ImmigrationFilters />
        </div>
      </div>

      <div className="container pt-3 pb-12">
        <div className="flex justify-center">
        </div>
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {posts.map((post) => <ImmigrationCard key={post.id} post={post} />)}
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
          <p className="col-span-full text-center text-muted-foreground py-10">لا توجد فرص هجرة تطابق بحثك.</p>
        )}
      </div>
    </>
  );
}
