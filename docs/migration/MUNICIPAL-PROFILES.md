# City and municipality profiles — local review

Baseline: React branch `codex/react-migration-drilldown`, commit `8dd2123deeb24def8e83761d41a24903b7dc0fde`. This release includes the 82 province profiles, 1,634 mapped local profiles and approved focus-box/Back-button refinements. The user reviewed these locally and authorized publishing to the React branch and existing production project on 4 November 2026.

## Coverage and verification

- 1,634 profile identities: all 1,485 municipalities and 149 cities in the pinned map index.
- Current national PSGC summary lists 1,493 municipalities. The eight newer SGA municipalities are not separate selectable polygons in the pinned dataset. This work does not add or change boundaries.
- PSA official province/region city and municipality tables supply names, current ten-digit PSGCs and 2024 POPCEN populations. Sources were checked on 4 November 2026; population reference date is 1 July 2024.
- Each population retains its exact source URL. `municipal-psa-extracts.json` retains the relevant text rows from official pages; tests compare every population against that row. The unsuccessful Ilocos Norte province fetch is superseded by the official region's city and municipality tables.
- All 149 cities have separately verified official classifications: 33 HUCs, five ICCs and 111 component cities. See [HUCs](https://psa.gov.ph/classification/psgc/hucs), [ICCs](https://psa.gov.ph/classification/psgc/iccs), and [component cities](https://psa.gov.ph/classification/psgc/ccs).
- Regional listing and provincial statistical grouping do not imply administrative jurisdiction over independent cities. Notices make the distinction explicit.
- 82 explicit map-to-current-code aliases cover NIR localities (including Bacolod) and Sulu. Geometric identifiers are retained. Sulu's later regional-routing correction is documented in `SULU-ALIGNMENT.md`; repeated place names are never used as runtime keys.
- Older map labels remain visible. Source naming notes explain differences for Don Victoriano, Sawata and Dr. Jose P. Rizal, as well as minor source label variations.

## Visible editorial gaps

The user approved all-map coverage with clearly marked official-source gaps. Every local profile currently provides verified population, PSGC identity, city/municipality type and administrative placement. Detailed terrain/landmarks, founding history and local economy/culture are explicitly marked **Not yet verified**. Land area, density and barangay counts show **Data unavailable**. Province-level values and prose are not attributed to individual localities. These are reviewable initial local profiles, not completed historical monographs.

The availability marker is part of the validated prose schema: verified text must cite sources; unavailable text must not attach citations suggesting verification. Existing country/region/province prose remains verified by default.

## Architecture and layout

- The existing sidebar, typography, palette, dimensions and map interaction code are retained.
- `municipal-facts.json` stores compact factual records, not 1,634 duplicated full articles.
- Municipal facts are dynamically imported on first city/municipality selection. The record schema is validated once; only the selected article is built and validated. Valid articles and the import are cached.
- Changing selection hides previous content immediately; effect cleanup ignores stale responses. Import failures retain map navigation and configured detail records.
- No third-party source requests occur at runtime. The app serves locally bundled verified facts and links to their official references.

## Production-build measurements

Main JavaScript: 521.89 kB / 149.55 kB gzip. Municipal chunk: 467.17 kB / 39.81 kB gzip, loaded on first municipal selection. Province chunk: 352.36 kB / 23.60 kB gzip. CSS: 18.13 kB / 4.70 kB gzip. Main bundle still has the existing 500 kB advisory. No rendering-speed improvement is claimed.

## Local review

Run `pnpm dev` from `react-app`, or use the running local preview after verification.

Examples:

- [Katipunan](http://127.0.0.1:5173/?review=municipalities#/region/900000000/province/907200000/municity/907203000)
- [Pateros, NCR](http://127.0.0.1:5173/?review=municipalities#/region/1300000000/municity/1381701000)
- [Bacolod, NIR](http://127.0.0.1:5173/?review=municipalities#/region/1800000000/province/604500000/municity/630200000)
- [Jolo, old BARMM bookmark redirected to Region IX](http://127.0.0.1:5173/?review=municipalities#/region/1900000000/province/1906600000/municity/1906602000)

## Checks

112 unit tests passed, including all 1,634 profile keys and independently retained source rows, complete city classifications, duplicate place names, import caching/failure recovery, stale-selection cleanup, and validation of all 82 province profiles. TypeScript and Vite production build passed. All 117 copied geographic/configuration resources (3,345,994 bytes) remain byte-identical.

The full browser run exercised 432 checks across Chromium, Firefox, WebKit, Pixel 7, iPhone 13 and iPad emulation: 429 passed initially. Three new mobile scroll checks measured the drawer while its opening animation was running; after waiting for the existing transition to settle, all three passed on their focused rerun. No application change was required for that test timing issue. Browser coverage includes one real municipality per mapped province, NCR, independent-city paths, NIR/Sulu aliases, source-name differences, reload/history, lazy loading/cache reuse, failed module loading, configured-record safety, theme, geography and navigation regression checks.

The existing local Vite server on port 5173 serves the new municipal module successfully (HTTP 200). The local review link opens Katipunan. After the UI refinement, 15 focused desktop/mobile checks passed for dashed 1px/65%-opacity geographic focus outlines, Back-button/sidebar font matching, polygon interaction, linework and narrow controls. Five deployment-target checks also passed.
