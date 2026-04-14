import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "assets");
const imagesDir = path.join(rootDir, "images");

const assetFiles = [
  path.join(assetsDir, "mpti-data.js"),
  path.join(assetsDir, "mpti-test.js"),
  path.join(assetsDir, "mpti-gallery.js"),
  path.join(assetsDir, "mpti-leaderboard.js")
];

const htmlFiles = [
  path.join(rootDir, "index.html"),
  path.join(rootDir, "gallery.html"),
  path.join(rootDir, "leaderboard.html")
];

function walkFiles(dir, extensions, collected = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extensions, collected);
      continue;
    }

    if (extensions.has(path.extname(entry.name).toLowerCase())) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function hashFiles(files) {
  const hash = createHash("sha256");
  for (const filePath of [...files].sort()) {
    hash.update(path.relative(rootDir, filePath));
    hash.update("\n");
    hash.update(readFileSync(filePath));
    hash.update("\n");
  }
  return hash.digest("hex").slice(0, 12);
}

function replaceOrThrow(filePath, pattern, replacement) {
  const original = readFileSync(filePath, "utf8");
  const matches = original.match(pattern);
  if (!matches) {
    throw new Error(`Pattern not found in ${path.relative(rootDir, filePath)}`);
  }

  const updated = original.replace(pattern, replacement);
  writeFileSync(filePath, updated, "utf8");
}

const imageFiles = walkFiles(imagesDir, new Set([".png", ".webp"]));
const imageVersion = hashFiles(imageFiles);

replaceOrThrow(
  path.join(assetsDir, "mpti-data.js"),
  /const imageAssetVersion = "[^"]+";/,
  `const imageAssetVersion = "${imageVersion}";`
);

const scriptVersion = hashFiles(assetFiles);

const scriptNames = [
  "mpti-data",
  "mpti-test",
  "mpti-gallery",
  "mpti-leaderboard"
];

for (const htmlFile of htmlFiles) {
  let html = readFileSync(htmlFile, "utf8");
  for (const scriptName of scriptNames) {
    const scriptPattern = new RegExp(
      `(<script src="\\./assets/${scriptName}\\.js)(?:\\?v=[^"]*)?("></script>)`,
      "g"
    );
    html = html.replace(scriptPattern, `$1?v=${scriptVersion}$2`);
  }
  writeFileSync(htmlFile, html, "utf8");
}

console.log(`imageVersion=${imageVersion}`);
console.log(`scriptVersion=${scriptVersion}`);
