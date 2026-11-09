# Barangay preflight — 5 November 2026

Approved scope: boundaries and names only; exclude NCR, Iloilo City, Baguio
City and Tacloban City. Cebu and Davao remain in scope. Local review only.

The pinned philippines-json-maps commit is
8eeead560246863c8c820c31ca6fbca81a279477. Its sparse checkout originally
omitted the municities folders. Low, medium and high resolution barangay
folders have now been downloaded without changing the pinned commit.
The upstream README dates its PSGC source to 31 December 2023.

After filtering NCR source IDs beginning 13 and city source IDs 631000000,
1430300000 and 831600000, each resolution contains 39,844 feature records.

| Resolution | Null geometries | Affected parents |
| --- | ---: | ---: |
| Low | 692 | 515 |
| Medium | 191 | 154 |
| High | 8 | 7 |

Even high resolution lacks geometry for:

| Source parent PSGC | Barangay name in source |
| --- | --- |
| 102910000 | Poblacion Sur |
| 1400104000 | Ducligan |
| 1400106000 | Padangitan; Pangal |
| 205008000 | Gabut |
| 304903000 | San Roque Sur |
| 504117000 | Nagarao |
| 802614000 | Barangay 1 |

Cebu's source file 730600000 contains 80 feature records; Davao's
1130700000 contains 182. Neither has null geometry at low resolution.
These counts alone do not establish geometric accuracy or current PSGC parity.

Outstanding: current official barangay identity/parent crosswalk, recent
mergers and renamed barangays, polygon validity and coverage verification,
geometry resolution selection, lazy loading and caching, routing, exclusions,
names-only selection UI, desktop/mobile checks, production asset packaging.
## Local pilot

