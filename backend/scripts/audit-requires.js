'use strict';

/**
 * Standalone static analyzer (no dependencies) that walks every .js file
 * under src/, extracts relative require('./...') calls, and verifies the
 * target file actually resolves on disk. Used during development to catch
 * broken local imports without needing `npm install` first. Not part of
 * the shipped application.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const REQUIRE_RE = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

function resolveCandidate(basePath) {
  const candidates = [
    basePath,
    `${basePath}.js`,
    path.join(basePath, 'index.js'),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

const files = walk(SRC);
let errorCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = REQUIRE_RE.exec(content))) {
    const importPath = match[1];
    const basePath = path.resolve(path.dirname(file), importPath);
    const resolved = resolveCandidate(basePath);
    if (!resolved) {
      errorCount += 1;
      console.log(`MISSING: ${path.relative(ROOT, file)} -> require('${importPath}')`);
    }
  }
}

console.log(`\nChecked ${files.length} files.`);
if (errorCount === 0) {
  console.log('All relative requires resolve correctly.');
  process.exit(0);
} else {
  console.log(`${errorCount} broken relative require(s) found.`);
  process.exit(1);
}
