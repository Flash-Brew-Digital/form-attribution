#!/usr/bin/env node

import { glob, readFile, writeFile } from "node:fs/promises";
import { minify } from "@swc/core";
import { transform } from "lightningcss";

async function minifyJS(filePath) {
  const code = await readFile(filePath, "utf8");
  const result = await minify(code, {
    compress: true,
    mangle: true,
    module: true,
  });
  await writeFile(filePath, result.code);
}

async function minifyCSS(filePath) {
  const code = await readFile(filePath);
  const result = transform({
    filename: filePath,
    code,
    minify: true,
  });
  await writeFile(filePath, result.code);
}

async function main() {
  const files = await glob("public/**/*.{js,css}");

  for (const file of files) {
    try {
      if (file.endsWith(".js")) {
        await minifyJS(file);
      } else if (file.endsWith(".css")) {
        await minifyCSS(file);
      }
      console.log(`Success: minified ${file}`);
    } catch (err) {
      console.error(`Error: Could not minify ${file}: ${err.message}`);
      process.exit(1);
    }
  }
}

main();
