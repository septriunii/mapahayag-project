// @vitest-environment node
import official from '../../../docs/migration/psgc-audit-official.json';
import index from '../../../psgc-index.json';
import facts from '../data/municipal-facts.json';
import aliases from '../data/municipal-profile-aliases.json';
import { geographyFixture } from '../../tests/geographyFixture';
import { featureCode, normalizePsgc } from './psgc';
import { viewRegion } from './alignment';
import { currentMunicipalNames, withCurrentNames } from './currentNames';
import { parseGeography } from './validate';
import { formatRoute, parseRoute } from '../navigation/routes';
import { resolveView } from '../navigation/view';

const pad = (value: string | number) => String(value).padStart(10, '0');
const provinceAliases: Record<string, string> = { '0604500000': '1804500000', '0704600000': '1804600000', '0706100000': '1806100000', '1906600000': '0906600000' };

it('reconciles every indexed identity with the official nationwide tables and explicitly accounts for gaps', () => {
  expect(official.provinces).toHaveLength(82);
  expect(official.cities).toHaveLength(149);
  expect(official.municipalities).toHaveLength(1493);
  const current = new Map([...official.cities, ...official.municipalities].map(row => [row.psgc, row.name]));
  for (const row of facts.records) expect(current.get(row.psgc), row.psgc).toBe(row.name);
  const mapped = new Set(facts.records.map(row => row.psgc));
  expect([...current.keys()].filter(code => !mapped.has(code)).sort()).toEqual([
    '1999901000', '1999902000', '1999903000', '1999904000', '1999905000', '1999906000', '1999907000', '1999908000',
  ]);
  const provinces = index.provinces.filter(row => row.type === 'Province' && !['0990100000', '1909900000'].includes(pad(row.psgc)));
  expect(provinces).toHaveLength(82);
  for (const province of provinces) {
    const code = pad(province.psgc);
    const row = official.provinces.find(item => item.psgc === (provinceAliases[code] ?? code));
    expect(row?.name).toBe(province.name);
    expect(viewRegion(province.psgc, province.region_psgc, 'nir')).toBe(normalizePsgc(row!.region));
  }
});

it.each(['nir', 'legacy'] as const)('audits every rendered province and municipal parent in %s alignment', async alignment => {
  const { repository } = geographyFixture({ alignment });
  const seen = new Set<string>();
  const rows = new Map(facts.records.map(row => [normalizePsgc(row.mapPsgc), row]));
  const check = (code: string, name: string | null | undefined, region: string, province?: string) => {
    expect(seen.has(code), `Duplicate rendered identity ${code}`).toBe(false);
    seen.add(code);
    const row = rows.get(normalizePsgc(code))!;
    expect(row, code).toBeDefined();
    expect(name, code).toBe(row.name);
    const source = index.municities.find(item => normalizePsgc(item.psgc) === code)!;
    expect(viewRegion(source.province_psgc, source.region_psgc, 'nir'), `Current PSA region ${code}`).toBe(normalizePsgc(row.region));
    if (row.province && row.cityClassification !== 'hucs' && row.cityClassification !== 'iccs') {
      expect(provinceAliases[pad(source.province_psgc)] ?? pad(source.province_psgc), `Current PSA province ${code}`).toBe(row.province);
    }
    expect(region, code).toBe(viewRegion(source.province_psgc, source.region_psgc, alignment));
    if (province) expect(province, code).toBe(normalizePsgc(source.province_psgc));
  };
  for (const region of (await repository.national()).collection.features) {
    const regionCode = featureCode(region, 'region');
    const regional = await repository.region(regionCode);
    if (regional.level === 'municity') {
      for (const city of regional.collection.features) check(featureCode(city, 'municity'), city.properties.adm3_en, regionCode);
      continue;
    }
    for (const province of regional.collection.features) {
      const provinceCode = featureCode(province, 'province');
      if (provinceCode === '1909900000') continue; // Source SGA has no usable municipal geometry.
      for (const city of (await repository.province(provinceCode)).collection.features) check(featureCode(city, 'municity'), city.properties.adm3_en, regionCode, provinceCode);
    }
  }
  expect(seen.size).toBe(1629); // 1,634 indexed identities minus five source null geometries.
  expect(facts.records.filter(row => !seen.has(normalizePsgc(row.mapPsgc))).map(row => row.mapPsgc).sort()).toEqual([
    '0403425000', '0405807000', '0806419000', '1204712000', '1705321000',
  ]);
});

it.each(['nir', 'legacy'] as const)('opens every official NIR/Sulu city identity with correct parents in %s alignment', async alignment => {
  const { repository, config } = geographyFixture({ alignment });
  const national = (await repository.national()).collection;
  for (const [source, current] of Object.entries(aliases)) {
    const row = facts.records.find(item => item.psgc === current)!;
    const parent = index.municities.find(item => pad(item.psgc) === source)!;
    const officialProvince = provinceAliases[pad(parent.province_psgc)] ?? pad(parent.province_psgc);
    const view = await resolveView(parseRoute(`#/region/${row.region}/province/${officialProvince}/municity/${current}`), config, national, repository);
    const expectedRegion = viewRegion(parent.province_psgc, parent.region_psgc, alignment);
    expect(formatRoute(view.route)).toBe(`#/region/${expectedRegion}/province/${normalizePsgc(parent.province_psgc)}/municity/${normalizePsgc(source)}`);
    expect(view.details?.name).toBe(row.name);
    if (current.startsWith('18')) {
      const formerRegion = pad(parent.province_psgc) === '0604500000' ? '600000000' : '700000000';
      const saved = await resolveView(parseRoute(`#/region/${formerRegion}/province/${parent.province_psgc}/municity/${source}`), config, national, repository);
      expect(saved.route).toEqual(view.route);
    }
  }
});

it('updates names without mutating source properties, geometry or codes', () => {
  for (const [code, name] of Object.entries(currentMunicipalNames)) {
    const original = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { adm3_psgc: Number(code), adm3_en: 'Old name' }, geometry: { type: 'Polygon', coordinates: [[[120, 5], [121, 5], [121, 6], [120, 5]]] } }] };
    const source = parseGeography(original, 'municity');
    const result = withCurrentNames(source, 'municity');
    expect(result.collection.features[0].geometry).toBe(source.collection.features[0].geometry);
    expect(result.collection.features[0].properties.adm3_psgc).toBe(Number(code));
    expect(result.collection.features[0].properties.adm3_en).toBe(name);
    expect(source.collection.features[0].properties.adm3_en).toBe('Old name');
  }
});

it('does not count the SGA as a sixth BARMM province or label Isabela City as a province', async () => {
  const { repository, config } = geographyFixture();
  const national = (await repository.national()).collection;
  const barmm = await resolveView(parseRoute('#/region/1900000000'), config, national, repository);
  expect(barmm.statusText).toContain('5 provinces and Special Geographic Area');
  const isabela = await resolveView(parseRoute('#/region/900000000/province/990100000'), config, national, repository);
  expect(isabela.details?.typeLabel).toBe('City · map navigation grouping');
});
