import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "covers", "visual-candidates");
const metadataPath = path.join(root, "visual-candidates.raw.json");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const metadataOnly = process.argv.includes("--metadata-only");
const downloadOnly = process.argv.includes("--download-only");
const userAgent =
  "CoverTuneDemo/0.1 (visual cover curation; local non-commercial prototype)";

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

function artistName(release) {
  return (release["artist-credit"] || [])
    .map((credit) => credit.name || credit.artist?.name)
    .filter(Boolean)
    .join(", ");
}

function selectCandidates(releases, letter) {
  const seenGroups = new Set();
  return releases
    .filter(
      (release) =>
        release.title?.trim().toUpperCase() === letter,
    )
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .filter((release) => {
      const group = release["release-group"]?.id || release.id;
      if (seenGroups.has(group)) return false;
      seenGroups.add(group);
      return true;
    })
    .slice(0, 20)
    .map((release) => ({
      letter,
      releaseId: release.id,
      releaseGroupId: release["release-group"]?.id || "",
      title: release.title,
      artist: artistName(release) || "Unknown artist",
      date: release.date || "",
      detailUrl: `https://musicbrainz.org/release/${release.id}`,
      coverSourceUrl: `https://coverartarchive.org/release/${release.id}/front-500`,
    }));
}

const catalog = downloadOnly
  ? JSON.parse(await readFile(metadataPath, "utf8"))
  : {};
if (!downloadOnly) {
  for (const [index, letter] of alphabet.entries()) {
    const params = new URLSearchParams({
      query: `release:"${letter}"`,
      fmt: "json",
      limit: "100",
    });
    const payload = await fetchJson(
      `https://musicbrainz.org/ws/2/release/?${params.toString()}`,
    );
    catalog[letter] = selectCandidates(payload.releases || [], letter);
    process.stdout.write(
      `${letter}: ${catalog[letter].length} exact-title cover candidates\n`,
    );
    if (index < alphabet.length - 1) await wait(1100);
  }
}

await writeFile(metadataPath, `${JSON.stringify(catalog, null, 2)}\n`);
if (metadataOnly) {
  process.stdout.write(`Wrote ${metadataPath}\n`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
async function fetchCover(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fetch(url, { headers: { "User-Agent": userAgent } });
    } catch (error) {
      if (attempt === 3) return null;
      await wait(attempt * 700);
    }
  }
}

for (const letter of alphabet) {
  const successful = [];
  for (const candidate of catalog[letter]) {
    if (successful.length >= 5) break;
    const coverCacheUrl = `https://wsrv.nl/?url=${encodeURIComponent(
      candidate.coverSourceUrl.replace("https://", ""),
    )}&output=jpg`;
    const response = await fetchCover(coverCacheUrl);
    if (!response) {
      process.stderr.write(
        `Skip ${letter}: network failure ${candidate.releaseId}\n`,
      );
      continue;
    }
    if (!response.ok) {
      process.stderr.write(
        `Skip ${letter}: ${response.status} ${candidate.releaseId}\n`,
      );
      continue;
    }
    const filename = `${letter.toLowerCase()}-${successful.length + 1}.jpg`;
    await writeFile(
      path.join(outputDir, filename),
      new Uint8Array(await response.arrayBuffer()),
    );
    candidate.localCoverUrl = `/covers/visual-candidates/${filename}`;
    successful.push(candidate);
  }
  catalog[letter] = successful;
  process.stdout.write(`${letter}: downloaded ${successful.length}\n`);
}

await writeFile(metadataPath, `${JSON.stringify(catalog, null, 2)}\n`);
process.stdout.write(`Downloaded candidates to ${outputDir}\n`);
