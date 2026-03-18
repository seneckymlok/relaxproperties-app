#!/usr/bin/env node
/**
 * Patch html2canvas to support oklab/oklch/lab/lch color functions.
 *
 * html2canvas only supports rgb/rgba/hsl/hsla. Tailwind CSS v4 uses oklch
 * internally for its color palette. When html2canvas encounters these
 * unsupported color functions, it throws:
 *   "Attempting to parse an unsupported color function 'oklab'"
 *
 * This script patches the SUPPORTED_COLOR_FUNCTIONS map in html2canvas
 * to add fallback handlers for modern color functions, mapping them to
 * transparent (rgba(0,0,0,0)) so rendering continues without crashing.
 *
 * Run automatically via postinstall in package.json.
 */

const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'node_modules/html2canvas/dist/html2canvas.esm.js',
  'node_modules/html2canvas/dist/html2canvas.js',
];

const SEARCH = `var SUPPORTED_COLOR_FUNCTIONS = {
    hsl: hsl,
    hsla: hsl,
    rgb: rgb,
    rgba: rgb
};`;

// Indented version (for html2canvas.js which is inside a function)
const SEARCH_INDENTED = `    var SUPPORTED_COLOR_FUNCTIONS = {
        hsl: hsl,
        hsla: hsl,
        rgb: rgb,
        rgba: rgb
    };`;

const REPLACE = `var oklabFallback = function (_context, args) {
    return pack(0, 0, 0, 0);
};
var SUPPORTED_COLOR_FUNCTIONS = {
    hsl: hsl,
    hsla: hsl,
    rgb: rgb,
    rgba: rgb,
    oklab: oklabFallback,
    oklch: oklabFallback,
    lab: oklabFallback,
    lch: oklabFallback,
    'color-mix': oklabFallback,
    color: oklabFallback
};`;

const REPLACE_INDENTED = `    var oklabFallback = function (_context, args) {
        return pack(0, 0, 0, 0);
    };
    var SUPPORTED_COLOR_FUNCTIONS = {
        hsl: hsl,
        hsla: hsl,
        rgb: rgb,
        rgba: rgb,
        oklab: oklabFallback,
        oklch: oklabFallback,
        lab: oklabFallback,
        lch: oklabFallback,
        'color-mix': oklabFallback,
        color: oklabFallback
    };`;

let patched = 0;

for (const file of filesToPatch) {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-html2canvas] Skipping ${file} (not found)`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Already patched?
  if (content.includes('oklabFallback')) {
    console.log(`[patch-html2canvas] ${file} already patched`);
    patched++;
    continue;
  }

  if (content.includes(SEARCH_INDENTED)) {
    content = content.replace(SEARCH_INDENTED, REPLACE_INDENTED);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-html2canvas] Patched ${file} (indented)`);
    patched++;
  } else if (content.includes(SEARCH)) {
    content = content.replace(SEARCH, REPLACE);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-html2canvas] Patched ${file}`);
    patched++;
  } else {
    console.warn(`[patch-html2canvas] WARNING: Could not find SUPPORTED_COLOR_FUNCTIONS in ${file}`);
  }
}

console.log(`[patch-html2canvas] Done. ${patched}/${filesToPatch.length} files patched.`);
