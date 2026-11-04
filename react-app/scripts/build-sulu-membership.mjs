import { readFile, writeFile } from 'node:fs/promises';
import { polygonContains, polygonCentroid } from 'd3';
import assert from 'node:assert/strict';
import { geometryFingerprint } from '../src/geography/fingerprint.ts';

const repo = new URL('../../', import.meta.url);
const read = async file => JSON.parse(await readFile(new URL(file, repo), 'utf8'));
const provinces = await read('philippines-json-maps/2023/geojson/regions/lowres/provdists-region-1900000000.0.001.json');
const sulu = provinces.features.find(feature => feature.properties.adm2_psgc === 1906600000);
const contains = (polygon, point) => polygonContains(polygon[0], point) && !polygon.slice(1).some(hole => polygonContains(hole, point));
// Compare the existing island components in the two source generalizations.
// No coordinates are rounded, dissolved, snapped, simplified or written out.
const exactComponents = new Set(sulu.geometry.coordinates.map(polygon => JSON.stringify(polygon)));
const overlapsSulu = polygon => exactComponents.has(JSON.stringify(polygon)) || sulu.geometry.coordinates.some(source =>
  contains(source, polygonCentroid(polygon[0])) || contains(polygon, polygonCentroid(source[0])) ||
  polygon[0].some(point => contains(source, point)) || source[0].some(point => contains(polygon, point)));
const manifest = {};
for (const [alignment, file, expected] of [
  ['nir', 'geo-nir/country.0.001.json', 43],
  ['legacy', 'philippines-json-maps/2023/geojson/country/lowres/country.0.001.json', 40],
]) {
  const country = await read(file);
  const barmm = country.features.find(feature => feature.properties.adm1_psgc === 1900000000);
  const ix = country.features.find(feature => feature.properties.adm1_psgc === 900000000);
  const componentIndexes = barmm.geometry.coordinates.flatMap((polygon, index) => overlapsSulu(polygon) ? [index] : []);
  assert.equal(componentIndexes.length, expected, `Review ${alignment} source island membership before regenerating`);
  manifest[alignment] = { source: file, barmmFingerprint: geometryFingerprint(barmm.geometry), ixFingerprint: geometryFingerprint(ix.geometry), componentIndexes };
}
await writeFile(new URL('../src/data/sulu-national-membership.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log('Recorded 43 NIR and 40 legacy national island components; geographic source files are unchanged.');
