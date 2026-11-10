# MAPA-Hayag Project

**MAPA-Hayag** is a public interactive map for exploring the Philippines' administrative boundaries and geographic information. Community contributions are welcome.

The name combines two words: **Mapa**, meaning *map*, and **Hayag**, a word used in Visayan languages such as Cebuano, meaning *clear, visible, or revealed*. It also plays on the Tagalog word **mapahayag**, meaning *to express, communicate, or make something known*. Together, these meanings reflect the project's vision of revealing, communicating, and making Philippine geographic information more accessible and understandable to everyone.

🌐 **Live Demo:** [Explore MAPA-Hayag](https://mapahayag-ph.vercel.app/#/) 

## Project Vision

With continuous improvements in geographic accuracy, data integration, performance, and interactive features, **MAPA-Hayag** aims to evolve beyond a simple map viewer into a versatile Philippine geographic information platform.

The project is envisioned as a reusable foundation for various applications, including:

- **Geographic Exploration** — Explore regions, provinces, cities, municipalities, and barangays.
- **Data Visualization** — Present population, demographics, economic indicators, and other geographic statistics.
- **Disaster Risk Management** — Visualize flood-prone areas, hazard zones, evacuation centers, and disaster-related information.
- **Infrastructure Mapping** — Locate schools, hospitals, roads, public facilities, and government services.
- **Research and Education** — Support geographic studies, academic research, and interactive learning.
- **Government and Public Information** — Make administrative and community-level information easier to explore.
- **Custom Applications** — Enable developers to build their own geographic tools, dashboards, and location-based services.

Ultimately, **MAPA-Hayag** aspires to become an open, extensible, and community-driven geographic platform that encourages innovation, transparency, and greater accessibility to Philippine geographic information.

## Technology Stack

The primary app on `main` is built with React, TypeScript, Tailwind CSS, Vite, D3.js, and GeoJSON. See [`react-app/`](react-app/README.md) for local setup and build instructions. The original HTML apps are archived as runnable references in [`legacy/`](legacy/README.md).

## Current Features

- Interactive Philippine map with administrative drilldown
- Clickable geographic boundaries and information panels
- Dynamic choropleth coloring and configurable datasets
- PSGC-based geographic identification
- Negros Island Region (NIR) and legacy 17-region support
- Dynamic geographic data loading

## Geographic Coverage

| Administrative Level | Status |
|---|---|
| Philippines | Supported |
| Regions | Supported |
| Provinces / Districts | Supported |
| Cities / Municipalities | Supported |
| Barangays | Available nationwide where verified boundaries exist, including all 1,715 barangays in NCR |

The [coverage audit](docs/migration/BARANGAY-PREFLIGHT.md#nationwide-local-review) records geographic exceptions and boundary sources.

## Contributing

Spot a wrong name, boundary, or administrative assignment? Anyone can suggest a correction, with or without writing code. [Open a GitHub issue](https://github.com/septriunii/mapahayag-project/issues/new) and include:

- The affected place and its PSGC code, if you know it.
- A link to the map view or a screenshot showing the problem.
- What should change and an official source, if you have one.

You can also use Issues to report bugs or suggest improvements. Pull requests for data, documentation, accessibility, and code fixes are welcome.

## Credits & Acknowledgments

**Application.** MAPA-Hayag began as a fork of `tordecilla/ph-drilldown-map`. Thanks to tordecilla and the original contributors for the interactive map, administrative drilldown, and configurable choropleth. MAPA-Hayag builds on that foundation with a React interface, geographic profiles, and barangay drilldown. [Original project README](https://github.com/tordecilla/ph-drilldown-map#readme)

**Geographic data.** Most administrative boundaries come from James Faeldon's `philippines-json-maps`, which the original project included as a Git submodule. MAPA-Hayag keeps that submodule pinned at `8eeead5` and uses supplemental boundary files for Manila and Caloocan from Faeldon's `v1.1.0` release. The coverage audit documents those files and credits the underlying NAMRIA and PSA boundary data. PSA's Philippine Standard Geographic Code is our reference for official names, codes, and administrative assignments. [Pinned boundary source](https://github.com/faeldon/philippines-json-maps/tree/8eeead560246863c8c820c31ca6fbca81a279477) · [Supplemental release](https://github.com/faeldon/philippines-json-maps/releases/tag/v1.1.0) · [Coverage audit](docs/migration/BARANGAY-PREFLIGHT.md#nationwide-local-review) · [PSA PSGC](https://psa.gov.ph/classification/psgc)

The React sea and ocean labels use naming references from NAMRIA and PAGASA
publications. Geographic references and implementation details are recorded in
[the maritime layer notes](docs/migration/MARITIME-CONTEXT.md).

## Licensing

MAPA-Hayag is public and welcomes contributions. This repository currently has no repository-wide license for the application code. James Faeldon's MIT notices apply to his project and are retained with the geographic files we use. The coverage audit records attribution and licensing for the underlying data. [Upstream MIT notice](https://github.com/faeldon/philippines-json-maps/blob/8eeead560246863c8c820c31ca6fbca81a279477/LICENSE) · [Supplemental MIT notice](geo-supplemental/LICENSE)
