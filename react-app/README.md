# MAPA-Hayag React app

This is the primary application on `main`. The original HTML apps are runnable reference copies under [`legacy/`](../legacy/README.md). See the [baseline contract](../docs/migration/BASELINE.md) and [migration results](../docs/migration/RESULTS.md) for the original comparison.

## Requirements and local use

Use Node.js 24 LTS and pnpm 11.25.0 (the packageManager field and lockfile pin the tooling). A normal recursive checkout initializes the geographic submodule:

```sh
git submodule update --init --depth=1 --filter=blob:none
pnpm --dir react-app install --frozen-lockfile
pnpm --dir react-app dev
```

The full geographic repository is large. The [GitHub Pages workflow](../.github/workflows/pages.yml) lists the directories needed for a sparse checkout at the pinned gitlink revision.

Open the local URL printed by Vite. Default alignment is NIR. Use `/?alignment=legacy` for the 17-region alignment. The validated configuration also accepts `alignment: "nir" | "legacy"`; existing data.json without this field defaults to NIR. Invalid alignment values produce a visible error.

Root data.json is mounted read-only in development. geoBasePath resolves relative to its configuration URL, preserving existing relative and HTTP asset bases. PSGCs accept numbers or digit strings; leading zeros are normalized only for matching. No current/old code conversion or new administrative classification is inferred. Duplicate records and malformed configuration fail validation rather than silently overwriting data. Display values and descriptions are React text, so supplied HTML is displayed literally.

## Checks

```sh
pnpm --dir react-app check:resources
pnpm --dir react-app test
pnpm --dir react-app build
pnpm --dir react-app check:build
pnpm --dir react-app exec playwright install chromium
pnpm --dir react-app test:baseline
pnpm --dir react-app test:browser
pnpm --dir react-app preview
```

Browser tests can use an existing Chromium/Edge executable instead of installing browsers. For example in PowerShell:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
pnpm --dir react-app test:baseline
pnpm --dir react-app test:browser
```

`MAPAHAYAG_TEST_DEV=1` runs the same browser suite against the development server instead of dist. The baseline runner serves root/legacy files and substitutes the locally installed D3 7 distribution for the external CDN response. It never rewrites source files. The build verifier compares SHA-256 hashes for copied assets. Browser artifacts live in ignored test-results/.

For the Chromium/Firefox/WebKit desktop and emulated Pixel/iPhone/iPad matrix, install all three Playwright browsers and set `MAPAHAYAG_CROSS_BROWSER=1` before running `test:browser --workers=1`. The default single-browser suite continues to support an installed Edge executable. `test:performance` compares the production bundle with unchanged original HTML on the same local gzip server, with five runs per app/profile; it writes ignored performance-results/. See the [release checks](../docs/migration/RELEASE-CHECKS.md) for results, reproduction commands and emulation limits.

For manual legacy comparison, serve the repository root using a static HTTP server, then open `/legacy/index.html` or `/legacy/index-no-nir.html`. The applications fetch JSON over HTTP.

## Implemented in this increment

- React/TypeScript/Vite/Tailwind project and pinned dependencies.
- National → regional → provincial → isolated city/municipality rendering, existing linear projections and labels, pan/zoom, keyboard/mouse polygon selection, safe details, approved dark left drawer/hamburger and responsive sizing.
- Configuration validation, typed GeoJSON/PSGC handling, NIR/legacy asset policy, NCR medium-resolution composition, and supplementary city assembly.
- Shared validated promise cache, failed-request retry, StrictMode request deduplication, stale-result suppression and listener cleanup.
- Hash routing, deep-link reloads, browser Back/Forward, explicit parent Back controls, validated ancestry and maxDepth behavior. NCR bypasses districts; older NCR district city URLs canonicalize to direct city URLs. NIR and supplementary city routes preserve the active view hierarchy without changing their source codes.
- Geographic zoom/fade transitions with cancellation, reduced-motion support, zoom reset on navigation and stale-response suppression. Source geometry warnings remain visible in the status indicator.

The React application supports full drilldown locally and on Vercel. Reference comparisons cover exact SVG paths and labels for ordinary regional/provincial views, NCR, NIR province/HUC composition and an isolated city, plus the welcome drawer geometry and styling. Cross-browser checks and equivalent-workload performance profiling are recorded in the release checks. Actual-device/animation acceptance remains; emulated devices do not establish physical Safari compatibility or touch performance.

The source includes GeoJSON only in its runtime paths; no TopoJSON decoder is introduced or needed for parity. No geometry is regenerated. Known null/malformed source geometry is reported; it is not repaired or invented.

## Deployment

[Production](https://mapahayag-ph.vercel.app/) builds from `main`. The Vercel build guard accepts `main` and allows `codex/react-migration-drilldown` for previews. Vercel builds from the repository root so Vite can access the adjacent geographic datasets.

Vercel and GitHub Pages both publish `react-app/dist`. Installation uses Node 24, pinned pnpm 11.25.0, and the frozen lockfile. The build copies the configuration, pinned geography, supplemental assets, and licenses into the output and verifies copied asset hashes. GitHub Pages uses a relative base for the project URL.

To run the browser suite against a deployed preview, set `MAPAHAYAG_TEST_URL` to its HTTPS origin and run `test:browser`. Protected previews can use a temporary deployment share token supplied through `MAPAHAYAG_PREVIEW_BYPASS` in the process environment. The runner exchanges its `_vercel_share` URL parameter for cookies in memory, including for the mobile browser context; it never saves the token or adds it to third-party requests. Do not commit share tokens. Use `test:deployment` for the deployment-target guards, and `check:preview` to compare all deployed geographic JSON values, license text and JS/CSS bundles with the local build. These checks use Node 24. Cloud deployment and browser-test results are recorded in docs/migration/RESULTS.md.

## Attribution

Application foundation: [tordecilla/ph-drilldown-map](https://github.com/tordecilla/ph-drilldown-map). Preserve the root README credit. No new license or relicensing claim is made for the inherited application code.

Geographic source: [James Faeldon's philippines-json-maps](https://github.com/faeldon/philippines-json-maps), pinned at `8eeead560246863c8c820c31ca6fbca81a279477`. Its MIT notice was verified locally after initialization and is copied unchanged into production-preview output at `philippines-json-maps/LICENSE`. NIR override provenance remains in the existing generator script.
