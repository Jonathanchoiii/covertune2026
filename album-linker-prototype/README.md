# AlbumLinker prototype

AlbumLinker searches MusicBrainz release groups, resolves a concrete release and
track list, and returns only verified or reviewable album detail URLs. Search
result pages are intentionally excluded from provider rows.

## Local development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4174
```

## Provider behavior

- MusicBrainz: official API; resolves a concrete Release and track list.
- Cover Art Archive: cover for the selected release.
- Apple Music: exact or reviewable album entity via Apple's catalog search.
- Spotify: exact album entity and track list when server credentials are
  configured, or when MusicBrainz provides an official album relationship.
- YouTube Music, 豆瓣音乐, AOTY, Record Club: only returned when MusicBrainz
  provides a validated exact relationship. Otherwise the UI reports
  `未配置`; it does not construct a search-result URL.

## Spotify configuration

Copy `.env.example` to `.env.local`, add credentials from the Spotify developer
dashboard, and restart the development server:

```dotenv
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

Secrets are used only by the same-origin server endpoint and are never included
in the browser bundle.

## Verification

```bash
npm run build
npm run test:sites
```
