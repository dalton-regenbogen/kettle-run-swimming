// Builds the website from src/ into dist/.
//
//   src/pages/*.html     → dist/*.html          (include comments replaced with partials,
//                                                current page marked in the nav)
//   src/assets, src/js   → dist/assets, dist/js (copied unchanged)
//   src/css/input.css    → dist/css/output.css  (compiled by Tailwind)
//   CNAME                → dist/CNAME           (keeps the custom domain working)
//
// Usage:
//   node scripts/build.mjs            build once
//   node scripts/build.mjs --minify   build once with compressed CSS (for publishing)

import fs from "node:fs";
import { execSync } from "node:child_process";

const SRC = "src";
const OUT = "dist";
const minify = process.argv.includes("--minify");

// Matches comments like <!-- include: header.html --> and captures the file name.
const INCLUDE = /<!-- include: (.+?) -->/g;

// 1. Start fresh so deleted or renamed pages don't linger in dist/.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);

// 2. Copy files that need no changes.
for (const folder of ["assets", "js"]) {
  fs.cpSync(`${SRC}/${folder}`, `${OUT}/${folder}`, { recursive: true });
}
fs.copyFileSync("CNAME", `${OUT}/CNAME`);

// 3. Build each page by swapping include comments for partial files.
const pages = fs.readdirSync(`${SRC}/pages`).filter((file) => file.endsWith(".html"));

for (const file of pages) {
  const page = fs.readFileSync(`${SRC}/pages/${file}`, "utf8");
  let html = page.replace(INCLUDE, (match, name) => {
    const partialPath = `${SRC}/partials/${name}`;
    if (!fs.existsSync(partialPath)) {
      throw new Error(`${file} includes "${name}", but ${partialPath} does not exist.`);
    }
    return fs.readFileSync(partialPath, "utf8");
  });

  // Mark this page's own nav links as the current page. The header is shared by
  // every page, so it can't know which link to highlight — the build fills it in.
  html = html.replaceAll(
    `data-nav-link href="./${file}"`,
    `data-nav-link href="./${file}" aria-current="page"`,
  );

  fs.writeFileSync(`${OUT}/${file}`, html);
}
console.log(`Built ${pages.length} pages.`);

// 4. Compile the CSS. This runs the same Tailwind command you'd type in the terminal.
execSync(
  `npx tailwindcss -i ${SRC}/css/input.css -o ${OUT}/css/output.css${minify ? " --minify" : ""}`,
  { stdio: "inherit" }, // show Tailwind's output in this terminal
);
