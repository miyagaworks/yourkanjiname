/**
 * Generate app-index.html from index.html with app-specific OG tags
 * Run after frontend build: node scripts/generate-app-index.js
 */
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'index.html');
const outputPath = path.join(__dirname, '..', 'public', 'app-index.html');

let html = fs.readFileSync(inputPath, 'utf8');

const appTitle = 'Your Kanji Name - あなただけの漢字名';
const appDescription = 'あなたの名前を漢字で表現。AIが選んだ漢字にプロの書道家が魂を込めて書き上げる、世界にひとつだけの作品。';
const appOgImage = 'https://app.kanjiname.jp/images/icons/og-image.png?v=20260210';

html = html
  .replace(/<title>[^<]*<\/title>/, `<title>${appTitle}</title>`)
  .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${appDescription}"`)
  .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="https://app.kanjiname.jp/"`)
  .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${appTitle}"`)
  .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${appDescription}"`)
  .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${appOgImage}"`)
  .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="Your Kanji Name - Your Unique Kanji Name"`)
  .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="Express your name in kanji. AI selects the perfect characters, then a professional calligrapher brings them to life."`)
  .replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${appOgImage}"`);

fs.writeFileSync(outputPath, html);
console.log('Generated app-index.html');
