// @vitest-environment node
import { geographyFixture } from '../../tests/geographyFixture';
import { barangayPilot } from './barangayPilot';
import { featureCode } from './psgc';
import { formatRoute, parentRoute, parseRoute } from '../navigation/routes';
import { resolveView } from '../navigation/view';

it('validates geometry, unique barangay identifiers and parent assignments across the 17 pilot files', async () => {
  const { repository } = geographyFixture();
  const seen = new Set<string>();
  for (const parent of barangayPilot.keys()) {
    const view = await repository.barangays(parent);
    for (const feature of view.collection.features) {
      const code = featureCode(feature, 'barangay');
      expect(seen.has(code), code).toBe(false);
      seen.add(code);
    }
  }
  expect(seen.size).toBe(487);
});

it('opens pilot barangays from the normal municipality route and loads no data outside the pilot', async () => {
  const { repository, config, calls } = geographyFixture();
  const { collection } = await repository.national();
  const city = '#/region/900000000/province/907300000/municity/931700000';
  expect(formatRoute(parseRoute(city + '/barangays'))).toBe(city);
  const pilot = parseRoute(city);
  const province = parentRoute(pilot);
  await resolveView(province, config, collection, repository);
  expect(calls.some(path => path.includes('bgysubmuns'))).toBe(false);
  const view = await resolveView(pilot, config, collection, repository);
  expect(view.level).toBe('barangay');
  expect(view.collection.features).toHaveLength(98);
  const outside = parseRoute('#/region/900000000/province/907200000/municity/907203000');
  expect((await resolveView(outside, config, collection, repository)).level).toBe('municity');
  expect(calls.filter(path => path.includes('bgysubmuns'))).toHaveLength(1);
});