The pilot enables Zamboanga City and the 16 municipalities of Zamboanga
Sibugay. Their 487 polygons match the totals in the PSA's
[Zamboanga City listing](https://psa.gov.ph/classification/psgc/barangays/0931700000)
and [Zamboanga Sibugay listing](https://psa.gov.ph/classification/psgc/citimuni/0908300000).
The repository validates each source feature's explicit municipality code,
unique barangay code, name, and geometry. The pinned 2023 source names and
boundaries are retained. This does not establish a current individual
PSGC crosswalk or independently certify the polygon boundaries.

The pilot uses medium-resolution files, except Titay, where the high-resolution
file contains all 30 polygons. For an existing sparse checkout, populate
`2023/geojson/municities/medres` and `2023/geojson/municities/hires` in the
geographic submodule before building. The build copies only the 17 selected
files. The browser loads one on demand when its city or municipality opens.
The details menu still opens the city or municipality profile.

## Region IX expansion

The local rollout now covers all 91 Region IX city and municipality routes,
including Sulu and Isabela City. The 2,314 valid source polygons match the
[PSA Region IX summary](https://psa.gov.ph/classification/psgc/provinces/0900000000).
Every polygon has a unique source identifier and the expected explicit parent
identifier. The audit validates pinned 2023 geometry and parent assignments and
compares official totals. It does not replace a current barangay-by-barangay
PSGC crosswalk.

The build now copies the 91 Region IX files. Ten localities use high resolution
to recover absent or malformed medium-resolution polygons: Polanco, Bayog,
Mahayag, Tukuran, Lakewood, Sominot, Tigbao, Titay, Isabela City, and Siasi.
Original source files and coordinates are retained.

The development-only query `?review=barangay-mobile` also enables Cebu City
and Davao City with 80 and 182 barangays respectively. Their files are served
locally for review and are excluded from production output. NCR, Iloilo City,
Baguio City, and Tacloban City remain excluded.

## Nationwide local review

The map now opens barangay boundaries and names directly for 1,628 cities
and municipalities. All 17 NCR localities are enabled with the 1,715 barangays
listed in the [PSA PSGC summary](https://psa.gov.ph/classification/psgc/summary).
Only the selected locality's polygon file is fetched. The coverage registry
is loaded at the first city or municipality visit.

The audit matched 41,829 renderable source polygons against the September
30, 2026 PSGC workbook. Eleven localities show a visible notice with the
number of missing boundaries. Fourteen are held: Calaca after the San Rafael
merger, five localities without a selectable parent polygon, and eight Special
Geographic Area municipalities without a verified parent in the existing map.
The [coverage audit](barangay-coverage-audit.json) lists each exception.
All 180 Iloilo City polygons matched the workbook and the
[PSA barangay listing](https://psa.gov.ph/classification/psgc/barangays/0631000000).
Baguio City uses the pinned high-resolution file, which matched all 129
barangays in the workbook and the
[PSA barangay listing](https://psa.gov.ph/classification/psgc/barangays/1430300000).
Tacloban City's medium-resolution file matched all 138 barangays in the
workbook and the
[PSA barangay listing](https://psa.gov.ph/classification/psgc/barangays/0831600000).
Pateros uses the pinned medium-resolution file, which matched all 10
barangays in the workbook and the
[PSA barangay listing](https://psa.gov.ph/classification/psgc/barangays/1381701000).
Quezon City uses the pinned high-resolution file, which matched all 142
barangays in the workbook and the
[PSA barangay listing](https://psa.gov.ph/classification/psgc/barangays/1381300000).

The pinned 2023 Manila city file is empty. The supplemental Manila file
uses [James Faeldon's MIT-licensed v1.1.0 release](https://github.com/faeldon/philippines-json-maps/releases/tag/v1.1.0)
and its [medium-resolution GeoJSON](https://raw.githubusercontent.com/faeldon/philippines-json-maps/bf70605/latest/geojson/municities/medres/bgysubmuns-municity-1380600000.0.01.json).
The downloaded file's SHA-256 is `cdc1222c9ade142e469af9cc9e57396a57c95781c3b5a656d9f0f43f6e9cd835`.
The supplement retains the 897 records with `geo_level: Bgy` unchanged and
omits the two non-barangay records, Manila North Cemetery and Tutuban Mall.
All 897 names, PSGCs, and city assignments match the September 2026 workbook.
The [PSA Manila listing](https://psa.gov.ph/classification/psgc/barangays/1380600000)
confirms the city and barangay count.

Caloocan uses the same release's [medium-resolution GeoJSON](https://raw.githubusercontent.com/faeldon/philippines-json-maps/bf70605/latest/geojson/municities/medres/bgysubmuns-municity-1380100000.0.01.json).
The downloaded file's SHA-256 is `b0739e298e3ce1d7adbc3b935f77fa4e3f5f01951aadee06456f2e44404c355d`.
The original map predates the [PSA-recorded split](https://psa.gov.ph/content/third-quarter-2024-psgc-updates-creation-two-barangays-division-one-barangay-six)
of Barangay 176 into six. All 193 names, codes, and parent assignments match
the workbook. The six successor polygons are derived from the survey bearings
and distances in [Republic Act 11993](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/97271).
The upstream project fitted their placement to the existing map because the
law omits survey monument coordinates. The underlying boundaries are by
NAMRIA and PSA, distributed by [OCHA HDX](https://data.humdata.org/dataset/cod-ab-phl)
under CC BY-IGO. The other 13 newly enabled NCR cities use the pinned files.

The workbook was retrieved from the public
[PSGC API repository mirror](https://github.com/rbillyjames0221/psgc-api/blob/main/seed/PSGC-3Q-2026-Publication-Datafile.xlsx)
after the official file server returned HTTP 403. Its extraction reconciles
1,642 city and municipality rows and 42,010 barangay rows against the
[PSA release](https://psa.gov.ph/classification/psgc). The mirror's SHA-256 was
`8aad47f84e4f6317dc4222b9fe35d36b5d71f2b74ad8f0c7622289c131dc9a59`.
The matching uses the existing audited current municipality IDs, explicit
parent columns in the boundary source, and PSGC identifiers. Rekeyed NIR and
Sulu barangays must also agree on the name or documented previous name.
One exception is the [documented Anhawan correction](https://psa.gov.ph/system/files/scd/Press%20Release%204Q%20PSGC%20Updates.pdf).
[Guintolan is listed under Imelda](https://psa.gov.ph/classification/psgc/barangays/0908304000).
Its old polygon is removed from Payao, and Imelda reports the missing boundary.

The audit verifies identifiers, source parent assignments and renderable
geometry structure. It does not independently survey polygon accuracy or
reconstruct post-2023 boundary changes. Where the 2023 source lacks current
polygons, the map uses the matched shapes and reports the gap.

To reproduce from the repository root with a local workbook:

```powershell
python react-app/scripts/extract-barangay-psgc.py <workbook.xlsx> <snapshot.json>
node react-app/scripts/audit-barangay-coverage.mjs <snapshot.json> --write
```

The extractor requires `openpyxl`. The build reads the generated registry and
the pinned medium- and high-resolution barangay folders from the geographic
submodule. A sparse checkout must include those folders.
