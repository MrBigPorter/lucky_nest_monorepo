#!/usr/bin/env node
/**
 * Build script for @lucky/shared
 *
 * Compiles TypeScript source to dist/ using esbuild (no-bundle, CJS output).
 * Each file stays in its own .js file for granular tree-shaking.
 *
 * No JSX / no .tsx extension rewriting needed — @lucky/shared is pure TypeScript
 * utility code with standard import paths (no explicit .ts extensions).
 *
 * Used by:
 *   - apps/admin-next  (Next.js, via main: "dist/index.js")
 *   - apps/api         (NestJS, webpack alias → TS source directly, ignores dist/)
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');
const outDir = path.resolve(__dirname, '../dist');

/** Recursively collect all .ts files (skip .d.ts) */
function getAllFiles(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      getAllFiles(full, acc);
    } else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
      acc.push(full);
    }
  });
  return acc;
}

function cleanDist() {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

async function build() {
  const t0 = Date.now();
  console.log('🏗  Building @lucky/shared (esbuild, no-bundle) …');

  cleanDist();

  const files = getAllFiles(srcDir);
  console.log('   Files:', files.length);

  await esbuild.build({
    entryPoints: files,
    outbase: srcDir,
    outdir: outDir,
    bundle: false,       // compile-only — keeps each module in its own file
    format: 'cjs',       // CommonJS — safe for both Next.js and Node.js consumers
    platform: 'neutral', // works in both browser (admin-next) and node (api) contexts
    target: 'es2020',
    sourcemap: false,
  });

  const ms = Date.now() - t0;
  console.log('✅ @lucky/shared built in', ms + 'ms →', path.relative(process.cwd(), outDir));
}

build().catch(function (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});

