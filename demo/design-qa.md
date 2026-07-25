# CoverTune Design QA

final result: passed

## Comparison setup

- Selected source: `design-reference.png`
- Visual-matching behavior source: `effect-reference-chloe.png`
- Source dimensions: 852 × 1846 px, normalized to 393 × 852 px for comparison
- Implementation state: `http://127.0.0.1:4173/?name=JON&seed=0`
- App-owned viewport: 393 × 852 CSS px, DPR 1
- Runtime-owned iPhone status/navigation chrome is excluded from fidelity findings
- Final combined evidence: `design-qa-comparison-final.jpg`
- Final implementation crop: `implementation-mobile-screen-final-v2.jpg`

## Required fidelity surfaces

- Pale fog-textured background
- Compact CoverTune masthead with acid-yellow status dot
- Bold Chinese result headline and muted explanatory line
- Three staggered, slightly rotated album cards spelling J / O / N
- Small “代表 X” labels attached to the matching covers
- Frosted bottom command dock with name, shuffle, and save actions
- Monochrome editorial typography, soft shadows, and rounded white paper cards

## Findings and fixes

- P2, fixed: the first implementation used cards that were too large, forcing the third card and command dock below the initial viewport. Constellation card size, heading scale, vertical offsets, and dock density were tightened so the complete J / O / N composition now reads in one mobile frame.
- P2, fixed: the original stacked command dock differed from the selected horizontal dock. It is now a single horizontal control tray with the yellow shuffle action as the focal control.
- P2, fixed: submitting a new name could retain scroll position or leave the simulated keyboard visible. Submission now reads the live field value, blurs the field, hides the keyboard, and resets result scroll.
- P0 remaining: none.
- P1 remaining: none.
- P2 remaining: none.
- P3 accepted: the reference includes two decorative out-of-focus cover fragments that were omitted to keep the functional result cards legible.
- P3 accepted: generated demo art is used for the exact J / O / N hero state; real Internet Archive candidates vary in crop and visual match quality and are explicitly marked for human review.

## Layout and interaction verification

- 1 character (`O`): `single`, 1 card
- 3 characters (`JON`): `constellation`, 3 cards
- 5 characters (`MILES`): `gallery`, 5 cards
- 10 characters (`ALEXANDERS`): `index`, 10 cards
- Invalid character handling verified with `J0N`
- Debounced live name input updates the heading, letter cards, layout, and URL without Enter
- Live Internet Archive candidates replace the offline snapshot after loading
- `CHLOE` resolves to five human-reviewed real covers whose artwork visibly
  represents C / H / L / O / E; title initials are not used for this set
- Cover explanation sheet, shuffle, PNG download, keyboard dismissal, and URL state verified
- Production build passed
- Protected mobile runtime integrity check passed
- Browser console checked after the final reload; no current app errors were observed

## Automated runtime note

The bundled runtime suite reports 7/8 passing. Its remaining fixture test starts a drag at the center of a footer that is entirely covered by an input, while the protected gesture intentionally ignores drags originating from `input` elements. This does not affect CoverTune’s core path, where submit and shuffle keyboard dismissal were verified directly, and no protected runtime files were changed.
