/**
 * Vercel Edge Middleware
 * Rewrites OG meta tags based on hostname
 * - app.kanjiname.jp → App OG tags
 * - kanjiname.jp → Store partner landing OG tags (default in index.html)
 */

export const config = {
  matcher: '/',
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const hostname = request.headers.get('host') || '';

  // Only rewrite for app.kanjiname.jp
  if (!hostname.startsWith('app.')) {
    return;
  }

  // Fetch the original response
  const response = await fetch(request);
  const html = await response.text();

  // Replace OG tags for app subdomain
  const appTitle = 'Your Kanji Name - あなただけの漢字名';
  const appDescription = 'あなたの名前を漢字で表現。AIが選んだ漢字にプロの書道家が魂を込めて書き上げる、世界にひとつだけの作品。';
  const appOgImage = 'https://app.kanjiname.jp/images/icons/og-image.png?v=20260210';

  const rewritten = html
    .replace(/<title>[^<]*<\/title>/, `<title>${appTitle}</title>`)
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${appTitle}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${appDescription}"`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="https://app.kanjiname.jp/"`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${appOgImage}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="Your Kanji Name - Your Unique Kanji Name"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="Express your name in kanji. AI selects the perfect characters, then a professional calligrapher brings them to life."`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"/,
      `<meta name="twitter:image" content="${appOgImage}"`
    )
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${appDescription}"`
    );

  return new Response(rewritten, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
