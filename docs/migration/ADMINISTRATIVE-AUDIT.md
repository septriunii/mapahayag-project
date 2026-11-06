# Administrative relationships audit — 5 November 2026

Baseline: `95d586d54221f1229c815f8a25a680facef7d1e3`, branch `codex/react-migration-drilldown`.
Changes remain local for review. No push, deployment, domain change or main-branch replacement.

## Evidence and scope

Compared all 82 province identities and their regional groups, all 149 cities and
1,485 mapped municipality identities against PSA's official online tables, retrieved
5 November 2026. The retained extract is `psgc-audit-official.json`; it contains codes,
names and the province table's explicit regional headings, not geographic boundaries.

- [PSA provinces and regional groupings](https://psa.gov.ph/classification/psgc/provinces)
- [PSA municipalities](https://psa.gov.ph/classification/psgc/municipalities)
- [PSA cities](https://psa.gov.ph/classification/psgc/cities)
- [PSA releases and latest publication listing](https://psa.gov.ph/classification/psgc/index)
- [NIR composition and code changes, June 2024](https://www.psa.gov.ph/system/files/scd/Press-Release-June2024PSGC.pdf)
- [Sulu transfer, July 2025](https://psa.gov.ph/system/files/scd/Press-Release-July2025PSGC_0.pdf)
- [2025 municipality name correction](https://psa.gov.ph/classification/psgc/node/1684076101)
- [2026 first-quarter name corrections](https://psa.gov.ph/classification/psgc/node/1684083211)
- [2026 second-quarter name corrections](https://psa.gov.ph/content/second-quarter-2026-psgc-updates-renaming-one-municipality-and-one-barangay-and-correction)

PSA lists the latest publication as 30 September 2026. Its XLSX download returned a
Cloudflare challenge, so this audit uses the accessible official online tables and
release notices instead. Some table captions still say 31 July 2025 although they
include later name corrections. This report does not claim a downloaded workbook
comparison. Existing municipal facts and their specific province/city-classification
PSA extracts provide the municipal parent associations; the new tests cross-check
every rendered parent against those associations and the nationwide identity tables.

PSA content attribution: Philippine Statistics Authority; CC BY 4.0 unless otherwise
stated by PSA. Original map attribution and geographic assets remain unchanged.

## Findings and corrections

No additional province-to-region reassignment was identified after the Sulu fix.
The default NIR grouping correctly contains Negros Occidental, Negros Oriental and
Siquijor, including Bacolod. The explicit legacy alignment intentionally retains
their former Western/Central Visayas grouping. NCR cities remain directly under NCR;
districts and geographically grouped independent cities are not treated as provincial
jurisdiction. Maguindanao del Norte/del Sur and Cotabato City are already in BARMM.

Three application defects were corrected:

1. Current official NIR province/municipal PSGCs were not accepted by the map's older
   source-ID routes. Official IDs and pre-NIR bookmarks now resolve to the displayed
   alignment, retaining source feature IDs. The mapping is explicit, preserves Back,
   reload and browser history, and continues rejecting unrelated parent combinations.
2. Six stale source names were still displayed despite current profile names:

| Source PSGC | Old displayed name | Current displayed name |
| --- | --- | --- |
| 0201522000 | Sanchez-Mira | Sanchez Mira |
| 1705306000 | Brooke'S Point | Brooke's Point |
| 1705323000 | Rizal | Dr. Jose P. Rizal |
| 1004217000 | Don Victoriano Chiongbian | Don Victoriano |
| 1102324000 | San Isidro | Sawata |
| 1903638000 | Tagoloan Ii | Tagoloan II |

Metadata overrides apply consistently to labels, accessible polygon names and detail
headers. Profiles explain the original source name. No coordinates or original data
files are rewritten. PSGC-based choropleth/data joins retain their source identities.

3. Administrative labels counted the pinned SGA aggregate as a sixth BARMM province
   and used the province/district heading for Isabela City's navigation grouping.
   BARMM now says five provinces plus the SGA; Isabela City's heading identifies a
   city navigation grouping. Their source IDs and geographic collections are retained.

## Explicit dataset limitations

- PSA lists 1,493 municipalities; the pinned map indexes 1,485. The eight missing SGA
  municipalities are Kapalawan, Old Kaabakan, Kadayangan, Nabalawag, Pahamuddin,
  Malidegao, Ligawasan and Tugunan (`1999901000` through `1999908000`). The pinned SGA
  collection is malformed and cannot supply those municipal boundaries. This audit
  does not invent polygons or repurpose its old aggregate code as a municipality.
- Five indexed localities have null source geometry: City of San Pedro, Jala-Jala,
  Limasawa, Pikit and Kalayaan. Their identities/profiles are retained, but these
  polygons cannot be rendered from the pinned source.
- This is an administrative identity/parentage audit, not a cadastral accuracy audit.
  It does not certify every 2023 boundary coordinate against subsequent territorial
  changes, including Makati/Taguig. Boundary replacement needs verified compatible
  geographic data and is separate from these metadata/navigation corrections.

## Verification

- 123 unit tests pass, including the nationwide audit in both alignments, all 82
  current NIR/Sulu municipal aliases, source immutability and hierarchy rejection.
- TypeScript and production build pass. Existing >500 kB main-chunk advisory remains.
- All 117 copied assets (3,345,994 bytes) are byte-identical to source assets.
- 21 focused browser tests pass: desktop Chromium/Firefox/WebKit, Pixel 7, iPhone 13
  and iPad. They verify updated labels/profile identity, official NIR URLs, saved
  bookmarks, reload, Back controls and browser history.
- Nine Sulu regression tests also pass against the running local development server
  in Chromium, Firefox and WebKit, covering both alignments and old BARMM links.
- The browser tests use the existing native SVG label input helper because WebKit's
  generated locator click point can miss SVG text. No synthetic event dispatch is used.

## Local review

- National map: http://127.0.0.1:5173/?review=administrative-audit#/
- Current NIR/Bacolod ID: http://127.0.0.1:5173/?review=administrative-audit#/region/1800000000/province/1804500000/municity/1830200000
- Former Visayas bookmark: http://127.0.0.1:5173/?review=administrative-audit#/region/600000000/province/604500000/municity/630200000
- Sawata: http://127.0.0.1:5173/?review=administrative-audit#/region/1100000000/province/1102300000/municity/1102324000
- Legacy alignment: http://127.0.0.1:5173/?alignment=legacy&review=administrative-audit#/region/1800000000/province/1804500000/municity/1830200000
