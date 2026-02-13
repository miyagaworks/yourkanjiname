/**
 * Vercel Edge Middleware
 * Rewrites app.kanjiname.jp root to app-index.html (with app-specific OG tags)
 */

export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const hostname = request.headers.get('host') || '';

  if (!hostname.startsWith('app.')) {
    return;
  }

  // Rewrite to app-index.html (won't re-trigger middleware since path differs from '/')
  const url = new URL('/app-index.html', request.url);
  return fetch(url);
}
