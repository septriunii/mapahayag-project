// @vitest-environment node
import { readFileSync } from 'node:fs';
import { geographyFixture } from '../../tests/geographyFixture';
import { currentSuluNational } from './sulu';
import { parseGeography } from './validate';
import { featureCode, normalizePsgc } from './psgc';
import { geometryFingerprint } from './fingerprint';
import { viewRegion } from './alignment';
import { formatRoute, parentRoute, parseRoute } from '../navigation/routes';
import { resolveView } from '../navigation/view';
import aliases from '../data/municipal-profile-aliases.json';
import type { GeographicCollection } from './types';

const polygons = (collection: GeographicCollection) => collection.features.flatMap(feature =>
  feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates).map(polygon => JSON.stringify(polygon)).sort();

it.each(['nir', 'legacy'] as const)('moves Sulu national islands without changing any coordinate in %s alignment', async alignment => {
  const file = alignment === 'nir' ? '../geo-nir/country.0.001.json' : '../philippines-json-maps/2023/geojson/country/lowres/country.0.001.json';
  const source = parseGeography(JSON.parse(readFileSync(file, 'utf8')), 'region');
  const before = geometryFingerprint(source);
  const result = currentSuluNational(source, alignment);
  expect(polygons(result.collection)).toEqual(polygons(source.collection));
  expect(geometryFingerprint(source)).toBe(before);
  expect(currentSuluNational(source, alignment)).toBe(result);
  expect(result.collection.features.map(f => featureCode(f, 'region'))).toEqual(source.collection.features.map(f => featureCode(f, 'region')));
  for (const feature of source.collection.features) {
    if (!['900000000', '1900000000'].includes(featureCode(feature, 'region'))) expect(result.collection.features.find(f => featureCode(f, 'region') === featureCode(feature, 'region'))).toBe(feature);
  }
  const { repository } = geographyFixture({ alignment });
  const ix = await repository.region(900000000), barmm = await repository.region(1900000000);
  expect(ix.collection.features.filter(f => featureCode(f, 'province') === '1906600000')).toHaveLength(1);
  expect(barmm.collection.features.some(f => featureCode(f, 'province') === '1906600000')).toBe(false);
  expect(ix.collection.features).toHaveLength(5); // Four provinces plus Isabela City.
  expect(barmm.collection.features).toHaveLength(6); // Five provinces plus the pinned SGA feature.
  expect(viewRegion(1906600000, 1900000000, alignment)).toBe('900000000');
});

it('fails safely on a different national dataset instead of guessing island membership', () => {
  const source = parseGeography(JSON.parse(readFileSync('../geo-nir/country.0.001.json', 'utf8')), 'region');
  source.collection.features.find(f => featureCode(f, 'region') === '1900000000')!.geometry.coordinates.pop();
  expect(() => currentSuluNational(source, 'nir')).toThrow('pinned national geometry');
});

it('redirects both saved BARMM links and current official IDs, retaining all 19 municipal identities', async () => {
  const { config, repository } = geographyFixture();
  const national = (await repository.national()).collection;
  const old = '#/region/1900000000/province/1906600000';
  const canonical = '#/region/900000000/province/1906600000';
  const province = await resolveView(parseRoute(old), config, national, repository);
  expect(formatRoute(province.route)).toBe(canonical);
  expect(province.details?.parent).toContain('Region IX');
  expect(formatRoute(parentRoute(province.route))).toBe('#/region/900000000');
  expect(province.collection.features).toHaveLength(19);
  for (const [source, current] of Object.entries(aliases).filter(([source]) => source.startsWith('19066'))) {
    const view = await resolveView(parseRoute(`#/region/900000000/province/0906600000/municity/${current}`), config, national, repository);
    expect(view.details?.psgc).toBe(normalizePsgc(source));
    expect(formatRoute(view.route)).toBe(`${canonical}/municity/${normalizePsgc(source)}`);
  }
  await expect(resolveView(parseRoute('#/region/600000000/province/1906600000'), config, national, repository)).rejects.toThrow();
});
