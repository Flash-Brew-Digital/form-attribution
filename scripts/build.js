#!/usr/bin/env node

/**
 * Build script for Form Attribution
 *
 * Builds:
 * - dist/script.min.js (minified main script)
 * - dist/debug.min.js (debug overlay with inlined CSS/HTML)
 *
 * Usage: node scripts/build.js
 */

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PATHS = {
  // Source
  script: join(ROOT, "src/script.js"),
  debugJs: join(ROOT, "src/debug/index.js"),
  debugCss: join(ROOT, "src/debug/styles.css"),
  debugHtml: join(ROOT, "src/debug/template.html"),

  // Output
  outDir: join(ROOT, "dist"),
  scriptMin: join(ROOT, "dist/script.min.js"),
  debugTemp: join(ROOT, "dist/debug.js"),
  debugMin: join(ROOT, "dist/debug.min.js"),
};

const requireFile = (path, description) => {
  if (!existsSync(path)) {
    throw new Error(`Missing ${description}: ${path}`);
  }
};

const validateSources = () => {
  requireFile(PATHS.script, "main script");
  requireFile(PATHS.debugJs, "debug script");
  requireFile(PATHS.debugCss, "debug styles");
  requireFile(PATHS.debugHtml, "debug template");
};

// Note: execSync usage is safe here - paths are hardcoded constants, not user input
const buildScript = () => {
  console.log("Building script.min.js...");
  execSync(`terser "${PATHS.script}" -o "${PATHS.scriptMin}"`);
};

const buildDebug = () => {
  console.log("Building debug.min.js...");

  let js = readFileSync(PATHS.debugJs, "utf-8");
  const css = readFileSync(PATHS.debugCss, "utf-8");
  const html = readFileSync(PATHS.debugHtml, "utf-8");

  js = js.replace('"__STYLES__"', JSON.stringify(css));
  js = js.replace('"__TEMPLATE__"', JSON.stringify(html));

  // Write temp file, minify, then clean up
  writeFileSync(PATHS.debugTemp, js);
  try {
    execSync(`terser "${PATHS.debugTemp}" -o "${PATHS.debugMin}"`);
  } finally {
    if (existsSync(PATHS.debugTemp)) {
      unlinkSync(PATHS.debugTemp);
    }
  }
};

const build = () => {
  try {
    validateSources();

    if (!existsSync(PATHS.outDir)) {
      mkdirSync(PATHS.outDir, { recursive: true });
    }

    buildScript();
    buildDebug();

    console.log("Build complete!");
  } catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
  }
};

build();
