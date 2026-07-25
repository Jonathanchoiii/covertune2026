# CoverTune Demo

This is the runnable Product Design demo for the first selected visual direction.
It uses the protected Product Design `mobile-app` runtime and keeps all
app-specific work in `src/Prototype.tsx`, `src/prototype.css`, and small data
helpers.

## Run

```bash
npm ci --prefer-offline --no-audit --no-fund
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

## Validate

```bash
npm run check:runtime
npm run build
npm run test:runtime
```

## Data sources

The app deliberately separates two kinds of content:

1. `JON` demo artwork in `public/covers/` was generated specifically to match
   the selected design. It is fictional and is labelled as demo artwork in the
   UI.
2. `CHLOE` starts with five real releases whose cover artwork passed the
   prototype visual review:
   CRO `C`, Ayumi Hamasaki `H`, KinKi Kids `L album`, De Staat `O`, and Ecco2k
   `E`. Their low-resolution covers live in `public/covers/visual/` for this
   local, non-commercial prototype. Cover copyright remains with each rights
   holder.
3. The reviewed A–Z catalog contains 111 visual candidates: at least three per
   letter, with most letters holding four to six. Metadata comes from
   MusicBrainz and cover files are indexed by Cover Art Archive. The selected
   local thumbnails live in `public/covers/visual-candidates/`; the generated
   application catalog lives in `src/visualCatalog.generated.ts`.
4. The A–Z open catalog snapshot in `src/catalog.ts` contains real music items
   from [Internet Archive Netlabels](https://archive.org/details/netlabels).
   Every item keeps its Internet Archive identifier and Creative Commons
   license URL. Cover thumbnails are passed through the open-source
   [wsrv.nl](https://wsrv.nl/) image cache so they remain exportable to Canvas.

`src/openCatalog.ts` contains a live adapter for the Internet Archive Advanced
Search API:

```text
GET https://archive.org/advancedsearch.php
  ?q=collection:netlabels AND mediatype:audio AND licenseurl:*
  &fl[]=identifier
  &fl[]=title
  &fl[]=creator
  &fl[]=licenseurl
  &output=json
```

The matcher is visual-first: reviewed covers are selected by the visible
letterform or geometry in the artwork. “换一组” rotates through the candidate
pool for each letter, and repeated letters use different candidates when the
pool permits. The Internet Archive adapter remains available as an open-data
fallback.

To regenerate the checked-in visual catalog after changing the reviewed
selection map in `scripts/generate-visual-catalog.mjs`:

```bash
npm run catalog:generate
```

MusicBrainz and Cover Art Archive remain the recommended expansion path from
the product spec. Their metadata is open and their APIs are useful, but album
cover copyright is not uniform. A production catalog must keep per-image
source records and complete human visual and rights review.

## Letter-count layouts

- 1 letter: one centered hero cover.
- 2–3 letters: staggered floating constellation.
- 4–6 letters: two-column gallery with alternating vertical rhythm.
- 7–10 letters: compact three-column visual index; details open in a sheet.

Try `O`, `JON`, `MILES`, and `ALEXANDER` to exercise all modes.

## Assumptions

- The selected image is a mobile visual target, so the demo uses the
  Product Design mobile runtime rather than a responsive desktop shell.
- Visual labels on the open catalog are clearly marked as candidates awaiting
  human review. The three local J/O/N assets remain the art-directed result for
  the original `JON` demo state.
- On compatible mobile browsers, PNG export opens the system share sheet so the
  user can choose “Save Image”. Desktop browsers download the PNG. If a remote
  cover blocks canvas access, the poster uses a local demo cover for that tile
  so export still completes.
