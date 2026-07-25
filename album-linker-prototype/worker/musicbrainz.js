const MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1100;

const cache = new Map();
const resolutionCache = new Map();
let requestQueue = Promise.resolve();
let lastRequestAt = 0;
let spotifyTokenCache = null;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function escapeLucene(value) {
  return value.replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, "\\$1");
}

function buildQuery({ artist, album }) {
  const clauses = [];

  if (album) clauses.push(`releasegroup:"${escapeLucene(album)}"`);
  if (artist) clauses.push(`artist:"${escapeLucene(artist)}"`);

  return clauses.join(" AND ");
}

function normalizeArtistCredit(credit = []) {
  return credit
    .map((item) => item?.artist?.name || item?.name)
    .filter(Boolean);
}

function mapReleaseGroup(item) {
  const secondaryTypes = item["secondary-types"] || [];

  return {
    id: item.id,
    title: item.title,
    artists: normalizeArtistCredit(item["artist-credit"]),
    firstReleaseDate: item["first-release-date"] || "",
    primaryType: item["primary-type"] || item.type || "Other",
    secondaryTypes,
    searchScore: Number(item.score || 0),
    sourceUrl: `https://musicbrainz.org/release-group/${item.id}`,
    coverUrl: `https://coverartarchive.org/release-group/${item.id}/front-500`,
  };
}

