import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const demoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDir = path.resolve(demoRoot, process.argv[2] || "dist-pages");
const basePath = `/${(process.argv[3] || "covertune2026")
  .replace(/^\/+|\/+$/g, "")}`;
const cacheVersion = encodeURIComponent(process.argv[4] || "local");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg"]);
const publicPaths = [
  "assets/",
  "covers/",
  "fog-gallery.png",
  "qa/",
  "visual-candidates.raw.json",
];

function rewritePublicPaths(source) {
  let rewritten = source;

  for (const publicPath of publicPaths) {
    rewritten = rewritten
      .replaceAll(`"/${publicPath}`, `"${basePath}/${publicPath}`)
      .replaceAll(`'/${publicPath}`, `'${basePath}/${publicPath}`)
      .replaceAll(`\`/${publicPath}`, `\`${basePath}/${publicPath}`)
      .replaceAll(`url(/${publicPath}`, `url(${basePath}/${publicPath}`);
  }

  return rewritten;
}

function findUnscopedPublicPaths(source) {
  return publicPaths.filter(
    (publicPath) =>
      source.includes(`"/${publicPath}`) ||
      source.includes(`'/${publicPath}`) ||
      source.includes(`\`/${publicPath}`) ||
      source.includes(`url(/${publicPath}`),
  );
}

async function rewriteDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await rewriteDirectory(entryPath);
        return;
      }
      if (!textExtensions.has(path.extname(entry.name))) return;

      const source = await readFile(entryPath, "utf8");
      const rewritten = rewritePublicPaths(source);
      if (rewritten !== source) await writeFile(entryPath, rewritten);

      const remainingPaths = findUnscopedPublicPaths(rewritten);
      if (remainingPaths.length > 0) {
        throw new Error(
          `Unscoped public paths remain in ${entryPath}: ${remainingPaths.join(", ")}`,
        );
      }
    }),
  );
}

await rewriteDirectory(outputDir);
const indexPath = path.join(outputDir, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
const escapedBasePath = basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const versionedIndexHtml = indexHtml.replace(
  new RegExp(
    `((?:src|href)="${escapedBasePath}/assets/[^"]+\\.(?:js|css))"`,
    "g",
  ),
  `$1?v=${cacheVersion}"`,
);
await writeFile(indexPath, versionedIndexHtml);
await writeFile(path.join(outputDir, ".nojekyll"), "");
process.stdout.write(
  `Prepared GitHub Pages build at ${outputDir} for ${basePath}/\n`,
);
