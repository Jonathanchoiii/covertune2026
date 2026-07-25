# AlbumLinker Prototype — Design QA

## Verification setup

- Source of truth: `/Users/jonathanchoiii/.codex/generated_images/019f94e8-124c-7fa0-9e66-b388b3b4e728/call_BxAUB2ZLZQdAcZLFCPlzeiHE.png`
- Source dimensions: `1487 × 1058`
- Implementation screenshot: `implementation-live-search-final.png`
- Implementation viewport: `1920 × 1080`, device scale factor `1`
- Verified state: live “周杰伦 / 范特西 / 2001” result from MusicBrainz, provider evidence collapsed, settings closed, no toast overlay
- Full comparison: `design-qa-live-comparison.png`
- Focused provider-matrix comparison: `design-qa-focused-table.png`

## Required surface checks

| Surface | Result | Evidence |
|---|---|---|
| Typography | Passed | Inter carries UI labels and metadata; Cormorant Garamond carries the editorial album title and scores. Chinese text uses the system sans fallback without layout breakage. |
| Spacing and layout | Passed | Warm editorial two-column composition, compact ruled provider matrix, search strip, album summary, and bottom copy dock follow the source hierarchy. The implementation expands the matrix for the requested 1920-wide canvas while retaining the source proportions. |
| Colors and tokens | Passed | Ivory paper background, oxblood actions, graphite text, pale borders, and restrained provider-brand accents match the reference direction. |
| Image quality and asset fidelity | Passed | The album artwork is cropped from the approved generated reference at display-ready resolution. Provider marks use maintained icon libraries; no hand-drawn SVG or CSS placeholder art is used. |
| Copy and content | Passed | Labels follow the PRD vocabulary, distinguish the MusicBrainz exact entity from unverified search entrances, and clearly disclose the live/degraded provider state. |
| Responsive behavior | Passed | At `1100 × 900` the album summary stacks above the provider matrix and the copy dock remains sticky. At `720 × 900` the form becomes single-column, page width remains `720px`, and the dense matrix uses intentional internal horizontal scrolling. |

## Interaction verification

| Interaction | Result |
|---|---|
| Search MusicBrainz with Björk / Homogenic and update the full result view | Passed; two candidates returned |
| Search MusicBrainz with 周杰伦 / 范特西 and preserve Unicode throughout | Passed; two candidates returned |
| Open the live candidate selector and change the canonical candidate | Passed; provider links updated immediately |
| Expand and collapse per-provider evidence | Passed |
| Open settings, change market/storefront, and save | Passed |
| Copy an individual provider URL | Passed |
| Copy all eligible URLs | Passed |
| Copy the recommended MusicBrainz URL for NeoDB | Passed; success feedback references the selected live release-group URL |
| Resolve a MusicBrainz Release detail page instead of a Release Group/search page | Passed; verified `https://musicbrainz.org/release/...` URL with 12-track preview |
| Resolve an Apple Music album entity without a search-result URL | Passed; verified `https://music.apple.com/cn/album/...` URL |
| Exclude unverified provider search pages | Passed; clean-session links contained only MusicBrainz Release, Apple Music album, and NeoDB |
| Copy all verified exact links | Passed |
| Open supported platform links and NeoDB in a new tab | Passed by URL and control inspection |
| Browser console errors and warnings | Passed; none recorded in the final 1920 × 1080 state |

## Comparison history

1. Initial 1920 × 1080 pass clipped the last provider row and obscured the candidate count.
2. Reduced provider-row height, cover size, and vertical gaps; the last row became visible but the candidate count remained tight.
3. Tightened the album-summary vertical rhythm; all seven providers, candidate count, and the bottom action dock are now visible in the baseline viewport.
4. In-app-browser clipboard access initially returned no value; added a safe `execCommand` fallback and re-tested successfully.
5. Replaced the original fixed fixture search with a rate-limited same-origin MusicBrainz endpoint, real release-group candidates, Cover Art Archive images, and query-derived provider search entrances.
6. Replaced provider search entrances with exact-only resolution. MusicBrainz now resolves a concrete Release and track list; Apple resolves a catalog album entity; Spotify supports optional server credentials; unsupported providers expose no URL.

## Exact-detail regression

- Evidence screenshot: `implementation-exact-detail-tracklist.png`
- MusicBrainz concrete release: 12 tracks available and previewed.
- Apple Music: exact album detail link available for the verified baseline.
- Spotify: safely reports `未配置` without server credentials.
- 豆瓣、YouTube Music、AOTY、Record Club: no constructed search-page URLs.
- Clean browser session: no console warnings or errors.

## Findings

- P0 blockers: none.
- P1 blockers: none.
- P2 blockers: none.
- P3 follow-up: the provider matrix intentionally scrolls horizontally below `1100px`; a future production version may add an optional mobile card presentation.

## Final result

final result: passed
