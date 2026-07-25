import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolveAlbum, searchMusicBrainz } from "./worker/musicbrainz.js";

function musicBrainzApi(runtimeEnv) {
  return {
    name: "album-linker-musicbrainz-api",
    configureServer(server) {
      server.middlewares.use("/api/musicbrainz/search", async (request, response) => {
        const url = new URL(request.url || "", "http://localhost");

        if (request.method !== "GET") {
          response.statusCode = 405;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED" } }));
          return;
        }

        try {
          const result = await searchMusicBrainz({
            artist: url.searchParams.get("artist") || "",
            album: url.searchParams.get("album") || "",
            limit: url.searchParams.get("limit") || 50,
          });
          response.statusCode = 200;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify(result));
        } catch (error) {
          const status = Number(error.status) || 502;
          response.statusCode = status;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(
            JSON.stringify({
              error: {
                code: status === 400 ? "INVALID_QUERY" : "PROVIDER_UNAVAILABLE",
                message:
                  status === 400
                    ? error.message
                    : "MusicBrainz 暂时不可用，请稍后重试",
              },
            }),
          );
        }
      });

      server.middlewares.use("/api/albums/resolve", async (request, response) => {
        const url = new URL(request.url || "", "http://localhost");

        if (request.method !== "GET") {
          response.statusCode = 405;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED" } }));
          return;
        }

        try {
          const result = await resolveAlbum({
            releaseGroupId: url.searchParams.get("releaseGroupId") || "",
            title: url.searchParams.get("title") || "",
            artist: url.searchParams.get("artist") || "",
            year: url.searchParams.get("year") || "",
            market: url.searchParams.get("market") || "US",
            spotifyCredentials: {
              clientId: runtimeEnv.SPOTIFY_CLIENT_ID,
              clientSecret: runtimeEnv.SPOTIFY_CLIENT_SECRET,
            },
          });
          response.statusCode = 200;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify(result));
        } catch (error) {
          const status = Number(error.status) || 502;
          response.statusCode = status;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(
            JSON.stringify({
              error: {
                code: status === 400 ? "INVALID_QUERY" : "PROVIDER_UNAVAILABLE",
                message:
                  status === 400
                    ? error.message
                    : "专辑详情解析暂时不可用，请稍后重试",
              },
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const runtimeEnv = loadEnv(mode, process.cwd(), "");

  return {
    build: {
      outDir: "dist/client",
    },
    optimizeDeps: {
      include: ["react", "react-dom/client"],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      warmup: {
        clientFiles: ["./src/main.jsx"],
      },
    },
    plugins: [musicBrainzApi(runtimeEnv), react()],
  };
});
