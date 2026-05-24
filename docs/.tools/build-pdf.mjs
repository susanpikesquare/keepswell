#!/usr/bin/env node
/**
 * docs/.tools/build-pdf.mjs
 * ─────────────────────────
 * Renders docs/USER_GUIDE.md into a brand-styled PDF at
 * docs/Keepswell-User-Guide.pdf, using:
 *
 *   - `marked` to convert Markdown → HTML (preserving the embedded HTML
 *     blocks the guide uses for callouts and tables)
 *   - a hand-written CSS template using Playfair Display + Inter from
 *     Google Fonts and the Keepswell brand palette
 *   - Google Chrome in `--headless --print-to-pdf` mode for rendering,
 *     which avoids a Puppeteer install and is reliably present on macOS
 *
 * Run from the repo root or anywhere — paths are resolved relative to
 * this file:
 *
 *   node docs/.tools/build-pdf.mjs
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const exec = promisify(execFile);

// Use createRequire so we can resolve a pinned local copy of `marked`
// without requiring the workspace to be an ESM project.
const require = createRequire(import.meta.url);

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, '..');
const SRC = resolve(DOCS, 'USER_GUIDE.md');
const OUT_HTML = resolve(DOCS, '.tools/.tmp-user-guide.html');
const OUT_PDF = resolve(DOCS, 'Keepswell-User-Guide.pdf');

const BRAND = {
  cream: '#F6F1EA',
  sand: '#DCCCB7',
  coral: '#D86F5C',
  coralDeep: '#c2604f',
  sage: '#7A8A74',
  slate: '#3C4858',
  charcoal: '#1F2328',
};

const CSS = `
  @page {
    size: Letter;
    margin: 0.75in 0.7in 0.85in 0.7in;
    @bottom-center {
      content: "Keepswell User Guide  ·  Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: ${BRAND.slate};
      opacity: 0.7;
    }
  }

  html, body {
    margin: 0;
    padding: 0;
    background: ${BRAND.cream};
    color: ${BRAND.charcoal};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Container */
  main {
    padding: 0 0.1in;
  }

  /* Headings — serif feel */
  h1, h2, h3, h4 {
    font-family: 'Playfair Display', Georgia, serif;
    color: ${BRAND.charcoal};
    line-height: 1.2;
  }
  h1 {
    font-size: 28pt;
    margin: 0 0 0.2in 0;
    font-weight: 600;
  }
  h2 {
    font-size: 20pt;
    margin: 0.3in 0 0.12in 0;
    font-weight: 600;
    border-bottom: 1px solid ${BRAND.sand};
    padding-bottom: 0.06in;
    page-break-after: avoid;
  }
  /* Centered ✦ section titles use a div[align=center] wrapper. Strip
     the underline from those and add a light coral accent above. */
  div[align="center"] h2 {
    border-bottom: none;
    padding-bottom: 0;
    text-align: center;
    color: ${BRAND.charcoal};
  }
  div[align="center"] h2::before {
    content: "";
    display: block;
    width: 50px;
    height: 2px;
    background: ${BRAND.coral};
    margin: 0.18in auto 0.1in auto;
    border-radius: 2px;
  }

  h3 {
    font-size: 14pt;
    margin: 0.18in 0 0.06in 0;
    color: ${BRAND.coral};
    font-weight: 600;
  }
  h4 {
    font-size: 12pt;
    margin: 0.15in 0 0.05in 0;
    color: ${BRAND.slate};
    font-weight: 600;
  }

  p {
    margin: 0 0 0.1in 0;
  }
  em { color: ${BRAND.coralDeep}; font-style: italic; }
  strong { color: ${BRAND.charcoal}; font-weight: 600; }

  a {
    color: ${BRAND.coral};
    text-decoration: none;
    border-bottom: 1px solid ${BRAND.coral}55;
  }
  a:hover { color: ${BRAND.coralDeep}; }

  /* Tables — used heavily in the guide */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.1in 0 0.18in 0;
    page-break-inside: avoid;
  }
  th, td {
    text-align: left;
    padding: 0.09in 0.12in;
    vertical-align: top;
    border-bottom: 1px solid ${BRAND.sand};
    font-size: 10.5pt;
  }
  th {
    background: ${BRAND.cream};
    color: ${BRAND.slate};
    font-weight: 600;
    border-bottom: 2px solid ${BRAND.sand};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 9pt;
  }
  /* The 'What's inside' two-column TOC table */
  table:first-of-type, table[role="navigation"] {
    border: none;
  }

  /* Numbered step blocks (HTML tables in the source) */
  table td h3 {
    font-family: 'Playfair Display', serif;
    margin: 0;
    color: ${BRAND.coral};
    font-size: 18pt;
    text-align: center;
  }

  ul, ol {
    margin: 0.06in 0 0.16in 0.2in;
    padding-left: 0.1in;
  }
  li { margin: 0.04in 0; }
  ul li::marker { color: ${BRAND.sage}; }
  ol li::marker { color: ${BRAND.coral}; font-weight: 600; }

  /* Blockquote callouts */
  blockquote {
    margin: 0.15in 0;
    padding: 0.14in 0.18in;
    background: #fff;
    border-left: 4px solid ${BRAND.coral};
    border-radius: 6px;
    color: ${BRAND.slate};
    page-break-inside: avoid;
    box-shadow: 0 1px 2px rgba(31, 35, 40, 0.04);
  }
  blockquote p { margin: 0; }
  blockquote em { color: ${BRAND.slate}; }

  hr {
    border: none;
    height: 1px;
    background: ${BRAND.sand};
    margin: 0.3in 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
  }
  div[align="center"] img {
    display: block;
    margin: 0 auto;
  }

  /* The opening pull-quote (a blockquote inside a centered div) */
  div[align="center"] > blockquote {
    background: transparent;
    border: none;
    box-shadow: none;
    text-align: center;
    font-family: 'Playfair Display', serif;
    font-size: 14pt;
    color: ${BRAND.slate};
    padding: 0.1in 0.4in;
    max-width: 5.5in;
    margin: 0.15in auto;
  }
  div[align="center"] > blockquote p { line-height: 1.5; }

  /* Details (FAQ) — flatten for print */
  details {
    margin: 0.06in 0;
    padding: 0.1in 0.14in;
    background: #fff;
    border: 1px solid ${BRAND.sand};
    border-radius: 8px;
    page-break-inside: avoid;
  }
  details > summary {
    list-style: none;
    cursor: pointer;
    font-family: 'Playfair Display', serif;
    font-size: 12pt;
    color: ${BRAND.charcoal};
  }
  details > summary::-webkit-details-marker { display: none; }
  details[open] > summary { margin-bottom: 0.08in; }
  details > p, details > div { color: ${BRAND.slate}; }

  /* Helper: <sub> at the bottom of cover and footer */
  sub {
    font-size: 9pt;
    color: ${BRAND.slate};
    opacity: 0.75;
  }

  /* Cover */
  .cover {
    page-break-after: always;
    padding: 0.4in 0 0.2in 0;
    text-align: center;
  }
  .cover-spacer { height: 0.4in; }

  /* Avoid orphaning a heading at the bottom of a page */
  h1, h2, h3, h4 {
    break-after: avoid;
  }