async function fetchWithRateLimit(url) {
  const run = async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const delay = Math.max(
        0,
        MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt),
      );
      if (delay) await wait(delay);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "AlbumLinkerPrototype/0.2",
          },
          signal: controller.signal,
        });
        lastRequestAt = Date.now();

        if (response.ok) return response.json();
        if (attempt === 0 && [429, 503].includes(response.status)) {
          const retryAfter = Number(response.headers.get("retry-after") || 2);
          await wait(Math.min(Math.max(retryAfter, 1), 5) * 1000);
          continue;
        }

        const error = new Error(`MusicBrainz returned ${response.status}`);
        error.status = response.status === 429 ? 429 : 502;
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    const error = new Error("MusicBrainz retry exhausted");
    error.status = 502;
    throw error;
  };

  const queued = requestQueue.then(run, run);
  requestQueue = queued.catch(() => undefined);
  return queued;
}

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`Upstream returned ${response.status}`);
      error.status = response.status === 429 ? 429 : 502;
      throw error;
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizedText(value = "") {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizedAlbumCore(value = "") {
  return normalizedText(value)
    .replace(
      /\b(deluxe|expanded|remaster(?:ed)?|anniversary|bonus|special|edition|version)\b/g,
      " ",
    )
    .trim()
    .replace(/\s+/g, " ");
}

function releaseYear(value = "") {
  const year = Number(String(value).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function mapTrack(track, mediumPosition) {
  return {
    position: track.position || track.number || "",
    disc: mediumPosition || 1,
    title: track.title || track.recording?.title || "未命名曲目",
    lengthMs: Number(track.length || track.recording?.length || 0) || null,
  };
}

function relationUrls(entity) {
  return (entity?.relations || [])
    .map((relation) => relation?.url?.resource)
    .filter(Boolean);
}

function providerFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLocaleLowerCase();
    const path = url.pathname.toLocaleLowerCase();

    if (host === "open.spotify.com" && path.startsWith("/album/")) return "spotify";
    if (
      (host === "music.apple.com" && path.includes("/album/")) ||
      (host.endsWith("itunes.apple.com") && path.includes("viewalbum"))
    ) {
      return "apple";
    }
    if (
      host === "music.youtube.com" &&
      (path.startsWith("/browse/") || path.startsWith("/playlist"))
    ) {
      return "youtube";
    }
    if (host === "music.douban.com" && /^\/subject\/\d+/.test(path)) return "douban";
    if (host.endsWith("albumoftheyear.org") && path.startsWith("/album/")) return "aoty";
    if (host === "record.club" && path !== "/") return "recordclub";
  } catch {
    return null;
  }

  return null;
}

function collectExactRelations(...entities) {
  const matches = {};

  for (const rawUrl of entities.flatMap(relationUrls)) {
    const provider = providerFromUrl(rawUrl);
    if (provider && !matches[provider]) matches[provider] = rawUrl;
  }

  return matches;
}

function chooseRelease(releases = [], firstReleaseDate = "", market = "US") {
  const canonicalYear = releaseYear(firstReleaseDate);

  return [...releases].sort((left, right) => {
    const score = (release) => {
      const year = releaseYear(release.date);
      let value = 0;
      if (release.status === "Official") value += 50;
      if (canonicalYear && year === canonicalYear) value += 30;
      else if (canonicalYear && year && Math.abs(year - canonicalYear) === 1) value += 15;
      if (release.country === market) value += 10;
      if (release["track-count"] || release.media?.length) value += 5;
      return value;
    };

    return score(right) - score(left);
  })[0];
}

function providerUnavailable(status, reason) {
  return {
    status,
    matchScore: null,
    evidenceCoverage: null,
    detailUrl: null,
    tracks: [],
    evidence: [reason],
  };
}

function cleanAppleUrl(value) {
  try {
    const url = new URL(value);
    url.searchParams.delete("uo");
    return url.toString();
  } catch {
    return value;
  }
}

async function resolveApple({ title, artist, year, market }) {
  const preferredCountry = ["CN", "HK", "JP", "US"].includes(market) ? market : "US";
  const targetTitle = normalizedText(title);
  const targetArtist = normalizedText(artist);
  const targetYear = releaseYear(year);
  const rank = (results) =>
    (results || []).map((item) => {
      const titleExact = normalizedText(item.collectionName) === targetTitle;
      const titleCompatible =
        titleExact ||
        normalizedAlbumCore(item.collectionName) === normalizedAlbumCore(title);
      const artistExact = normalizedText(item.artistName) === targetArtist;
      const itemYear = releaseYear(item.releaseDate);
      const yearDistance =
        targetYear && itemYear ? Math.abs(targetYear - itemYear) : null;
      const yearScore =
        yearDistance === 0 ? 15 : yearDistance === 1 ? 10 : yearDistance === 2 ? 4 : 0;
      const score =
        (titleExact ? 45 : titleCompatible ? 35 : 0) +
        (artistExact ? 35 : 0) +
        yearScore +
        5;
      return {
        item,
        score,
        titleExact,
        titleCompatible,
        artistExact,
        yearDistance,
      };
    }).sort((left, right) => right.score - left.score);
  const countries = [...new Set([preferredCountry, "US"])];
  const queryTerms = [
    ...new Set([
      `${artist} ${title}`.trim(),
      `${normalizedText(artist)} ${normalizedText(title)}`.trim(),
    ]),
  ];
  let best = null;
  let matchedCountry = preferredCountry;

  searchLoop: for (const country of countries) {
    for (const term of queryTerms) {
      const params = new URLSearchParams({
        term,
        entity: "album",
        media: "music",
        limit: "20",
        country,
      });
      const payload = await fetchJson(
        `https://itunes.apple.com/search?${params.toString()}`,
      );
      const candidate = rank(payload.results)[0];
      const valid =
        candidate &&
        candidate.titleCompatible &&
        candidate.artistExact;

      if (valid) {
        best = candidate;
        matchedCountry = country;
        break searchLoop;
      }
    }
  }

  if (!best) {
    return providerUnavailable("not_found", "Apple 目录未找到可严格验证的同版专辑");
  }

  const lookup = await fetchJson(
    `https://itunes.apple.com/lookup?${new URLSearchParams({
      id: String(best.item.collectionId),
      entity: "song",
      country: matchedCountry,
    }).toString()}`,
  );
  const tracks = (lookup.results || [])
    .filter((item) => item.wrapperType === "track")
    .map((item) => ({
      position: item.trackNumber || "",
      disc: item.discNumber || 1,
      title: item.trackName,
      lengthMs: Number(item.trackTimeMillis || 0) || null,
    }));

  return {
    status:
      best.titleExact &&
      (best.yearDistance === null || best.yearDistance <= 2)
        ? "verified_exact"
        : "probable",
    matchScore: Math.min(best.score, 100),
    evidenceCoverage: 0.85,
    detailUrl: cleanAppleUrl(best.item.collectionViewUrl),
    providerItemId: String(best.item.collectionId),
    title: best.item.collectionName,
    artist: best.item.artistName,
    releaseDate: best.item.releaseDate,
    trackCount: best.item.trackCount,
    tracks,
    coverUrl: best.item.artworkUrl100?.replace("100x100", "600x600"),
    evidence: [
      best.titleExact
        ? "Apple 目录专辑标题一致"
        : "专辑主体标题一致，版本名称不同",
      "Apple 目录歌手一致",
      best.yearDistance === 0
        ? "发行年份一致"
        : best.yearDistance !== null && best.yearDistance <= 2
          ? "发行年份接近"
          : "平台发行年份与首发年份不同",
      tracks.length ? `已读取 ${tracks.length} 首曲目` : "详情页为专辑实体",
    ],
    provenance: "apple_catalog_search",
  };
}

async function spotifyToken({ clientId, clientSecret }) {
  if (
    spotifyTokenCache &&
    spotifyTokenCache.expiresAt > Date.now() + 30_000
  ) {
    return spotifyTokenCache.value;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const payload = await fetchJson("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  spotifyTokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };
  return spotifyTokenCache.value;
}

async function resolveSpotify({ title, artist, year, market, credentials }) {
  if (!credentials?.clientId || !credentials?.clientSecret) {
    return providerUnavailable(
      "not_configured",
      "未配置 Spotify Client ID 与 Client Secret，也没有 MusicBrainz 官方关联",
    );
  }

  const token = await spotifyToken(credentials);
  const query = `album:${title} artist:${artist}`;
  const search = await fetchJson(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: query,
      type: "album",
      market,
      limit: "10",
    }).toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const targetTitle = normalizedText(title);
  const targetArtist = normalizedText(artist);
  const targetYear = releaseYear(year);
  const best = (search.albums?.items || [])
    .map((item) => {
      const titleExact = normalizedText(item.name) === targetTitle;
      const artistExact = item.artists?.some(
        (value) => normalizedText(value.name) === targetArtist,
      );
      const itemYear = releaseYear(item.release_date);
      const yearDistance =
        targetYear && itemYear ? Math.abs(targetYear - itemYear) : null;
      const score =
        (titleExact ? 45 : 0) +
        (artistExact ? 35 : 0) +
        (yearDistance === 0 ? 15 : yearDistance === 1 ? 10 : 0) +
        5;
      return { item, score, titleExact, artistExact, yearDistance };
    })
    .filter(
      (item) =>
        item.titleExact &&
        item.artistExact &&
        (item.yearDistance === null || item.yearDistance <= 1),
    )
    .sort((left, right) => right.score - left.score)[0];

  if (!best) {
    return providerUnavailable("not_found", "Spotify 目录未找到可严格验证的同版专辑");
  }

  const album = await fetchJson(
    `https://api.spotify.com/v1/albums/${best.item.id}?${new URLSearchParams({
      market,
    }).toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const tracks = (album.tracks?.items || []).map((item) => ({
    position: item.track_number || "",
    disc: item.disc_number || 1,
    title: item.name,
    lengthMs: Number(item.duration_ms || 0) || null,
  }));

  return {
    status: "verified_exact",
    matchScore: Math.min(best.score, 100),
    evidenceCoverage: 0.9,
    detailUrl: album.external_urls?.spotify,
    providerItemId: album.id,
    title: album.name,
    artist: album.artists?.map((item) => item.name).join(" & "),
    releaseDate: album.release_date,
    trackCount: album.total_tracks,
    tracks,
    coverUrl: album.images?.[0]?.url,
    evidence: [
      "Spotify 专辑标题一致",
      "Spotify 歌手一致",
      "发行年份一致",
      `已读取 ${tracks.length} 首曲目`,
    ],
    provenance: "spotify_official_api",
  };
}

export async function searchMusicBrainz({ artist = "", album = "", limit = 50 }) {
  const normalizedArtist = artist.trim().slice(0, 200);
  const normalizedAlbum = album.trim().slice(0, 200);

  if (!normalizedArtist && !normalizedAlbum) {
    const error = new Error("歌手名和专辑名至少填写一个");
    error.status = 400;
    throw error;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);
  const cacheKey = `${normalizedArtist.toLocaleLowerCase()}|${normalizedAlbum.toLocaleLowerCase()}|${safeLimit}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return { ...cached.value, cache: "hit" };
  }

  const params = new URLSearchParams({
    query: buildQuery({ artist: normalizedArtist, album: normalizedAlbum }),
    fmt: "json",
    limit: String(safeLimit),
  });
  const payload = await fetchWithRateLimit(
    `${MUSICBRAINZ_BASE}/release-group/?${params.toString()}`,
  );
  const value = {
    count: Number(payload.count || 0),
    candidates: (payload["release-groups"] || []).map(mapReleaseGroup),
    cache: "miss",
    source: "musicbrainz",
  };

  cache.set(cacheKey, { createdAt: Date.now(), value });
  return value;
}

export async function resolveAlbum({
  releaseGroupId,
  title,
  artist,
  year = "",
  market = "US",
  spotifyCredentials,
}) {
  if (!/^[0-9a-f-]{36}$/i.test(releaseGroupId || "")) {
    const error = new Error("无效的 MusicBrainz Release Group ID");
    error.status = 400;
    throw error;
  }

  const normalizedMarket = String(market || "US").toUpperCase();
  const cacheKey = [
    releaseGroupId,
    normalizedMarket,
    spotifyCredentials?.clientId ? "spotify-on" : "spotify-off",
  ].join("|");
  const cached = resolutionCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return { ...cached.value, cache: "hit" };
  }

  const groupParams = new URLSearchParams({
    inc: "artist-credits+releases+url-rels",
    fmt: "json",
  });
  const releaseGroup = await fetchWithRateLimit(
    `${MUSICBRAINZ_BASE}/release-group/${releaseGroupId}?${groupParams.toString()}`,
  );
  const selectedRelease = chooseRelease(
    releaseGroup.releases || [],
    releaseGroup["first-release-date"] || year,
    normalizedMarket,
  );

  if (!selectedRelease?.id) {
    const error = new Error("MusicBrainz 发行组没有可用的具体 Release");
    error.status = 502;
    throw error;
  }

  const releaseParams = new URLSearchParams({
    inc: "artist-credits+recordings+media+url-rels+release-groups",
    fmt: "json",
  });
  const release = await fetchWithRateLimit(
    `${MUSICBRAINZ_BASE}/release/${selectedRelease.id}?${releaseParams.toString()}`,
  );
  const tracks = (release.media || []).flatMap((medium) =>
    (medium.tracks || []).map((track) => mapTrack(track, medium.position)),
  );
  const resolvedArtist =
    normalizeArtistCredit(release["artist-credit"]).join(" & ") ||
    artist ||
    "未知歌手";
  const resolvedTitle = release.title || title;
  const resolvedDate = release.date || releaseGroup["first-release-date"] || year;
  const exactRelations = collectExactRelations(releaseGroup, release);
  const sharedRelationResult = (provider, detailUrl) => ({
    status: "verified_exact",
    matchScore: 100,
    evidenceCoverage: 0.95,
    detailUrl,
    title: resolvedTitle,
    artist: resolvedArtist,
    releaseDate: resolvedDate,
    trackCount: tracks.length || null,
    tracks,
    coverUrl: `https://coverartarchive.org/release/${release.id}/front-500`,
    evidence: [
      "MusicBrainz 官方关联链接",
      "具体发行版本已确认",
      tracks.length ? `MusicBrainz 已读取 ${tracks.length} 首曲目` : "该发行暂无曲目数据",
    ],
    provenance: "musicbrainz_relationship",
    provider,
  });

  const applePromise = exactRelations.apple
    ? Promise.resolve(sharedRelationResult("apple", exactRelations.apple))
    : resolveApple({
        title: title || releaseGroup.title,
        artist: artist || resolvedArtist,
        year: year || releaseGroup["first-release-date"],
        market: normalizedMarket,
      }).catch(() =>
        providerUnavailable("temporarily_unavailable", "Apple 目录暂时不可用"),
      );
  const spotifyPromise = exactRelations.spotify
    ? Promise.resolve(sharedRelationResult("spotify", exactRelations.spotify))
    : resolveSpotify({
        title: title || releaseGroup.title,
        artist: artist || resolvedArtist,
        year: year || releaseGroup["first-release-date"],
        market: normalizedMarket,
        credentials: spotifyCredentials,
      }).catch(() =>
        providerUnavailable("temporarily_unavailable", "Spotify 目录暂时不可用"),
      );
  const [apple, spotify] = await Promise.all([applePromise, spotifyPromise]);
  const linkedOrUnavailable = (provider, unavailableStatus, reason) =>
    exactRelations[provider]
      ? sharedRelationResult(provider, exactRelations[provider])
      : providerUnavailable(unavailableStatus, reason);

  const value = {
    canonicalRelease: {
      id: release.id,
      title: resolvedTitle,
      artist: resolvedArtist,
      date: resolvedDate,
      country: release.country || "",
      status: release.status || "",
      barcode: release.barcode || "",
      media: (release.media || []).map((medium) => ({
        position: medium.position,
        format: medium.format || "",
        trackCount: medium["track-count"] || medium.tracks?.length || 0,
      })),
      trackCount: tracks.length,
      tracks,
      detailUrl: `https://musicbrainz.org/release/${release.id}`,
      releaseGroupUrl: `https://musicbrainz.org/release-group/${releaseGroupId}`,
      coverUrl: `https://coverartarchive.org/release/${release.id}/front-500`,
    },
    providers: {
      musicbrainz: {
        status: "verified_exact",
        matchScore: 100,
        evidenceCoverage: 1,
        detailUrl: `https://musicbrainz.org/release/${release.id}`,
        title: resolvedTitle,
        artist: resolvedArtist,
        releaseDate: resolvedDate,
        trackCount: tracks.length,
        tracks,
        coverUrl: `https://coverartarchive.org/release/${release.id}/front-500`,
        evidence: [
          "已从 Release Group 解析具体发行",
          release.status ? `发行状态：${release.status}` : "发行状态未知",
          release.country ? `发行地区：${release.country}` : "发行地区未知",
          tracks.length ? `已读取 ${tracks.length} 首曲目` : "暂无曲目数据",
        ],
        provenance: "musicbrainz_official_api",
      },
      spotify,
      apple,
      youtube: linkedOrUnavailable(
        "youtube",
        "not_configured",
        "YouTube Data API 不提供稳定的 YouTube Music 专辑目录；仅接受 MusicBrainz 官方关联",
      ),
      douban: linkedOrUnavailable(
        "douban",
        "not_configured",
        "未配置合规网页搜索服务，也没有 MusicBrainz 官方关联",
      ),
      aoty: linkedOrUnavailable(
        "aoty",
        "not_configured",
        "AOTY 没有已配置的官方专辑 API，也没有 MusicBrainz 官方关联",
      ),
      recordclub: linkedOrUnavailable(
        "recordclub",
        "not_configured",
        "Record Club 没有已配置的官方专辑 API，也没有 MusicBrainz 官方关联",
      ),
    },
    cache: "miss",
  };

  resolutionCache.set(cacheKey, { createdAt: Date.now(), value });
  return value;
}
