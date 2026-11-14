import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = url => JSON.parse(readFileSync(url, 'utf8'));
const official = read(process.argv[2]);
const facts = read(new URL('react-app/src/data/municipal-facts.json', root)).records;
const index = read(new URL('psgc-index.json', root)).municities;
const mapped = new Map(facts.map(row => [row.psgc, row]));
const routes = new Set(index.map(row => String(row.psgc)));
const supplemental = new Map([
  ['401007000', 'geo-supplemental/bgysubmuns-municity-401007000.0.01.json'],
  ['1380100000', 'geo-supplemental/bgysubmuns-municity-1380100000.0.01.json'],
  ['1380600000', 'geo-supplemental/bgysubmuns-municity-1380600000.0.01.json'],
]);
// These routes are indexed but the existing municipality view has no polygon.
const missingMapGeometry = new Set(['403425000', '405807000', '806419000', '1204712000', '1705321000']);
// PSA explicitly corrected the name after the source geometry vintage.
const confirmedRenames = new Map([['0704609001', '1804609001']]);
// The current PSA workbook and Imelda list agree that Guintolan moved from
// Payao to Imelda. Omit its old polygon instead of assuming its shape survived.
const transferred = new Map([['0908311008', ['0908304000', '0908304019']]]);
const normalizeName = name => String(name ?? '').normalize('NFKD').toLowerCase().replace(/[^\p{Letter}\p{Number}]/gu, '');
const sourceRoot = new URL('philippines-json-maps/2023/geojson/municities/', root);
const numeric = value => String(Number(value));
const psgc = value => String(value).padStart(10, '0');

function validRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 &&
    ring.every(point => Array.isArray(point) && point.length >= 2 && point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90) &&
    ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1];
}

function validGeometry(geometry) {
  if (geometry?.type === 'Polygon') return geometry.coordinates.length > 0 && geometry.coordinates.every(validRing);
  return geometry?.type === 'MultiPolygon' && geometry.coordinates.length > 0 &&
    geometry.coordinates.every(polygon => polygon.length > 0 && polygon.every(validRing));
}

function inspect(parent, current, records, high, asset) {
  const url = asset ? new URL(asset, root) : new URL(`${high ? 'hires' : 'medres'}/bgysubmuns-municity-${parent}.${high ? '0.1' : '0.01'}.json`, sourceRoot);
  if (!existsSync(url)) return;
  const features = read(url).features;
  if (!Array.isArray(features)) return;

  const seen = new Set(), missing = [], unmatched = [], retired = [];
  const corrections = {};
  for (const feature of features) {
    const properties = feature.properties;
    const source = psgc(properties.adm4_psgc);
    const transfer = transferred.get(source);
    if (transfer && numeric(properties.adm3_psgc) === parent &&
        official[transfer[0]]?.barangays.some(row => row[0] === transfer[1] && normalizeName(row[1]) === normalizeName(properties.adm4_en))) {
      retired.push(source);
      continue;
    }
    const code = parent === numeric(current) ? source : current.slice(0, 7) + source.slice(-3);
    const record = records.get(code);
    const rekeyed = code !== source;
    const sameName = record && [record[1], record[2]].some(name => normalizeName(name) === normalizeName(properties.adm4_en));
    if (!record || (rekeyed && !sameName && confirmedRenames.get(source) !== code) || numeric(properties.adm3_psgc) !== parent || seen.has(code)) {
      unmatched.push([source, properties.adm4_en, record?.[1]]);
      continue;
    }
    seen.add(code);
    if (!validGeometry(feature.geometry)) {
      missing.push(source);
      continue;
    }
    if (rekeyed || record[1] !== properties.adm4_en) corrections[numeric(source)] = { code: numeric(code), name: record[1] };
  }
  const count = seen.size - missing.length;
  return {
    count, expected: records.size, high, corrections, missing, unmatched, retired,
    missingOfficial: [...records].filter(([code]) => !seen.has(code)).map(([, row]) => row.slice(0, 2)),
  };
}

const enabled = {};
const unavailable = new Set();
const partial = [], held = [];
for (const [current, city] of Object.entries(official).sort(([a], [b]) => a.localeCompare(b))) {
  const fact = mapped.get(current);
  const parent = fact && numeric(fact.mapPsgc);
  if (!parent || !routes.has(parent) || fact.region !== city.region) {
    held.push([current, city.name, 'No verified map parent', city.barangays.length]);
    continue;
  }
  if (missingMapGeometry.has(parent)) {
    held.push([current, city.name, 'No selectable city or municipality polygon', city.barangays.length]);
    continue;
  }
  const records = new Map(city.barangays.map(row => [row[0], row]));
  const asset = supplemental.get(parent);
  const medium = inspect(parent, current, records, false, asset);
  const high = !asset && (!medium || medium.count < records.size || medium.unmatched.length) ? inspect(parent, current, records, true) : undefined;
  const candidates = [medium, high].filter(result => result?.count > 0 && result.unmatched.length === 0);
  const best = candidates.sort((a, b) => b.count - a.count)[0];
  if (!best) {
    unavailable.add(parent);
    held.push([current, city.name, medium || high ? 'Unmatched source barangays' : 'No boundary file', city.barangays.length, (medium ?? high)?.unmatched]);
    continue;
  }
  enabled[parent] = {
    count: best.count,
    ...(asset ? { asset } : {}),
    ...(best.high ? { high: true } : {}),
    ...(best.expected !== best.count ? { expected: best.expected } : {}),
    ...(best.missing.length || best.retired.length ? { omit: [...best.missing, ...best.retired].map(numeric) } : {}),
    ...(Object.keys(best.corrections).length ? { corrections: best.corrections } : {}),
  };
  if (best.count !== best.expected) partial.push([current, city.name, best.count, best.expected, best.missing, best.missingOfficial]);
}
const polygons = Object.values(enabled).reduce((sum, entry) => sum + entry.count, 0);
const report = {
  snapshot: '2026-09-30',
  totals: { enabled: Object.keys(enabled).length, polygons, partial: partial.length, held: held.length, excluded: 0 },
  partial, held, excluded: [],
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--write')) {
  const entries = Object.entries({ ...enabled, ...Object.fromEntries([...unavailable].map(key => [key, null])) })
    .map(([key, value]) => `  "${key}": ${JSON.stringify(value)}`);
  writeFileSync(fileURLToPath(new URL('react-app/src/data/barangay-coverage.json', root)), `{\n${entries.join(',\n')}\n}\n`);
  writeFileSync(fileURLToPath(new URL('docs/migration/barangay-coverage-audit.json', root)), JSON.stringify(report, null, 2) + '\n');
}
