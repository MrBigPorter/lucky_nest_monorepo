#!/usr/bin/env node
/**
 * Build script for @repo/ui
 *
 * Compiles TypeScript/TSX source to dist/ using esbuild WITHOUT bundling.
 * Each component stays in its own .js file so Next.js `optimizePackageImports`
 * can tree-shake at import granularity (e.g. importing `cn` never pulls in
 * framer-motion or react-quill-new).
 *
 * Post-processing step rewrites .tsx/.ts import extensions → .js so the
 * output is valid ESM that browsers / bundlers can resolve.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');
const outDir = path.resolve(__dirname, '../dist');

/** Recursively collect all .ts / .tsx files */
function getAllFiles(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      getAllFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      acc.push(full);
    }
  });
  return acc;
}

/** Delete dist/ so stale files don't accumulate */
function cleanDist() {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

/**
 * After esbuild compiles with bundle:false the output still references the
 * original .tsx/.ts extensions (e.g. `export * from "./Form.tsx"`).
 * This step rewrites them to .js so the output is valid ESM.
 */
function rewriteExtensions(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      rewriteExtensions(full);
    } else if (e.name.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      // from "./X.tsx"  →  from "./X.js"
      // from "./X.ts"   →  from "./X.js"
      content = content.replace(/(\bfrom\s+["'])(\.[^"']+)\.(tsx|ts)(["'])/g, '$1$2.js$4');
      content = content.replace(/(export\s+\*\s+from\s+["'])(\.[^"']+)\.(tsx|ts)(["'])/g, '$1$2.js$4');
      fs.writeFileSync(full, content);
    }
  });
}

async function build() {
  const t0 = Date.now();
  console.log('🏗  Building @repo/ui (esbuild, no-bundle) …');

  cleanDist();

  const files = getAllFiles(srcDir);
  console.log('   Files:', files.length);

  await esbuild.build({
    entryPoints: files,
    outbase: srcDir,
    outdir: outDir,
    bundle: false,         // compile-only — keeps each component in its own file
    format: 'esm',
    jsx: 'automatic',     // react/jsx-runtime (React 17+)
    loader: { '.css': 'empty' }, // CSS side-effect imports stripped (consumers handle CSS)
    platform: 'browser',
    target: 'es2020',
    sourcemap: false,
  });

  rewriteExtensions(outDir);

  const ms = Date.now() - t0;
  console.log('✅ @repo/ui built in', ms + 'ms →', path.relative(process.cwd(), outDir));
}

build().catch(function (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});

