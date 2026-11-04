# Sulu regional alignment correction

Sulu belongs to Region IX (Zamboanga Peninsula), following [Executive Order No. 91, dated 30 July 2025](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/99470). The [PSA Region IX province listing](https://psa.gov.ph/classification/psgc/provinces/0900000000) includes Sulu under current province PSGC 0906600000. References checked on 4 November 2026.

## Behavior

- The national map assigns Sulu's islands to the Region IX clickable feature.
- Region IX drilldown includes four provinces (Sulu and the three Zamboanga provinces), plus the existing Isabela City navigation feature.
- BARMM no longer includes Sulu at either national or province-selection level. Its other five provinces and pinned SGA representation are retained.
- Both the NIR and legacy Visayas alignments use this current Sulu placement. The legacy option still controls the NIR/Visayas arrangement.
- The existing province code 1906600000 and all 19 source municipal identifiers remain intact for geographic loading and configured-record lookup.
- Old BARMM Sulu bookmarks redirect using `replaceState` to Region IX. Links using current official Sulu province/municipality IDs also resolve to the corresponding original geographic identities.
- Profile notices and Region IX's status label reflect the corrected grouping. Existing population figures were already using current PSA coverage and are not recalculated.

## Geometry preservation

`sulu-national-membership.json` identifies whole island components in the pinned national snapshots. The NIR snapshot has 43 Sulu components; the original legacy national generalization has 40. Each snapshot retains exactly its existing coordinates, rings, islands and feature IDs; components are reassigned from BARMM to Region IX without dissolving, simplifying, snapping, rounding or redrawing them.

The manifest builder compares those existing components with the pinned Sulu province geometry using exact component matches and planar polygon containment. It requires the reviewed component counts. Runtime fingerprints check both affected source-region geometries and fail explicitly for an incompatible dataset instead of guessing which islands to move. Other national features retain their original objects; cached geographic resources are not mutated.

Regenerate only after reviewing a changed upstream snapshot:

```powershell
cd react-app
node scripts/build-sulu-membership.mjs
```

All 117 copied geographic/configuration assets (3,345,994 bytes) remain byte-identical. No submodule, original HTML implementation or geographic source file is edited.

## Verification and local review

116 unit tests passed, including coordinate-component conservation for both alignments, safe rejection of unknown geometry, all 19 Sulu municipal identities, saved bookmarks, official IDs and correct parent navigation. TypeScript and production build passed. All 42 focused browser/mobile checks passed across Chromium, Firefox, WebKit, Pixel 7, iPhone and iPad emulation. They cover native Sulu clicks on the national map in both alignments, province/municipality drilldown, removal from BARMM, saved/current-code links, reload, browser history and Back controls, together with ordinary map and narrow-sidebar regression checks.

- [Sulu under Region IX](http://127.0.0.1:5173/?review=sulu#/region/900000000/province/1906600000)
- [Jolo](http://127.0.0.1:5173/?review=sulu#/region/900000000/province/1906600000/municity/1906602000)
- [BARMM without Sulu](http://127.0.0.1:5173/?review=sulu#/region/1900000000)

The user reviewed this correction locally and authorized pushing it to `codex/react-migration-drilldown` and deploying it to the existing `mapahayag-ph` production project on 4 November 2026.
