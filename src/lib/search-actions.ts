'use server';

/**
 * Server-side search (Server Actions).
 *
 * Before: every search typed by a visitor downloaded the latest 200 documents
 * straight from Firestore in the visitor's browser (200 reads per search, never
 * cached). With thousands of visitors a day this alone could exhaust the
 * Firestore quota.
 *
 * Now: the server keeps one cached "search pool" per collection (the most recent
 * SEARCH_POOL_SIZE documents). The pool is refreshed at most every 30 minutes, or
 * immediately when an ad is added/edited (same cache tags already used by
 * revalidateAll()). Every search runs Fuse.js on that cached pool, so a search
 * costs 0 Firestore reads, and results are paginated with a simple offset.
 */

import { unstable_cache } from 'next/cache';
import Fuse from 'fuse.js';
import { getJobOffers, getWorkers, getCompetitions, getImmigrationPosts } from './data';
import type { Job, Competition, ImmigrationPost } from './types';

const SEARCH_POOL_SIZE = 300;
const PAGE_SIZE = 16;
const MAX_QUERY_LENGTH = 100;
const POOL_REVALIDATE_SECONDS = 1800;

export interface SearchResult<T> {
  data: T[];
  hasMore: boolean;
}

interface SimpleSearchParams {
  q: string;
  offset?: number;
}


// Keep each cached pool small (the Vercel data cache has a ~2 MB limit per entry):
// cards only need short fields, so long texts are trimmed and nested sections dropped.
function slim<T extends object>(items: T[]): T[] {
  return items.map(item => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === 'extraSections' || key === 'extraLinks') continue;
      if (typeof value === 'string' && /url$/i.test(key)) {
        // Never cut links/images; only drop huge inline (base64) images.
        out[key] = value.startsWith('data:') ? null : value;
      } else if (typeof value === 'string') {
        out[key] = value.slice(0, key === 'description' ? 800 : 300);
      } else {
        out[key] = value;
      }
    }
    return out as T;
  });
}

const getJobsPool = unstable_cache(
  async () => slim((await getJobOffers({ limit: SEARCH_POOL_SIZE, throwOnError: true })).data),
  ['search-pool-jobs'],
  { tags: ['jobs-list'], revalidate: POOL_REVALIDATE_SECONDS }
);

const getWorkersPool = unstable_cache(
  async () => slim((await getWorkers({ limit: SEARCH_POOL_SIZE, throwOnError: true })).data),
  ['search-pool-workers'],
  { tags: ['workers-list'], revalidate: POOL_REVALIDATE_SECONDS }
);

const getCompetitionsPool = unstable_cache(
  async () => slim((await getCompetitions({ limit: SEARCH_POOL_SIZE, throwOnError: true })).data),
  ['search-pool-competitions'],
  { tags: ['competitions-list'], revalidate: POOL_REVALIDATE_SECONDS }
);

const getImmigrationPool = unstable_cache(
  async () => slim((await getImmigrationPosts({ limit: SEARCH_POOL_SIZE, throwOnError: true })).data),
  ['search-pool-immigration'],
  { tags: ['immigration-list'], revalidate: POOL_REVALIDATE_SECONDS }
);

function cleanQuery(q: unknown): string {
  return typeof q === 'string' ? q.trim().slice(0, MAX_QUERY_LENGTH) : '';
}

function cleanOffset(offset: unknown): number {
  const n = typeof offset === 'number' && Number.isFinite(offset) ? Math.floor(offset) : 0;
  return Math.min(Math.max(n, 0), SEARCH_POOL_SIZE);
}

function paginate<T>(items: T[], offset: number): SearchResult<T> {
  const page = items.slice(offset, offset + PAGE_SIZE);
  return { data: page, hasMore: offset + PAGE_SIZE < items.length };
}

function searchJobLike(pool: Job[], params: SimpleSearchParams, keys: string[]): SearchResult<Job> {
  const q = cleanQuery(params.q);
  let items = pool;
  if (q) {
    const fuse = new Fuse(items, { keys, includeScore: true, threshold: 0.4 });
    items = fuse.search(q).map(result => result.item);
  }
  return paginate(items, cleanOffset(params.offset));
}

export async function searchJobs(params: SimpleSearchParams): Promise<SearchResult<Job>> {
  try {
    const pool = await getJobsPool();
    return searchJobLike(pool, params, ['title', 'description', 'categoryName', 'country', 'city', 'companyName']);
  } catch (error) {
    console.error('searchJobs failed:', error);
    return { data: [], hasMore: false };
  }
}

export async function searchWorkers(params: SimpleSearchParams): Promise<SearchResult<Job>> {
  try {
    const pool = await getWorkersPool();
    return searchJobLike(pool, params, ['title', 'description', 'categoryName', 'country', 'city']);
  } catch (error) {
    console.error('searchWorkers failed:', error);
    return { data: [], hasMore: false };
  }
}

export async function searchCompetitions(params: SimpleSearchParams): Promise<SearchResult<Competition>> {
  try {
    const q = cleanQuery(params.q);
    let items = await getCompetitionsPool();
    if (q) {
      const fuse = new Fuse(items, {
        keys: ['title', 'organizer', 'description', 'location', 'competitionType'],
        includeScore: true,
        threshold: 0.4,
      });
      items = fuse.search(q).map(result => result.item);
    }
    return paginate(items, cleanOffset(params.offset));
  } catch (error) {
    console.error('searchCompetitions failed:', error);
    return { data: [], hasMore: false };
  }
}

export async function searchImmigration(params: SimpleSearchParams): Promise<SearchResult<ImmigrationPost>> {
  try {
    const q = cleanQuery(params.q);
    let items = await getImmigrationPool();
    if (q) {
      const fuse = new Fuse(items, {
        keys: ['title', 'targetCountry', 'city', 'description', 'targetAudience', 'programType'],
        includeScore: true,
        threshold: 0.4,
      });
      items = fuse.search(q).map(result => result.item);
    }
    return paginate(items, cleanOffset(params.offset));
  } catch (error) {
    console.error('searchImmigration failed:', error);
    return { data: [], hasMore: false };
  }
}