`;

async function main() {
  // 1. Pull marked from frontend's node_modules (it ships with most
  //    React projects via react-markdown's transitive deps). Fall back
  //    to a quick install in a hidden vendor dir if not found.
  let marked;
  try {
    // Try the frontend project first — it almost certainly has marked
    // somewhere accessible.
    const candidates = [
      resolve(DOCS, '../frontend/node_modules/marked'),
      resolve(DOCS, '../mobile/node_modules/marked'),
      resolve(DOCS, '../node_modules/marked'),
    ];
    for (const path of candidates) {
      try {
        await stat(path);
        marked = require(path);
        break;
      } catch {
        // try next
      }
    }
    if (!marked) throw new Error('marked not found in any workspace');
  } catch {
    // Vendor install. Keep the dir hidden so it doesn't pollute git.
    const vendor = resolve(HERE, 'vendor');
    await mkdir(vendor, { recursive: true });
    console.log('Installing marked into docs/.tools/vendor (one-time)…');
    await exec('npm', ['install', '--prefix', vendor, '--no-save', '--no-audit', '--no-fund', 'marked@12'], {
      stdio: 'inherit',
    });
    marked = require(resolve(vendor, 'node_modules/marked'));
  }

  const md = await readFile(SRC, 'utf8');

  // Configure marked: GFM tables, line breaks preserved, HTML passthrough on.
  const html = marked.parse(md, {
    gfm: true,
    breaks: false,
  });

  // Inline the brand fonts via Google Fonts (Chrome will fetch them at
  // print time; offline runs degrade to the system serif/sans).
  const doc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Keepswell User Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" />
  <base href="file://${DOCS}/" />
  <style>${CSS}</style>
</head>
<body>
  <main>
${html}
  </main>
</body>
</html>`;

  await writeFile(OUT_HTML, doc, 'utf8');
  console.log(`HTML written:  ${OUT_HTML}`);

  // 2. Find Chrome and run headless print-to-pdf.
  const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    await stat(CHROME);
  } catch {
    throw new Error(`Google Chrome not found at: ${CHROME}\nInstall Chrome or update the path in build-pdf.mjs`);
  }

  // Chrome accepts file:// URLs. Use a temp user-data-dir to avoid
  // touching the user's real Chrome profile.
  const userDataDir = resolve(HERE, '.tmp-chrome-profile');
  await mkdir(userDataDir, { recursive: true });

  console.log('Rendering PDF with headless Chrome…');
  await exec(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--virtual-time-budget=10000',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${OUT_PDF}`,
    '--no-pdf-header-footer',
    `file://${OUT_HTML}`,
  ]);

  console.log(`PDF written:   ${OUT_PDF}`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
