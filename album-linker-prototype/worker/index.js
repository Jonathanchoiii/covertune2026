import { resolveAlbum, searchMusicBrainz } from "./musicbrainz.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/musicbrainz/search") {
      if (request.method !== "GET") {
        return json({ error: { code: "METHOD_NOT_ALLOWED", message: "仅支持 GET" } }, 405);
      }

      try {
        const result = await searchMusicBrainz({
          artist: url.searchParams.get("artist") || "",
          album: url.searchParams.get("album") || "",
          limit: url.searchParams.get("limit") || 50,
        });
        return json(result);
      } catch (error) {
        const status = Number(error.status) || 502;
        return json(
          {
            error: {
              code: status === 400 ? "INVALID_QUERY" : "PROVIDER_UNAVAILABLE",
              message: status === 400 ? error.message : "MusicBrainz 暂时不可用，请稍后重试",
            },
          },
          status,
        );
      }
    }

    if (url.pathname === "/api/albums/resolve") {
      if (request.method !== "GET") {
        return json({ error: { code: "METHOD_NOT_ALLOWED", message: "仅支持 GET" } }, 405);
      }

      try {
        const result = await resolveAlbum({
          releaseGroupId: url.searchParams.get("releaseGroupId") || "",
          title: url.searchParams.get("title") || "",
          artist: url.searchParams.get("artist") || "",
          year: url.searchParams.get("year") || "",
          market: url.searchParams.get("market") || "US",
          spotifyCredentials: {
            clientId: env.SPOTIFY_CLIENT_ID,
            clientSecret: env.SPOTIFY_CLIENT_SECRET,
          },
        });
        return json(result);
      } catch (error) {
        const status = Number(error.status) || 502;
        return json(
          {
            error: {
              code: status === 400 ? "INVALID_QUERY" : "PROVIDER_UNAVAILABLE",
              message:
                status === 400
                  ? error.message
                  : "专辑详情解析暂时不可用，请稍后重试",
            },
          },
          status,
        );
      }
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
