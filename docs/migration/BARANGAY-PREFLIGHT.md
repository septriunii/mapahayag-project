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
