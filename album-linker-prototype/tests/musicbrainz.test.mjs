import assert from "node:assert/strict";
import test from "node:test";
import { resolveAlbum, searchMusicBrainz } from "../worker/musicbrainz.js";

test("searches, sanitizes, maps, and caches MusicBrainz release groups", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input) => {
    const url = new URL(input);
    calls.push(url);

    return new Response(
      JSON.stringify({
        count: 1,
        "release-groups": [
          {
            id: "11111111-2222-3333-4444-555555555555",
            title: "Album: Test",
            score: 98,
            "first-release-date": "2001-10-01",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ artist: { name: "Artist (Test)" } }],
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    const first = await searchMusicBrainz({
      artist: "Artist (Test)",
      album: "Album: Test",
      limit: 80,
    });
    const second = await searchMusicBrainz({
      artist: "Artist (Test)",
      album: "Album: Test",
      limit: 80,
    });

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].searchParams.get("query"),
      'releasegroup:"Album\\: Test" AND artist:"Artist \\(Test\\)"',
    );
    assert.equal(calls[0].searchParams.get("limit"), "50");
    assert.equal(first.candidates[0].artists[0], "Artist (Test)");
    assert.equal(first.candidates[0].firstReleaseDate, "2001-10-01");
    assert.equal(first.candidates[0].searchScore, 98);
    assert.equal(first.cache, "miss");
    assert.equal(second.cache, "hit");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects an empty album search", async () => {
  await assert.rejects(
    () => searchMusicBrainz({ artist: "", album: "" }),
    (error) => error.status === 400,
  );
});

test("resolves a concrete release, track list, Apple page, and linked Spotify album", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    const url = new URL(input);

    if (url.hostname === "musicbrainz.org" && url.pathname.includes("/release-group/")) {
      return new Response(
        JSON.stringify({
          title: "Example Album",
          "first-release-date": "2001-01-01",
          releases: [
            {
              id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              title: "Example Album",
              date: "2001-01-01",
              country: "US",
              status: "Official",
            },
          ],
          relations: [
            {
              url: { resource: "https://open.spotify.com/album/example-album-id" },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.hostname === "musicbrainz.org" && url.pathname.includes("/release/")) {
      return new Response(
        JSON.stringify({
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          title: "Example Album",
          date: "2001-01-01",
          country: "US",
          status: "Official",
          "artist-credit": [{ artist: { name: "Example Artist" } }],
          media: [
            {
              position: 1,
              format: "CD",
              "track-count": 1,
              tracks: [
                {
                  position: 1,
                  title: "Opening Track",
                  length: 180000,
                },
              ],
            },
          ],
          relations: [],
        }),
        { status: 200 },
      );
    }

    if (url.hostname === "itunes.apple.com" && url.pathname === "/search") {
      return new Response(
        JSON.stringify({
          results: [
            {
              collectionId: 123,
              collectionName: "Example Album",
              artistName: "Example Artist",
              releaseDate: "2001-01-01T00:00:00Z",
              trackCount: 1,
              collectionViewUrl:
                "https://music.apple.com/us/album/example-album/123?uo=4",
              artworkUrl100: "https://example.test/100x100.jpg",
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.hostname === "itunes.apple.com" && url.pathname === "/lookup") {
      return new Response(
        JSON.stringify({
          results: [
            {
              wrapperType: "track",
              trackNumber: 1,
              discNumber: 1,
              trackName: "Opening Track",
              trackTimeMillis: 180000,
            },
          ],
        }),
        { status: 200 },
      );
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const result = await resolveAlbum({
      releaseGroupId: "11111111-2222-3333-4444-555555555555",
      title: "Example Album",
      artist: "Example Artist",
      year: "2001",
      market: "US",
    });

    assert.equal(
      result.providers.musicbrainz.detailUrl,
      "https://musicbrainz.org/release/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    assert.equal(result.providers.musicbrainz.tracks[0].title, "Opening Track");
    assert.equal(
      result.providers.spotify.detailUrl,
      "https://open.spotify.com/album/example-album-id",
    );
    assert.equal(
      result.providers.apple.detailUrl,
      "https://music.apple.com/us/album/example-album/123",
    );
    assert.equal(result.providers.apple.tracks[0].title, "Opening Track");
    assert.equal(result.providers.douban.status, "not_configured");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
