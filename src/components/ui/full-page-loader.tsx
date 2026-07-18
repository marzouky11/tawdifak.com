import { Loader2 } from 'lucide-react';

/**
 * A full-screen loading indicator that is always centered exactly in the
 * middle of the viewport (horizontally and vertically), regardless of the
 * page's scroll position or surrounding layout.
 *
 * It combines `fixed inset-0` (covers the real browser viewport, on top of
 * the header/footer) with `min-h-screen` on an inner wrapper (guarantees a
 * large, in-flow empty area even in contexts where a fixed overlay might be
 * constrained, e.g. inside a Suspense boundary during the very first paint).
 * This keeps the loading screen consistently big everywhere it's used
 * (login, signup, profile, edit profile, ...).
 */
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
