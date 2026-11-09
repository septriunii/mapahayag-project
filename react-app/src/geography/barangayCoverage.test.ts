// @vitest-environment node
import { geographyFixture } from '../../tests/geographyFixture';
import coverage from '../data/barangay-coverage.json';
import audit from '../../../docs/migration/barangay-coverage-audit.json';
import { featureCode } from './psgc';
import { formatRoute, parentRoute, parseRoute } from '../navigation/routes';
import { resolveView } from '../navigation/view';

it('validates every published barangay file and its unique current PSGCs', async () => {
  const seen = new Set<string>();
  let enabled = 0;
  for (const [parent, entry] of Object.entries(coverage)) {
    if (!entry) continue;
    // Release each parent cache so a national audit does not retain all geometry.
    const view = await geographyFixture().repository.barangays(parent);
    if (!view || view === 'unavailable') throw new Error(`Missing validated data for ${parent}`);
    enabled++;
    for (const feature of view.collection.features) {
      const code = featureCode(feature, 'barangay');
      if (seen.has(code)) throw new Error(`Duplicate current barangay code ${code}`);
      seen.add(code);
    }
  }
  expect(enabled).toBe(audit.totals.enabled);
  expect(seen.size).toBe(audit.totals.polygons);
}, 30_000);

it('loads one file on drilldown, covers enabled cities, and honors the exclusions', async () => {
  const { repository, config, calls } = geographyFixture();
  const { collection } = await repository.national();
  const city = '#/region/900000000/province/907300000/municity/931700000';
  expect(formatRoute(parseRoute(city + '/barangays'))).toBe(city);
  await resolveView(parentRoute(parseRoute(city)), config, collection, repository);
  expect(calls.some(path => path.includes('bgysubmuns'))).toBe(false);
  const view = await resolveView(parseRoute(city), config, collection, repository);
  expect(view.collection.features).toHaveLength(98);
  expect(calls.filter(path => path.includes('bgysubmuns'))).toHaveLength(1);
  const cebu = parseRoute('#/region/700000000/province/702200000/municity/730600000');
  expect((await resolveView(cebu, config, collection, repository)).collection.features).toHaveLength(80);
  const davao = parseRoute('#/region/1100000000/province/1102400000/municity/1130700000');
  expect((await resolveView(davao, config, collection, repository)).collection.features).toHaveLength(182);
  const iloilo = parseRoute('#/region/600000000/province/603000000/municity/631000000');
  expect((await resolveView(iloilo, config, collection, repository)).collection.features).toHaveLength(180);
  const baguio = parseRoute('#/region/1400000000/province/1401100000/municity/1430300000');
  expect((await resolveView(baguio, config, collection, repository)).collection.features).toHaveLength(129);
  const tacloban = parseRoute('#/region/800000000/province/803700000/municity/831600000');
  expect((await resolveView(tacloban, config, collection, repository)).collection.features).toHaveLength(138);
  expect(await repository.barangays(1380600000)).toBeUndefined();
});

it('uses current names and codes and distinguishes partial from unavailable coverage', async () => {
  const { repository, config } = geographyFixture();
  const { collection } = await repository.national();
  const imelda = parseRoute('#/region/900000000/province/908300000/municity/908304000');
  const partial = await resolveView(imelda, config, collection, repository);
  expect(partial.coverageNote).toBe('1 of 19 barangay boundaries unavailable');
  const payao = await repository.barangays('908311000');
  if (!payao || payao === 'unavailable') throw new Error('Missing Payao barangays');
  expect(payao.collection.features.some(feature => feature.properties.adm4_en === 'Guintolan')).toBe(false);
  expect(await repository.barangays('401007000')).toBe('unavailable');
  const dauin = await repository.barangays('704609000');
  if (!dauin || dauin === 'unavailable') throw new Error('Missing Dauin barangays');
  expect(dauin.collection.features.find(feature => featureCode(feature, 'barangay') === '1804609001')?.properties.adm4_en).toBe('Anhawan');
});
